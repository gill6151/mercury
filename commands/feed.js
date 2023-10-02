const config = require('../config/default.json')
const { parentPort, workerData } = require('worker_threads');
const { provfeed, n } = workerData;
let Parser = require('rss-parser');
let parser = new Parser({
    headers: {'User-Agent': config.feed.useragent},
});
const striptags = require("striptags");
const moment = require('moment'); 
const tz = require('moment-timezone');
const timer = ms => new Promise(res => setTimeout(res, ms))

async function sendUpstream(content) {
    var output = content.join("\n")
    parentPort.postMessage(output);
    process.exit()
}

function errorMessage(error, code, extra) {
    console.log(error.code)
    if (code == "404") {
        var error = "[04ERROR] 404: " + extra + " not found"
    } else if (error.code == "ECONNREFUSED") {
        var error = "[04ERROR] Connection Refused"
    } else if (error.code == "ERR_UNESCAPED_CHARACTERS"){
        var error = "[04ERROR] Unescaped Characters"
    } else { 
        var error = "[04ERROR] Unknown error"
    }
    
    parentPort.postMessage(error);
    process.exit()
}

async function fetchFeed(feedURL, n) {
    var content = [];
    try {
        var newFeed = await parser.parseURL(feedURL);
    } catch (e) {
        if (e.code !== undefined) {
            errorMessage(e)
        } else {
            errorMessage(e, "404", feedURL);
        }
    }
    if (n > newFeed.items.length) {
        var n = newFeed.items.length;
        content.push("[08WARNING] Your requested post amount exceeded the total available. Reverting to " + newFeed.items.length);
    } else if (n < 1) {
        var n = 5
        content.push("[08WARNING] You requested a number less than 1. Reverting to 5");
    }
    //for (let i = 0; i < newFeed.items.length; i++) {
    for (let i = 0; i < n; i++) {
        var data = newFeed.items[i]
        var title = data.title.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var title = striptags(title);
        var body = data.contentSnippet.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var body = striptags(body);
       if (data.isoDate !== undefined) {
            var date = moment(data.isoDate)
            var syncDate = date.tz(config.feed.timezone)
            console.log(syncDate.format())
            var date = syncDate.format(config.feed.time_format)
        } else {
            var date = data.pubDate
        }
        if (body.length >= config.feed.body_max_chars) {
            var truncatedString = body.substring(0,config.feed.body_max_chars);
            var body = truncatedString + "..."
        }
        console.log(data);
        var string = "15[11" + date + "15] 08" + title + " " + body + " " + data.link;
        var output = string;
        content.push(output)
    }
    sendUpstream(content);
}

fetchFeed(provfeed, n);
