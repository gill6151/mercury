const config = require('../config/default.json')
const { parentPort, workerData } = require('worker_threads');
const { d1 } = workerData;
var sub = d1;

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
    consoleLog('[help] All done.')
    parentPort.postMessage(output);
    process.exit()
}

function errorMessage(error, code, extra) {
    consoleLog('[help.errorMessage] '+error.code)
    if (code == "404") {
        var error = errorMsg+" 404: " + extra + " not found"
    } else if (error.code == "ECONNREFUSED") {
        var error = errorMsg+" Connection Refused"
    } else if (error.code == "ERR_UNESCAPED_CHARACTERS"){
        var error = errorMsg+" Unescaped Characters"
    } else { 
        var error = errorMsg+" Unknown error"
    }
    
    parentPort.postMessage(error);
    process.exit()
}

async function help(sub) {
    content = [];
    if (sub === undefined) {
        var sub = "default"
    }
    if (sub === "default") {
        if (config.misc.display_help_logo === 'true' ) {
            var randomMOTD = config.motd.list[Math.floor(Math.random() * config.motd.list.length)];
            consoleLog('[help.default] Logo enabled, including in output')
            content.push(''+config.colours.help_logo+'   ____ ___  ___  ____________  _________  __')
            content.push(''+config.colours.help_logo+'  / __ `__ \\/ _ \\/ ___/ ___/ / / / ___/ / / /')
            content.push(''+config.colours.help_logo+' / / / / / /  __/ /  / /__/ /_/ / /  / /_/ / ')
            content.push(''+config.colours.help_logo+'/_/ /_/ /_/\\___/_/   \\___/\\__,_/_/   \\__, /  ')
            if (config.motd.enable == "true") {
                content.push(''+config.colours.help_motd+' '+randomMOTD.padEnd(35)+''+config.colours.help_logo+'/____/   ')
            } else if (config.motd.enable == "version" ) {
                content.push(''+config.colours.help_motd+' '+config.motd.version.padEnd(35)+''+config.colours.help_logo+'/____/   ')
            } else if (config.motd.enable == "false" || config.motd.emable != "true" || config.motd.enable != "version") {
                content.push(''+config.colours.help_logo+'                                    /____/   ')
            }
            
        } else if (config.misc.display_help_logo !== 'true') {
            consoleLog('[help.default] Logo disabled, not including in output')
        }
        content.push('Mercury RSS Client - https://git.supernets.org/hgw/mercury')
        content.push('m!feed [USER/FEED/ALIAS] [ENTRIES] - Return the last x amount of entries from any RSS feed or your own saved feeds (if you have saved feeds)')
        content.push("m!twitter [USER] [ENTRIES] - Return the last x amount of tweets from a particular user")
        content.push("m!opt [CATEGORY] [OPTION] [VALUE] - Control bot options, see wiki for info on usage.")
        content.push('m!help - Brings up this dialogue')
        sendUpstream(content)
    }
}

help(sub);
