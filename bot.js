var irc = require("irc");
var config = require('config');
var fs = require("fs");
var readline = require('readline');
const { Worker } = require('worker_threads');
//var randomWords = require('better-random-words');

var connconfig = { //edit your shit here
    server: config.get('irc.server'),
    port: config.get('irc.port'),
    SSL: config.get('irc.port'),
    channels: config.get('irc.channels'),
    botName: config.get('irc.nickname'),
    userName: config.get('irc.username'),
    realName: config.get('irc.realname')
};

var bot = new irc.Client(connconfig.server, connconfig.botName, {
    channels: connconfig.channels,
    secure: connconfig.SSL,
    port: connconfig.port,
    autoRejoin: true,
    userName: connconfig.userName,
    realName: connconfig.realName,
    floodProtection: false,
    floodProtectionDelay: 0
});

const timer = ms => new Promise(res => setTimeout(res, ms))

async function help(chan, sub) {
    if (sub === undefined) {
        var sub = "default"
    }
    if (sub === "default") {
        bot.say(chan, 'Mercury - https://git.supernets.org/hogwart7/mercury')
        bot.say(chan, "r!set [OPTION] [VALUE] - run r!help set for details")
    }
}


async function rspam(chan, amt) {
    var arr = []
    if (amt > 10000) {
        bot.say(chan, "no")
    } else {
        if (amt === undefined) {
            var amt = 100
        }
        for(var i=0; i < amt; i++){
            var string = generateRandomString(70);
            await timer(2);
            arr.push(string)
        }
        var output = arr.join("\n")
        bot.say(chan, output);
    }
}


async function godwords(chan, amt) {
    if (amt > 100000) {
        bot.say(chan, "no")
    } else {
        if (amt === undefined) {
            var amt = 50
        }
        const worker = new Worker('./commands/godwords.js', { 
            workerData: {
                amt
            }
        });
        worker.once('message', (string) => {
            console.log('Received string from worker, posting.');
            bot.say(chan, string);
        });
    }
}

bot.addListener('message', function(nick, to, text, from) {
    var args = text.split(' ');
    if (args[0] === 'r!help') {
        help(to, args[1]);
    }
});

bot.addListener('error', function(message) {
	console.log('error: ', message);
});

console.log('Starting Fascinus');