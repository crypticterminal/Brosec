var db = require('../db/db');
var log = require('cli-color');
var prompt = require('prompt');
var Table = require('cli-table');
var pay = require('../payloads/')
var output = require('./output')
var check = require('./inputChecks')
var colorize = require('./colorize.js')

var configOptions = ["SET LHOST", "SET RHOST", "SET LPORT", "SET RPORT", "SET USER"]

var secondaryMenu = require("./secondaryMenu")

var payloads
var LHOST
var LPORT
var RHOST
var RPORT
var USER

var debug = function() {}

var configLoop = false

function clearMenu() {
    console.log('\033[2J');
}

exports.clearMenu = clearMenu

function mainMenu(callback) {
    
    console.log(log.green("\n\t#########################"))
    console.log(log.green("\t### Welcome to Brosec ###"))
    console.log(log.green("\t#########################"))
    console.log(log.yellow("\nPlease choose one of the following menu options."))
    console.log(log.blackBright("\nAt any time enter 'help' for usage information."))
    console.log("\n1. Information Gathering\t4. Web")
    console.log("2. Linux\t\t\t5. Misc")
    console.log("3. Windows\t\t\t")
    console.log("")

    if (callback) {
        setTimeout(function(){
            console.log(callback+"\n")    
        }, 15)
        
    }

    // Ugly hack, needs fixing. Without this the db values are checked before the db initalizes
    setTimeout(function() {
        getConfig()
    }, 25)

    setTimeout(function() {
        prompt.start();
        prompt.message = "Choose one of the above options"
        prompt.get([{
            name: 'mainMenu',
            description: '(1-5)'
        }], function(err, result) {

            try {
                var test = check.allInputChecks(result.mainMenu, mainMenu, mainMenu)
                if(test){
                    result.mainMenu = "HOME"
                }

                switch (result.mainMenu.toUpperCase()) {
                    case "1":
                        secondaryMenu.infoGathering()
                        break;
                    case "2":
                        secondaryMenu.linux()
                        break;
                    case "3":
                        secondaryMenu.windows()
                        break;
                    case "4":
                        secondaryMenu.injectionAttacks()
                        break;
                    case "5":
                        secondaryMenu.postExploitation()
                        break;
                    case "6":
                        secondaryMenu.miscTools()
                        break;
                    case "HOME":
                    case "HELP":
                    case "CONFIG":
                    case "BACK":
                        break;
                    default:
                        mainMenu(log.red("[*] Invalid input, please try again."))
                        break;
                }
            } catch (err) {
                console.log("\nLater bro!")
            }

        });
    }, 40)
}

exports.mainMenu = mainMenu

exports.helpMenu = function(menuCallback) {
    clearMenu()
    console.log(log.green("\n\t### Brosec Help Menu ###\n"))
    console.log("Overview")
    console.log("=========")
    console.log("\n- Brosec is a RTFM-like utility to help Security Bros remember complex but useful payloads and commands")
    console.log("- Brosec utilizes saved variables (set by you) to create custom payloads on the fly. This config info is stored in a local db for your convenience")
    console.log("- Brosec outputs payloads and copies it to your clipboard in order to make your pentesting even more magical")
    console.log("- Your current config can be accessed by the " + log.blackBright("config") + " command at any time, or by entering the variable name")
    console.log("- Config values can be changed at any time by entering " + log.blackBright("set <variable> <value>"))
    console.log("- You can navigate to frequently used payloads by entering the menu sequence from the command line: " + log.blackBright("bros <sequence>"))
    console.log("   Ex: bros 412 - This would automate entering 4 for the Web Menu, 1 for the XXE sub menu, and 3 for the XXE local file read payload\n")
    console.log("Payload Variables")
    console.log("=================\n")
    console.log("- "+log.yellow("LHOST")+" : Local IP or hostname")
    console.log("- "+log.yellow("LPORT")+" : Local Port")
    console.log("- "+log.red("RHOST")+" : Remote IP or hostname")
    console.log("- "+log.red("RPORT")+" : Remote Port")
    console.log("- "+log.blackBright("USER")+" : Username (only used in a few payloads)\n")
    console.log("- "+log.blue("PROMPT")+" : User Prompt (This isn't a stored value. Payloads with this variable will prompt for input.)\n")
    prompt.message = "Press any key to return :"
    prompt.get([{
        name: 'helpMenu',
        description: ':'
    }], function(err, result) {
        try {
            if (result.helpMenu.toUpperCase() != "BACK") {
                
                    menuCallback()
                
            } else {
                mainMenu()
            }
        } catch (err) {
            console.log("\n\nLater bro!")
        }

    })
}


