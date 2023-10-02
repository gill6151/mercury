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
        bot.say(chan, 'Mercury RSS Client - https://git.supernets.org/hogwart7/mercury')
        bot.say(chan, 'm!feed [USER/FEED/ALIAS] [ENTRIES] - Return the last x amount of entries from any RSS feed or your own saved feeds (if you have saved feeds)')
        bot.say(chan, "m!twitter [USER] [ENTRIES] - Return the last x amount of tweets from a particular user")
        bot.say(chan, "m!opt [CATEGORY] [OPTION] [VALUE] - Control bot options, see wiki for info on usage.")
    }
}

async function opt(chan, user, setting, setting2, value, value2) {
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
            value,
            value2
        }
    });
    worker.once('message', (string) => {
        console.log('Received output from options worker, posting.');
        bot.say(chan, string);
    });
}

async function feed(chan, nick, provfeed, n) {
    var userconf = fs.readFileSync('./config/usersettings.json')
    var uconfig = JSON.parse(userconf)
    //var uconfig = require('./config/usersettings.json');
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
    if (isValidUrl(provfeed) === true) {
        const worker = new Worker('./commands/feed-preset.js', { 
            workerData: {
                provfeed,
                n
            }
        });
        worker.once('message', (string) => {
            console.log('Received output from feed-preset worker, posting.');
            bot.say(chan, string);
            return;
        });
    } else if (provfeed === nick) {
        if ( uconfig[nick] !== undefined ) {
            const worker = new Worker('./commands/feed-list.js', { 
                workerData: {
                    provfeed,
                    n,
                    nick
                }
            });
            worker.once('message', (string) => {
                console.log('Received output from feed-list worker, posting.');
                bot.say(chan, string);
                return;
            });
        } else {
            bot.say(chan, "You have no saved feeds")
            return;
        }
    } else if (uconfig[nick].alias !== undefined ) {
        var provfeed = uconfig[nick].alias[provfeed]
        const worker = new Worker('./commands/feed-preset.js', { 
            workerData: {
                provfeed,
                n,
                nick
            }
        });
        worker.once('message', (string) => {
            console.log('Received output from feed-list worker, posting.');
            bot.say(chan, string);
            return;
        });
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