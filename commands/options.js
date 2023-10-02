const config = require('../config/default.json')
const uconfig = require('../config/usersettings.json')
const { parentPort, workerData } = require('worker_threads');
const { d1, d2, d3, d4, d5 } = workerData;
var user = d1;
var setting = d2;
var setting2 = d3;
var value = d4;
var value2 = d5;
const fs = require('fs-extra')
let Parser = require('rss-parser');
let parser = new Parser({
    headers: {'User-Agent': config.feed.useragent},
});
const editJsonFile = require("edit-json-file");
const timer = ms => new Promise(res => setTimeout(res, ms))

warningMsg = ''+config.colours.brackets+'['+config.colours.warning+'WARNING'+config.colours.brackets+']'
errorMsg = ''+config.colours.brackets+'['+config.colours.error+'ERROR'+config.colours.brackets+']'

async function sendUpstream(content) {
    parentPort.postMessage(content);
    process.exit()
}

function errorMessage(error, code, extra) {
    console.log(error.code)
    if (code == "404") {
        var error = errorMsg+" 404: " + extra + " not found"
    } else if (error.code == "ECONNREFUSED") {
        var error = errorMsg+" Connection Refused"
    } else if (error.code == "ERR_UNESCAPED_CHARACTERS"){
        var error = errorMsg+" Unescaped Characters"
    } else if (code == "INVALID") {
        var error = errorMsg+' '+extra+' either does not exist or is not a valid feed.'
    } else if (code == "ALREADYEXISTS" ) { 
        var error = errorMsg+' '+extra+' already exists in your feed list.'
    } else if (error == "NOFEEDS") { 
        var error = errorMsg+" No saved feeds for "+provfeed
    } else {
        var error = errorMsg+" Unknown error"
    }
    parentPort.postMessage(error);
    process.exit()
}

async function testFeed(feedURL) {
    try {
        console.log('Testing feed')
        var feed = await parser.parseURL(feedURL);
    } catch (e) {
        console.log(e)
        errorMessage(e, "INVALID", feedURL);
    }
    console.log(feed)
    console.log("Feed is good, saving")
}

async function feed(nick, setting, value) {
    if (setting === 'add') {
        await testFeed(value);
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        var feedsArr = uconfig[nick].feeds
        if (feedsArr.includes(value) == true) {
            errorMessage("null", "ALREADYEXISTS", value)
        } else {
            file.append(nick+".feeds", value);
            file.save();
            sendUpstream(value + ' added to your feed list')
        }
    }
    if (setting === 'list') {
        content = [];
        try {
            var feedsArr = uconfig[nick].feeds
            console.log(feedsArr)
            content.push("These are your added feeds:")
        } catch (e) {
            errorMessage(e, "NOFEEDS", nick);
        }
        for (let i = 0; i < feedsArr.length; i++) {
            content.push(i+1+'. '+feedsArr[i])
        }
        var output = content.join("\n")
        sendUpstream(output)
    }
}

async function alias(setting, value, url, nick) {
    if (setting === 'add') {
        await testFeed(url);
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        file.set(nick+'.alias.'+value, url);
        file.save();
        sendUpstream('Alias added ('+value+' ==> '+url+')')
    }
    if (setting === 'del') {
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        file.set(nick+'.alias.'+value, "");
        file.save();
        sendUpstream('Alias removed ('+value+' ==> BTFO\'d)')
    }
    if (setting === 'list') {
        content = [];
        var obj = uconfig[nick].alias
        console.log(obj)
        for (const [key, val] of Object.entries(obj)) {
            if (val !== "") {
                content.push(key + ' ==> '+val)
            }
        };
        var output = content.join("\n")
        sendUpstream(output);
    }
}

async function get(setting) {
    var file = editJsonFile('/home/node/app/config/default.json')
    console.log(file.get(setting));
    sendUpstream(file.get(setting))
}

if (setting === 'feed') {
    feed(user, setting2, value);
} else if (setting === 'list') {
    feed(user, setting2)
} else if (setting === 'get') {
    get(setting2);
} else if(setting === 'alias') {
    alias(setting2, value, value2, user)
}
