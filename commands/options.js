const config = require('../config/default.json')
const uconfig = require('../config/usersettings.json')
const { parentPort, workerData } = require('worker_threads');
const { user, setting, setting2, value } = workerData;
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
    } else {
        var error = errorMsg+" Unknown error"
    }
    parentPort.postMessage(error);
    process.exit()
}

async function testFeed(feedURL) {
    try {
        var feed = await parser.parseURL(feedURL);
    } catch (e) {
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
}

if (setting === 'feed') {
    feed(user, setting2, value);
}
