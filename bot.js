var config = require('./config/default.json');
var irc = require("irc");
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
//var randomWords = require('better-random-words');

warningMsg = '['+config.colours.warning+'WARNING]'
errorMsg = '['+config.colours.error+'ERROR]'

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

async function help(chan, sub) {
    if (sub === undefined) {
        var sub = "default"
    }
    if (sub === "default") {
        bot.say(chan, '   ____ ___  ___  ____________  _________  __')
        bot.say(chan, '  / __ `__ \\/ _ \\/ ___/ ___/ / / / ___/ / / /')
        bot.say(chan, ' / / / / / /  __/ /  / /__/ /_/ / /  / /_/ / ')
        bot.say(chan, '/_/ /_/ /_/\\___/_/   \\___/\\__,_/_/   \\__, /  ')
        bot.say(chan, '                                    /____/   ')
        bot.say(chan, 'Mercury - https://git.supernets.org/hogwart7/mercury')
        bot.say(chan, 'm!feed [FEED] [ENTRIES] - Return the last x amount of entries from any RSS feed')
        bot.say(chan, "m!twitter [USER] [ENTRIES] - Return the last x amount of tweets from a particular user")
    }
}

async function opt(chan, user, setting, setting2, value) {
    //if (provfeed === undefined) {
    //    bot.say(chan, errorMsg+" No feed has been provided.")
    //    return;
    //}
    //if (n === undefined) {
    //    var n = config.feed.default_amount;
    //}
    const worker = new Worker('./commands/options.js', { 
        workerData: {
            user,
            setting,
            setting2,
            value
        }
    });
    worker.once('message', (string) => {
        console.log('Received output from last5 worker, posting.');
        bot.say(chan, string);
    });
}

async function feed(chan, provfeed, n) {
    if (provfeed === undefined) {
        bot.say(chan, errorMsg+" No feed has been provided.")
        return;
    }
    if (n === undefined) {
        var n = config.feed.default_amount;
    }
    const worker = new Worker('./commands/feed.js', { 
        workerData: {
            provfeed,
            n
        }
    });
    worker.once('message', (string) => {
        console.log('Received output from last5 worker, posting.');
        bot.say(chan, string);
    });
}

async function twitter(chan, provfeed, n) {
    if (provfeed === undefined) {
        bot.say(chan, errorMsg+" No account has been provided.")
        return;
    }
    if (n === undefined) {
        var n = config.twitter.default_amount;
    }
    const worker = new Worker('./commands/twitter.js', { 
        workerData: {
            provfeed,
            n
        }
    });
    worker.once('message', (string) => {
        console.log('Received output from twitter worker, posting.');
        bot.say(chan, string);
    });
}

bot.addListener('message', function(nick, to, text, from) {
    var args = text.split(' ');
    if (args[0] === config.irc.prefix+'help') {
        help(to, args[1]);
    } else if (args[0] === config.irc.prefix+'feed') {
        feed(to, args[1], args[2]);
    } else if (args[0] === config.irc.prefix+'twitter') {
        twitter(to, args[1], args[2])
    } else if (args[0] === config.irc.prefix+'set') {
        opt(to, nick, args[1], args[2], args[3])
    }
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

console.log('Starting Mercury');