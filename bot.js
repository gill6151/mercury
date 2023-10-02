var config = require('./config/default.json');
//var uconfig = require('./config/usersettings.json');
var irc = require("irc");
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
//var randomWords = require('better-random-words');

warningMsg = ''+config.colours.brackets+'['+config.colours.warning+'WARNING'+config.colours.brackets+']'
errorMsg = ''+config.colours.brackets+'['+config.colours.error+'ERROR'+config.colours.brackets+']'

var bot = new irc.Client(config.irc.server, config.irc.nickname, {
    channels: config.irc.channels,
    secure: config.irc.ssl,
    port: config.irc.port,
    autoRejoin: config.irc.autorejoin,
    userName: config.irc.username,
    realName: config.irc.realname,
    floodProtection: config.floodprotect.flood_protection,
    floodProtectionDelay: config.floodprotect.flood_protection_delay
});

const msgTimeout = new Set();
const msgTimeoutMsg = new Set();

const timer = ms => new Promise(res => setTimeout(res, ms))

const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    return !!urlPattern.test(urlString);
}

function consoleLog(log) {
    if (config.misc.logging === "true") {
        console.log(log)
    } else {
        return;
    }
}

var hostmask = null

function checkUserHostmask(user) {
    return new Promise(function (resolve, reject) {
        setTimeout(() => {
            bot.whois(user, function(callback) {
                hostmask = callback.user+"@"+callback.host
                consoleLog('[main.checkUserHostmask] User hostmask is '+hostmask)
                resolve(hostmask)
            })
        }, 750)
    })
}

function openPostWorker(chan, command, d1, d2, d3, d4, d5, d6) {
    consoleLog(`[bot.openPostWorker] Opening ${command} worker`)
    const worker = new Worker(`./commands/${command}.js`, { 
        workerData: {
        d1, d2, d3, d4, d5, d6
        }
    });
    worker.once('message', (string) => {
        consoleLog(`[bot.openPostWorker.finalising] Got output from ${command}, sending to `+chan);
        bot.say(chan, string);
    });
}

async function help(chan, sub) {
    var sub = sub.toLowerCase()
    openPostWorker(chan, 'help', sub)
}

async function opt(chan, user, setting, setting2, value, value2) {
    if (setting == undefined && setting2 == undefined && value == undefined && value2 == undefined) {
        openPostWorker(chan, 'help', 'opt')
    }
    if (setting == 'operset' || setting == "get") {
        await checkUserHostmask(user)
    }
    openPostWorker(chan, 'options', user, setting, setting2, value, value2, hostmask)
}

async function feed(chan, nick, provfeed, n) {
    var userconf = fs.readFileSync('./config/usersettings.json')
    var uconfig = JSON.parse(userconf)
    if (isValidUrl(provfeed) === false) {
        consoleLog('[bot.feed] Provided feed is not a URL, transforming to lowercase')
        var provfeed = provfeed.toLowerCase()
    }
    var predefinedFeeds = ['twitter', 'github']
    var predefString = provfeed.split("/")
    if (provfeed === undefined) {
        consoleLog('[bot.feed] No feed provided')
        bot.say(chan, errorMsg+" No feed has been provided.")
        return;
    } else if (provfeed === 'me' ) {
        consoleLog('[bot.feed] \"me\" was passed, correcting to '+nick)
        var provfeed = nick;
    }
    if (n === undefined) {
        consoleLog('[bot.feed] No post was passed, reverting to '+config.feed.default_amount+', your set default.')
        var n = config.feed.default_amount;
    }

    if (isValidUrl(provfeed) === true) { //URL Lookup
        consoleLog('[bot.feed] Valid URL requested')
        openPostWorker(chan, 'feed-preset', provfeed, n, nick);

    } else if (predefinedFeeds.includes(predefString[0])) { //Predefined Feed lookup
        consoleLog('[bot.feed] Detected predefined feed: '+predefString[0])
        openPostWorker(chan, "feed-predef", provfeed, n)
   
    } else if (provfeed === nick) { //User Feed Lookup
        consoleLog('[bot.feed] User feed requested')
        if ( uconfig[nick] !== undefined ) { //If users nickname exists in json file
            openPostWorker(chan, 'feed-list', provfeed, n, nick);
        } else { //If it does not
            bot.say(chan, "You have no saved feeds")
            return;
        }
    } else if (uconfig[nick].alias !== undefined ) { //Alias Lookup
        consoleLog('[bot.feed] Alias requested')
        var provfeed = uconfig[nick].alias[provfeed.toUpperCase()]
        openPostWorker(chan, "feed-preset", provfeed, n, nick);
    } else {
        consoleLog('[bot.feed] No valid feed entered')
        bot.say(chan, errorMsg+" Your chosen feed or alias is not valid")
    }
}

async function twitter(chan, provfeed, n) {
    if (provfeed === undefined) {
        consoleLog('[bot.twitter] No twitter account provided')
        bot.say(chan, errorMsg+" No account has been provided.")
        return;
    }
    if (n === undefined) {
        var n = config.twitter.default_amount;
    }
    openPostWorker(chan, "twitter", provfeed, n)
}

bot.addListener('message', function(nick, to, text, from) {
    if (text.startsWith(config.irc.prefix)) {
        if (msgTimeout.has(to)) {
            if (msgTimeoutMsg.has("yes")) {
                return;
            } else {
                bot.say(to, errorMsg+" You are sending commands too quickly")
                msgTimeoutMsg.add("yes");
                setTimeout(() => {
                    msgTimeoutMsg.delete("yes");
                }, config.floodprotect.command_listen_timeout)           
            }
        } else {
            var args = text.split(' ');
            var command = args[0].toLowerCase()
            if (command === config.irc.prefix+'help') {
                help(to, args[1]);
            } else if (command === config.irc.prefix+'feed') {
                feed(to, nick, args[1], args[2]);
            } else if (command === config.irc.prefix+'twitter') {
                twitter(to, args[1], args[2])
            } else if (command === config.irc.prefix+'opt') {
                if (args[1] == undefined ) {
                    help(to, "opt")
                } else {
                    opt(to, nick, args[1], args[2], args[3], args[4])
                }
            }
            msgTimeout.add(to);
            setTimeout(() => {
                msgTimeout.delete(to);
            }, config.floodprotect.command_listen_timeout)
        }
    }
});

bot.addListener('error', function(message) {
    consoleLog('[ERROR]' +message)
});

consoleLog('[bot.init] Welcome to Mercury');
fs.open('./config/usersettings.json','r',function(err, fd){
    if (err) {
      fs.writeFile('./config/usersettings.json', '', function(err) {
          if(err) {
            consoleLog(err);
          }
          consoleLog("[bot.init] usersettings.json did not exist, it has been created");
      });
      fs.writeFileSync('./config/usersettings.json', "\{\n\}")
    } else {
        consoleLog("[bot.init] usersettings.json exists, continuing");
    }
  });
consoleLog('[bot.init] Connecting to '+config.irc.server+'/'+config.irc.port+' as '+config.irc.nickname);

process.on('uncaughtException', function (err) {
    console.error(err);
    if (config.errorhandling.log_errors_to_irc == 'true') {
        bot.say(config.errorhandling.error_channel, errorMsg+" "+err.stack.split('\n',1).join(" "))
    }
}); 