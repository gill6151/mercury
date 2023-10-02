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
    floodProtection: config.irc.floodprotection,
    floodProtectionDelay: config.irc.floodprotectiondelay
});

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

function openPostWorker(chan, command, d1, d2, d3, d4, d5) {
    const worker = new Worker(`./commands/${command}.js`, { 
        workerData: {
        d1, d2, d3, d4, d5
        }
    });
    worker.once('message', (string) => {
        console.log(`${command} worker has signalled it has completed, sending output to IRC`);
        bot.say(chan, string);
    });
}

async function help(chan, sub) {
    openPostWorker(chan, 'help', sub)
}

async function opt(chan, user, setting, setting2, value, value2) {
    openPostWorker(chan, 'options', user, setting, setting2, value, value2)
}

async function feed(chan, nick, provfeed, n) {
    var userconf = fs.readFileSync('./config/usersettings.json')
    var uconfig = JSON.parse(userconf)

    if (provfeed === undefined) {
        bot.say(chan, errorMsg+" No feed has been provided.")
        return;
    } else if (provfeed === 'me' ) {
        var provfeed = nick;
    }
    if (n === undefined) {
        var n = config.feed.default_amount;
    }

    console.log(isValidUrl(provfeed))
    console.log(provfeed === nick)
    console.log(uconfig[nick].alias !== undefined)

    if (isValidUrl(provfeed) === true) { //URL Lookup
        openPostWorker(chan, 'feed-preset', provfeed, n);
    } else if (provfeed === nick) { //User Feed Lookup
        if ( uconfig[nick] !== undefined ) { //If users nickname exists in json file
            openPostWorker(chan, 'feed-list', provfeed, n, nick);
        } else { //If it does not
            bot.say(chan, "You have no saved feeds")
            return;
        }
    } else if (uconfig[nick].alias !== undefined ) { //Alias Lookup
        var provfeed = uconfig[nick].alias[provfeed]
        openPostWorker(chan, "feed-preset", provfeed, n);
    } else {
        bot.say(chan, 'Not sure how you managed to get this error, but good job')
    }
}

async function twitter(chan, provfeed, n) {
    if (provfeed === undefined) {
        bot.say(chan, errorMsg+" No account has been provided.")
        return;
    }
    if (n === undefined) {
        var n = config.twitter.default_amount;
    }
    openPostWorker(chan, "twitter", provfeed, n)
}

bot.addListener('message', function(nick, to, text, from) {
    var args = text.split(' ');
    if (args[0] === config.irc.prefix+'help') {
        help(to, args[1]);
    } else if (args[0] === config.irc.prefix+'feed') {
        feed(to, nick, args[1], args[2]);
    } else if (args[0] === config.irc.prefix+'twitter') {
        twitter(to, args[1], args[2])
    } else if (args[0] === config.irc.prefix+'opt') {
        opt(to, nick, args[1], args[2], args[3], args[4])
    }
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

console.log('Starting Mercury');