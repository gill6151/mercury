const config = require('../config/default.json')
const { parentPort, workerData } = require('worker_threads');
const { d1 } = workerData;
var sub = d1;

const timer = ms => new Promise(res => setTimeout(res, ms))

warningMsg = ''+config.colours.brackets+'['+config.colours.warning+'WARNING'+config.colours.brackets+']'
errorMsg = ''+config.colours.brackets+'['+config.colours.error+'ERROR'+config.colours.brackets+']'


async function sendUpstream(content) {
    var output = content.join("\n")
    parentPort.postMessage(output);
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
        console.log(config.misc.display_help_logo)
        if (config.misc.display_help_logo === 'true' ) {
            content.push(''+config.colours.help_logo+'   ____ ___  ___  ____________  _________  __')
            content.push(''+config.colours.help_logo+'  / __ `__ \\/ _ \\/ ___/ ___/ / / / ___/ / / /')
            content.push(''+config.colours.help_logo+' / / / / / /  __/ /  / /__/ /_/ / /  / /_/ / ')
            content.push(''+config.colours.help_logo+'/_/ /_/ /_/\\___/_/   \\___/\\__,_/_/   \\__, /  ')
            content.push(''+config.colours.help_logo+'                                    /____/   ')
        }
        content.push('Mercury RSS Client - https://git.supernets.org/hogwart7/mercury')
        content.push('m!feed [USER/FEED/ALIAS] [ENTRIES] - Return the last x amount of entries from any RSS feed or your own saved feeds (if you have saved feeds)')
        content.push("m!twitter [USER] [ENTRIES] - Return the last x amount of tweets from a particular user")
        content.push("m!opt [CATEGORY] [OPTION] [VALUE] - Control bot options, see wiki for info on usage.")
        sendUpstream(content)
    }
}

help(sub);
