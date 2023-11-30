const config = require('../config/default.json')
const uconfig = require('../config/usersettings.json')
const { parentPort, workerData } = require('worker_threads');
const { d1, d2, d3 } = workerData;
var provfeed = d1;
var n = d2
var nick = d3
let Parser = require('rss-parser');
let parser = new Parser({
    headers: {'User-Agent': config.feed.useragent},
});
const striptags = require("striptags");
const moment = require('moment'); 
const tz = require('moment-timezone');
const timer = ms => new Promise(res => setTimeout(res, ms))

warningMsg = ''+config.colours.brackets+'['+config.colours.warning+'WARNING'+config.colours.brackets+']'
errorMsg = ''+config.colours.brackets+'['+config.colours.error+'ERROR'+config.colours.brackets+']'

function consoleLog(log) {
    if (config.misc.logging === "true") {
        console.log(log)
    } else {
        return;
    }
}

async function sendUpstream(content) {
    var output = content.join("\n")
    parentPort.postMessage(output);
    process.exit()
}

function errorMessage(error, code, extra) {
    consoleLog('[feed-predef.errorMessage] '+error.code)
    if (code == "404") {
        var error = errorMsg+" 404: " + extra + " not found"
    } else if (error.code == "ECONNREFUSED") {
        var error = errorMsg+" Connection Refused"
    } else if (error.code == "ERR_UNESCAPED_CHARACTERS"){
        var error = errorMsg+" Unescaped Characters"
    } else if (error.code == "INVALIDTYPE") {
        var error = errorMsg+' \"'+extra+'\" is not a valid type'
    } else { 
        var error = errorMsg+" Unknown error"
    }
    
    parentPort.postMessage(error);
    process.exit()
}

async function twitter(feedURL, n, nick) {
    var content = [];
    consoleLog('[feed-predef.twitter] fetching @'+feedURL)

    if (feedURL.startsWith('@') == true) {
        consoleLog('[feed-predef.twitter] User passed @ in input, removing')
        var feedURL = feedURL.substring(1,feedURL.length);
    }
    var randomNitter = config.twitter.nitter_instances[Math.floor(Math.random() * config.twitter.nitter_instances.length)];
    var feedURL = "https://" + randomNitter + "/" + feedURL + "/rss"
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
        content.push(warningMsg+" Your requested post amount exceeded the total available. Reverting to " + newFeed.items.length);
    } else if (n < 1) {
        var n = config.twitter.default_amount
        content.push(warningMsg+" You requested a number less than 1. Reverting to default ("+config.twitter.default_amount+")");
    }

    for (let i = 0; i < n; i++) {

        await timer(50);

        var data = newFeed.items[i]
        var title = data.title.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var title = striptags(title);
        var body = data.contentSnippet.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var body = striptags(body);

        if (data.isoDate !== undefined) {
            var date = moment(data.isoDate)
            if (uconfig[nick].timezone != undefined) {
                var syncDate = date.tz(uconfig[nick].timezone) 
            } else {
                var syncDate = date.tz(config.feed.timezone)
            }
            consoleLog('[feed-predef.twitter] Got tweet from '+syncDate.format())
            var date = syncDate.format(config.feed.time_format)
        } else {
            var date = data.pubDate
        }

        if (body.length >= config.feed.body_max_chars) {
            var truncatedString = body.substring(0,config.feed.body_max_chars);
            var body = truncatedString + "..."
        }

        date = ''+config.colours.brackets+'['+config.colours.date+date+''+config.colours.brackets+'] '
        title = ''+config.colours.title+title+' '
        author = ''+config.colours.author+data.creator+' '
        body = ''+config.colours.body+body+' '
        link = ''+config.colours.link+data.link+' '

        //console.log(data);
        //var string = "15[11" + date + "15] 08" + data.creator + " " + body + " " + data.link;
        var string = date+author+body+link
        content.push(string)
    }
    sendUpstream(content);
}

async function github(user, repo, type, n, nick) {
    var content = [];
    var validTypes = ['commits', 'releases']
    if ( validTypes.includes(type) == false ) {
        errorMessage(e, "INVALIDTYPE", type);
    }
    consoleLog('[feed-predef.github] fetching '+user+'/'+repo+' '+type)

    var feedURL = "https://github.com/"+user+"/"+repo+"/"+type+".atom"
    try {
        var newFeed = await parser.parseURL(feedURL);
    } catch (e) {
        if (e.code !== undefined) {
            errorMessage(e)
        } else {
            errorMessage(e, "404", feedURL);
        }
    }
    //consoleLog(newFeed.items[1])
    if (n > newFeed.items.length) {
        var n = newFeed.items.length;
        content.push(warningMsg+" Your requested post amount exceeded the total available. Reverting to " + newFeed.items.length);
    } else if (n < 1) {
        var n = config.twitter.default_amount
        content.push(warningMsg+" You requested a number less than 1. Reverting to default ("+config.twitter.default_amount+")");
    }

    for (let i = 0; i < n; i++) {

        await timer(50);

        var data = newFeed.items[i]
        var title = data.title.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var title = striptags(title);
        var body = data.contentSnippet.replace(/(\r\n|\n|\r)/gm, " ") //remove line breaks
            .replace(/\s{2,}/g, ' ') //idk
        var body = striptags(body);

        if (data.isoDate !== undefined) {
            var date = moment(data.isoDate)
            try {
                var syncDate = date.tz(uconfig[nick].timezone) 
            } catch(e) {
                var syncDate = date.tz(config.feed.timezone)
            }
            var date = syncDate.format(config.feed.time_format)
        } else {
            var date = data.pubDate
        }

        if (body.length >= config.feed.body_max_chars) {
            var truncatedString = body.substring(0,config.feed.body_max_chars);
            var body = truncatedString + "..."
        }

        var date = ''+config.colours.brackets+'['+config.colours.date+date+''+config.colours.brackets+'] '
        var author = ''+config.colours.author+data.author+' '
        var body = ''+config.colours.body+title.substring(1)+' '
        var link = ''+config.colours.link+data.link+' '

        //console.log(data);
        //var string = "15[11" + date + "15] 08" + data.creator + " " + body + " " + data.link;
        var string = date+author+body+link
        content.push(string)
    }
    sendUpstream(content);
}

var provfeed = provfeed.toLowerCase().split("/")
if (provfeed[0] == "twitter") {
    consoleLog("[feed-predef] Running twitter function")
    twitter(provfeed[1], n, nick);
} else if (provfeed[0] == "github") {
    if (provfeed[3] == undefined) {
        consoleLog("[feed-predef] No GitHub feed type provided, defaulting to commits")
        var type = "commits"
    } else {
        var type = provfeed[3]
    }
    consoleLog("[feed-predef] Running GitHub function")
    github(provfeed[1], provfeed[2], type, n, nick)
}



