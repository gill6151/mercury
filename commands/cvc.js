const config = require('../config/default.json')
//const uconfig = require('../config/usersettings.json')
const { parentPort, workerData } = require('worker_threads');
//const { d1, d2, d3, d4, d5, d6 } = workerData;
//var user = d1;
//var setting = d2;
//var setting2 = d3;
//var value = d4;
//var value2 = d5;
//var hostmask = d6
const fs = require('fs-extra')
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
    parentPort.postMessage(content);
    process.exit()
}

function errorMessage(error, code, extra) {
    consoleLog('[cvc.errorMessage] '+error.code)
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

function checkValuesExist() {
    const fatalConfigError = new Set();
    var reqConfigs = [
        config.irc.server, config.irc.port, config.irc.ssl, config.irc.channels, config.irc.nickname, config.irc.username, config.irc.realname, config.irc.autorejoin, config.irc.prefix, config.irc.settings_auth_enable, config.irc.settings_auth_hostmask,
        config.floodprotect.flood_protection, config.floodprotect.flood_protection_delay,
        config.errorhandling.error_logging, config.errorhandling.error_channel, config.errorhandling.error_channel_pass,
        config.colours.date, config.colours.brackets, config.colours.title, config.colours.author, config.colours.body, config.colours.link, config.colours.help_logo, config.colours.help_motd, config.colours.warning, config.colours.error,
        config.feed.useragent, config.feed.body_max_chars, config.feed.time_format, config.feed.timezone, config.feed.default_amount,
        config.twitter.nitter_instances, config.twitter.default_amount,
        config.misc.display_help_logo, config.misc.logging,
        config.motd.enable, config.motd.list, config.motd.version 
    ]
    var reqConfigs2 = [
        "config.irc.server", "config.irc.port", "config.irc.ssl", "config.irc.channels", "config.irc.nickname", "config.irc.username", "config.irc.realname", "config.irc.autorejoin", "config.irc.prefix", "config.irc.settings_auth_enable", "config.irc.settings_auth_hostmask",
        "config.floodprotect.flood_protection", "config.floodprotect.flood_protection_delay",
        "config.errorhandling.error_logging","config.errorhandling.error_channel","config.errorhandling.error_channel_pass",
        "config.colours.date","config.colours.brackets","config.colours.title","config.colours.author","config.colours.body","config.colours.link","config.colours.help_logo","config.colours.help_motd","config.colours.warning","config.colours.error",
        "config.feed.useragent","config.feed.body_max_chars","config.feed.time_format","config.feed.timezone","config.feed.default_amount",
        "config.twitter.nitter_instances","config.twitter.default_amount",
        "config.misc.display_help_logo","config.misc.logging",
        "config.motd.enable","config.motd.list","config.motd.version"
    ]
    reqConfigs.forEach(function(item, index) {
        try {
            if (item == undefined ) {
                consoleLog('[cvc.checkValuesExist] [FATAL] '+reqConfigs2[index]+' is incorrectly defined or does not exist')
                fatalConfigError.add('kill')
            }
        } catch (e) {
            consoleLog('[cvc.checkValuesExist] [FATAL] Unknown Error')
        }

    })
    if (fatalConfigError.has('kill') == true ){
        consoleLog('[cvc.checkValuesExist] [FATAL] Config is improperly configured, Mercury can not start')
        sendUpstream('kill')
    } else {
        sendUpstream('allg')
    }
}

checkValuesExist()