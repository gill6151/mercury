const config = require('../config/default.json')
const uconfig = require('../config/usersettings.json')
const { parentPort, workerData } = require('worker_threads');
const { d1, d2, d3, d4, d5, d6 } = workerData;
var user = d1;
var setting = d2;
var setting2 = d3;
var value = d4;
var value2 = d5;
var hostmask = d6
const fs = require('fs-extra')
let Parser = require('rss-parser');
let parser = new Parser({
    headers: {'User-Agent': config.feed.useragent},
});
const editJsonFile = require("edit-json-file");
const timer = ms => new Promise(res => setTimeout(res, ms))
const moment = require('moment-timezone');


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
    parentPort.postMessage(content);
    process.exit()
}

function errorMessage(error, code, extra) {
    consoleLog('[options.errorMessage] '+error.code)
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
        consoleLog('[options.testFeed] Testing '+feed)
        var feed = await parser.parseURL(feedURL);
    } catch (e) {
        consoleLog('[options.testFeed] '+e)
        errorMessage(e, "INVALID", feedURL);
    }
    consoleLog("[options.testFeed] Feed is valid, continuing")
}

async function feed(nick, setting, value) {
    if (setting === 'add') {
        consoleLog('[options.feed] '+nick+' is adding '+value)
        await testFeed(value);
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        try {
            var feedsArr = uconfig[nick].feeds
            if (feedsArr.includes(value) == true) {
                errorMessage("null", "ALREADYEXISTS", value)
                return;
            }
        } catch (e) {
            consoleLog('[options.feed] No user feed list in usersettings.json, it will be made')
        }
        file.append(nick+".feeds", value);
        file.save();
        sendUpstream(value + ' added to your feed list')
        
    }
    if (setting === 'list') {
        content = [];
        try {
            var feedsArr = uconfig[nick].feeds
            consoleLog('[options.feed] Listing existing feeds for '+nick+': '+feedsArr)
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
        var value = value.toUpperCase()
        consoleLog('[options.alias] Adding/editing an alias for'+nick+': '+value+' ==> '+url)
        await testFeed(url);
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        file.set(nick+'.alias.'+value.toUpperCase(), url);
        file.save();
        sendUpstream('Alias added ('+value.toUpperCase()+' ==> '+url+')')
    }
    if (setting === 'del') {
        consoleLog('[options.alias] Removing an alias for '+nick+': '+value+' ==> \"\"')
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        file.set(nick+'.alias.'+value.toUpperCase(), "");
        file.save();
        sendUpstream('Alias removed ('+value.toUpperCase()+' ==> BTFO\'d)')
    }
    if (setting === 'list') {
        content = [];
        var obj = uconfig[nick].alias
        consoleLog('[options.alias] Listing aliases for '+nick+': '+obj)
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

async function get(setting, hostmask, nick) {
    if (setting == "hostmask") {
        sendUpstream('Your hostmask ==> '+hostmask)
    } else if (setting == "user.tz" || setting == "user.timezone" ) {
        var file = editJsonFile('/home/node/app/config/usersettings.json')
        sendUpstream(setting + ' ==> ' + file.get(nick+".timezone"))
    } else {
        consoleLog('[options.get] Getting value of '+setting)
        var file = editJsonFile('/home/node/app/config/default.json')
        consoleLog(setting + ' ==> ' + file.get(setting));
        if ( file.get(setting) == undefined) {
            sendUpstream(setting + 'is not a valid setting')
        } else {
            sendUpstream(setting + ' ==> ' + file.get(setting))
        }
    }
}

async function set(setting, value, value2, nick) {
    if (setting == 'user.tz' || setting == 'user.timezone') {
        content = []
        var tzarray = moment.tz.names().map(a => a.toLowerCase())
        if (tzarray.includes(value.toLowerCase()) == false) {
            consoleLog('[options.set.tz] Invalid timezone entered')
            sendUpstream(errorMsg+' Invalid timezone entered, not changing')
        }
        var file = editJsonFile('/home/node/app/config/usersettings.json');
        if (uconfig[nick].timezone == undefined || uconfig[nick].timezone == "" ) {
            var oldvalue = "Unset"
        } else {
            var oldvalue = file.get(nick+".timezone")
        }
        consoleLog('[options.set.tz] Adding/editing the timezone for'+nick+': '+oldvalue+' ==> '+value)
        file.set(nick+".timezone", value)
        file.save()
        content.push(setting+' ==> ' +oldvalue+' (PREVIOUS)')
        content.push(setting+ ' ==> '+file.get(nick+".timezone")+' (UPDATED)')
        var output = content.join("\n")
        sendUpstream(output)    
    }
}

async function operset(setting, value, value2, hostmask) {
    content = []
    if (value2 == "-s" || value2 == '--spaces') {
        consoleLog('[options.operset] ' + value2+' called, replacing all dashes with spaces')
        var value = value.replace(/-/g,' ')
    }
    var file = editJsonFile('/home/node/app/config/default.json')
    var disallowedSettings = [
        "irc",
        "twitter",
        "motd"
    ]
    var disallowedCheck = setting.split(".")
    var disallowedCheck = disallowedCheck[0]
    if (config.irc.settings_auth_enable == 'true' ) {
        if (hostmask != config.irc.settings_auth_hostmask) {
            consoleLog('[options.operset] Unauthorised user '+hostmask+' attempted to set '+setting+' to '+value)
            sendUpstream(errorMsg+' You are not permitted to perform this action')
        }
    }
    if (file.get(setting) == undefined) {
        consoleLog('[options.operset] '+setting+' is not a valid setting')
        sendUpstream(errorMsg+' '+setting+' is not a valid setting or has not been defined')
    }
    if (disallowedSettings.includes(disallowedCheck)) {
        consoleLog('[options.operset] '+hostmask+' attempted to edit disallowed setting category: '+disallowedCheck)
        sendUpstream(errorMsg+" You may not modify this setting")
    }
    if (setting == "feed.timezone") {
        var tzarray = moment.tz.names().map(a => a.toLowerCase())
        if (tzarray.includes(value.toLowerCase()) == false) {
            consoleLog('[options.operset] Invalid timezone entered')
            content.push(warningMsg+' Invalid timezone entered, changing anyways but output will default to Etc/UTC')
        }
    }
    var oldvalue = file.get(setting)
    file.set(setting, value);
    file.save();
    content.push(setting+' ==> ' +oldvalue+' (PREVIOUS)')
    content.push(setting+ ' ==> '+file.get(setting)+' (UPDATED)')
    var output = content.join("\n")
    sendUpstream(output)
}

if (setting === 'feed') {
    feed(user, setting2, value);
} else if (setting === 'list') {
    feed(user, setting2)
} else if (setting === 'get') {
    get(setting2, hostmask, user);
} else if(setting === 'alias') {
    alias(setting2, value, value2, user)
} else if(setting === 'operset') {
    operset(setting2, value, value2, hostmask)
} else if(setting === 'set') {
    set(setting2, value, value2, user)
}  else {
    sendUpstream(errorMsg+' '+setting+' is not a valid option')
}
