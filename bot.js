var irc = require("irc");
var config = require('config');
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
//var randomWords = require('better-random-words');

var bot = new irc.Client(config.get('irc.server'), config.get('irc.nickname'), {
    channels: config.get('irc.channels'),
    secure: config.get('irc.ssl'),
    port: config.get('irc.port'),
    autoRejoin: config.get('irc.autorejoin'),
    userName: config.get('irc.username'),
    realName: config.get('irc.realname'),
    floodProtection: config.get('irc.floodprotection'),
    floodProtectionDelay: config.get('irc.floodprotectiondelay')
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
        bot.say(chan, "m!set [OPTION] [VALUE] - run r!help set for details")
    }
}

async function feed(chan, provfeed, n) {
    if (provfeed === undefined) {
        bot.say(chan, "No feed has been provided.")
    }
    if (n === undefined) {
        var n = 5;
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
        bot.say(chan, "No account has been provided.")
    }
    if (n === undefined) {
        var n = 5;
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
    if (args[0] === 'm!help') {
        help(to, args[1]);
    } else if (args[0] === 'm!feed') {
        feed(to, args[1], args[2]);
    } else if (args[0] === 'm!twitter') {
        twitter(to, args[1], args[2])
    }
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

console.log('Starting Mercury');