function showAvailablePayloadTitles(array) {

    var table = new Table({
        chars: {
            'top': '',
            'top-mid': '',
            'top-left': '',
            'top-right': '',
            'bottom': '',
            'bottom-mid': '',
            'bottom-left': '',
            'bottom-right': '',
            'left': '',
            'left-mid': '',
            'mid': '',
            'mid-mid': '',
            'right': '',
            'right-mid': '',
            'middle': ''
        },

    });

    for (i = 0; i < array.length; i++) {
        num = i + 1

        // If payload has a title then it is a longer more detailed command
        // and the formatting for the menu will be different

        if (array[i].title) {
            
            // Colorize samples for output
            if (!array[i].sample){
                array[i].sample = array[i].payload
            }

            try {
                var sample = colorize.samples(array[i].sample)
            }
            catch (err){
                console.log(err)
            }

            table.push(
                [log.green('\n' + num + '. ' + array[i].title)], [log.blackBright('  => ') + sample]
            );


        } else {

            // Ugly, turn this into a separate function later
            // Make some space (formatting) for this type of cat menu

            if (num === 1) {
                console.log("")
            }

            var sample
            var len

            if (array[i].sample) {
                sample = array[i].sample
                len = array[i].sample.length
            } else {
                sample = array[i].payload
                len = array[i].payload.length
            }

            // Colorize samples for output
            try {
                sample = colorize.samples(sample)
            }
            catch (err){
                console.log(err)
            }

            

            table.push(
                [log.green(num + ". " + sample), array[i].desc]
            );



        }
    }
    console.log(table.toString());
}

exports.showAvailablePayloadTitles = showAvailablePayloadTitles


function printConfig(returnMenu) {
    getConfig()
    clearMenu()
    if (returnMenu) {
        console.log(log.blackBright("\n\tCurrent Configuration"))
        console.log(log.blackBright("\t=====================\n"))
    }

    console.log("LHOST: " + log.blackBright(LHOST))
    console.log("LPORT: " + log.blackBright(LPORT))
    console.log("")
    console.log("RHOST: " + log.blackBright(RHOST))
    console.log("RPORT: " + log.blackBright(RPORT))
    console.log("")
    console.log("USER: " + log.blackBright(USER))
    console.log("")

    if (returnMenu) {


        prompt.message = "Nice one bro!  :"
        prompt.get([{
            name: 'printConfigMenu',
            description: ':'
        }], function(err, result) {
            try {
                if (result.printConfigMenu.toUpperCase() != "BACK") {

                    if (!check.allInputChecks(result.printConfigMenu, returnMenu, returnMenu)) {
                        returnMenu()
                    }

                } else {
                    mainMenu()
                }
            } catch (err) {
                console.log("\n\nLater bro!")
            }

        })

    }
}

exports.printConfig = printConfig


function setNewConfig(key, value) {
    db.newConfig(key, value)
}

function getValueLHOST(callback) {}

function parseConfigPrompt(input, bool) {
    var parseError = false
    pargs = input.split(' ')
    detectedOption = pargs[0] + " " + pargs[1]
    detectedOptionValue = pargs[2]

    function saveSuccess(configItem, configValue) {
        setTimeout(function() {
            console.log(log.green("" + configItem + " is now set to " + log.blackBright(configValue) + "\n"))
        }, 30)

    }

    function saveFail(configItem) {
        setTimeout(function() {
            console.log(log.yellow("\n Unknown command: '" + configItem + "' entered, try again or enter " + log.green('back') + log.yellow(" to return to the main menu\n")))
        }, 30)
    }

    var configOptionFound = false

    for (i = 0; i < configOptions.length; i++) {
        if (detectedOption.toUpperCase() === configOptions[i]) {

            configOptionFound = true

            if (detectedOption.toUpperCase() === "SET LHOST") {
                setNewConfig("LHOST", detectedOptionValue)
                saveSuccess("LHOST", detectedOptionValue)
            } else if (detectedOption.toUpperCase() === "SET LPORT") {
                setNewConfig("LPORT", detectedOptionValue)
                saveSuccess("LPORT", detectedOptionValue)
            } else if (detectedOption.toUpperCase() === "SET RHOST") {
                setNewConfig("RHOST", detectedOptionValue)
                saveSuccess("RHOST", detectedOptionValue)
            } else if (detectedOption.toUpperCase() === "SET RPORT") {
                setNewConfig("RPORT", detectedOptionValue)
                saveSuccess("RPORT", detectedOptionValue)
            } else if (detectedOption.toUpperCase() === "SET USER") {
                setNewConfig("USER", detectedOptionValue)
                saveSuccess("USER", detectedOptionValue)
            }

        }

    }

    // If no valid config option was entered, return an error message to the user
    if (!configOptionFound) {
        saveFail(detectedOption.toUpperCase())
    }

}

exports.parseConfigPrompt = parseConfigPrompt

// Queries local db file for config variables, sets them an object and returns to the user
function getConfig() {
    LHOST = db.getConfig("LHOST")
    LPORT = db.getConfig("LPORT")

    RHOST = db.getConfig("RHOST")
    RPORT = db.getConfig("RPORT")

    USER = db.getConfig("USER")

    var configObj = {}

    configObj.LHOST = LHOST
    configObj.LPORT = LPORT
    configObj.RHOST = RHOST
    configObj.RPORT = RPORT
    configObj.USER = USER

    return configObj

    if (!LHOST && !LPORT && !RHOST && !RPORT && !USER) {
        console.log(log.red("\nWarning: No config found. If this is your first time, enter 'help' for usage info"))
    }
}

exports.getConfig = getConfig
