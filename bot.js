var irc = require("irc");
var config = require('config');
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
//var randomWords = require('better-random-words');

var connconfig = {
    server: config.get('irc.server'),
    port: config.get('irc.port'),
    SSL: config.get('irc.ssl'),
    channels: config.get('irc.channels'),
    botName: config.get('irc.nickname'),
    userName: config.get('irc.username'),
    realName: config.get('irc.realname')
};

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
        bot.say(chan, 'Mercury - https://git.supernets.org/hogwart7/mercury')
        bot.say(chan, 'm!l5 [FEED] - Return the last 5 entries in any RSS feed.')
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

bot.addListener('message', function(nick, to, text, from) {
    var args = text.split(' ');
    if (args[0] === 'm!help') {
        help(to, args[1]);
    } else if (args[0] === 'm!feed') {
        feed(to, args[1], args[2]);
    }
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

console.log('Starting Mercury');