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
    if ( config.irc.prefix == undefined ) {
        var prefix = 'm!'
    } else {
        var prefix = config.irc.prefix
    }
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
        content.push(prefix+'feed [USER/FEED/ALIAS] [ENTRIES(opt)] - Return the last x amount of entries from any RSS feed + more (see m!help feed)')
        content.push(prefix+"opt [CATEGORY] [OPTION] [VALUE] - Control bot options, see wiki for info on usage.")
        content.push(prefix+'help [COMMAND(opt)] - Brings up this dialogue or instructions for a specific command if specified')
        content.push('Help shown here may not be comprehensive, more detailed documentation is available on the repository.')
        sendUpstream(content)
    }
    if (sub === "feed") {
        content.push(prefix+'feed Help Menu')
        content.push(prefix+'feed [URL] [ENTRIES (opt)] - Last entries from any valid RSS feed URL.')
        content.push(prefix+'feed twitter/[USERNAME] [ENTRIES (opt)] - Last tweets from any X/Twitter account.')
        content.push(prefix+'feed github/[USER]/[REPO]/[MODE (opt)] [ENTRIES (opt)] - Last commits/releases from any repo. Mode can be "commits" or "releases"')
        content.push(prefix+'feed me OR [NICK] - Your own personalised RSS feed, see repo for configuration')
        content.push(prefix+'feed [ALIAS] [ENTRIES(opt)] - Last entries from a feed associated with a set alias, repo for configuration')
        sendUpstream(content)
    }
    if (sub === "opt") {
        content.push(prefix+'opt Help Menu')
        content.push(prefix+'opt feed - Modify user feed settings, run \"'+prefix+'opt feed\" for more details')
        content.push(prefix+'opt alias - Modify aliases, run \"'+prefix+'opt alias\" for more details')
        content.push(prefix+'opt set - Modify user bot settings, run \"'+prefix+'opt set\" for more details')
        content.push(prefix+'opt get - Displays specific bot setting')
        content.push(prefix+'opt operset - Modify global bot settings (ADMIN)')
        sendUpstream(content)
    }
}

help(sub);
