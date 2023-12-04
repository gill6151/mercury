//  Mercury RSS Client - git.supernets.org/hgw/mercury
//       ____ ___  ___  ____________  _________  __
//      / __ `__ \/ _ \/ ___/ ___/ / / / ___/ / / /
//     / / / / / /  __/ /  / /__/ /_/ / /  / /_/ / 
//    /_/ /_/ /_/\___/_/   \___/\__,_/_/   \__, /  
//     COLD HARD FEEDS                    /____/   
//
//var config = require('./config/default.json');
//var uconfig = require('./config/usersettings.json');
var irc = require("irc");
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
const { setMaxIdleHTTPParsers } = require("http");
//var randomWords = require('better-random-words');

const timer = ms => new Promise(res => setTimeout(res, ms))

console.log('[bot] Checking if config file exists')
if (fs.existsSync('./config/default.json')) {
    var config = require('./config/default.json');
    console.log('[bot] Config file exists, can proceed with initialisation')
} else {
    console.log('[bot] The config file, default.json, does not exist in the config folder. Mercury can not start.')
    process.exit() 
}
timer(100)

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


const isValidUrl = urlString=> {
    var urlPattern = new RegExp('^(https?:\\/\\/)?'+ // validate protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // validate domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // validate OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // validate port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // validate query string
    '(\\#[-a-z\\d_]*)?$','i'); // validate fragment locator
    consoleLog('[bot.isValidUrl] Testing URL: '+urlString)
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

function checkConfigValidity() {
    consoleLog(`[bot.checkConfigValidity] Opening config validator`)
    const worker = new Worker(`./commands/cvc.js`, {});
    worker.once('message', (string) => {
        if (string == 'kill') {
            process.exit()
        } else if (string == 'allg') {
            consoleLog('[bot.checkConfigValidity] Config seems valid, continuing')
        }
    });
}

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
    if (sub != undefined ) {
        var sub = sub.toLowerCase()
    }
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
        openPostWorker(chan, "feed-predef", provfeed, n, nick)
   
    } else if (provfeed === nick) { //User Feed Lookup
        consoleLog('[bot.feed] User feed requested')
        if ( uconfig[nick] !== undefined ) { //If users nickname exists in json file
            openPostWorker(chan, 'feed-list', provfeed, n, nick);
        } else { //If it does not
            bot.say(chan, "You have no saved feeds")
            return;
        }
    } else if (uconfig[nick].alias[provfeed.toUpperCase()] !== undefined ) { //Alias Lookup
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
                if (args[1] == undefined ) {
                    help(to, "feed")
                } else {
                    feed(to, nick, args[1], args[2]);
                }
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

async function init() {
    consoleLog('[bot.init] Checking if user settings file exists')
    fs.open('./config/usersettings.json','r',function(err, fd){
        if (err) {
            fs.writeFile('./config/usersettings.json', '', function(err) {
                if(err) {
                    consoleLog(err);
                    consoleLog('[bot.init] [FATAL] User settings file could not be created. Mercury can not start')
                    process.exit()  
                }
            });
            try {
                fs.writeFileSync('./config/usersettings.json', "\{\n\}")
            } catch(e) {
                consoleLog(e)
                consoleLog('[bot.init] [FATAL] User settings file was created but is not writable, could be a permissions issue. Mercury can not start')
                process.exit()
            }
            timer(100)
            consoleLog('[bot.init] User settings file has been created')
        } else {
            consoleLog("[bot.init] User settings file exists");
        }
    });
    await timer(500)
    try {
        if (config.errorhandling.validity_override === "TRUE") {
            consoleLog('[bot.init] [WARNING] Config validity override switch enabled, will not check for validity. This may have unintended side-effects, if you run in to issues with this enabled, you are on your own.')
        }
    } catch(e) {
        consoleLog('[bot.init] Checking config validity')
        checkConfigValidity()
    }
    await timer(2000)
    if (config.irc.ssl == "true") {
        consoleLog('[bot.init] Initialisation completed, connecting to '+config.irc.server+'/'+config.irc.port+' (SSL) as '+config.irc.nickname); 
    } else {
        consoleLog('[bot.init] Initialisation completed, connecting to '+config.irc.server+'/'+config.irc.port+' as '+config.irc.nickname); 
    }
    consoleLog('[bot] Welcome to Mercury');   
}

init()

process.on('uncaughtException', function (err) {
    console.error(err);
    if (config.errorhandling.log_errors_to_irc == 'true') {
        bot.say(config.errorhandling.error_channel, errorMsg+" "+err.stack.split('\n',1).join(" "))
    }
}); 