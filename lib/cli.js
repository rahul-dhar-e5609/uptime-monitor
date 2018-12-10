/**
 * CLI related tasks
 * @author Rahul Dhar
 *
 */

//Dependencies
var readline = require("readline");
var util = require("util");
var debug = util.debuglog("cli");
var events = require("events");
class _events extends events {}
var e = new _events();

//Instantiate cli module object
var cli = {};

//Input processor
cli.processInput = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;
  //Only process input if user actually wrote something
  if (str) {
    //Codify the unique strings that identify the unique questions allowed to be asked
    var uniqueInputs = [
      "man",
      "help",
      "exit",
      "stats",
      "list users",
      "more user info",
      "list checks",
      "more check info",
      "list logs",
      "more log info"
    ];
    //Go through the possible inputs, emit an event when match is found
    var matchFound = false;
    var counter = 0;
    uniqueInputs.some(function(input) {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        //Emit an event matching the unique input, and include full string given by user
        e.emit(input, str);
        return true;
      }
    });
    //If no match is found, ask user to retry.
    if (!matchFound) {
      console.log("Sorry, try again.");
    }
  }
};

//Init script
cli.init = function() {
  //Send the start message to the console in dark blue
  console.log("\x1b[34m%s\x1b[0m", "The cli is running");

  //Start the interface
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">"
  });

  //Create an initial prompt
  _interface.prompt();

  //Handle each line of input separately
  _interface.on("line", function(str) {
    //Send to the input processor
    cli.processInput(str);
    //Reinitialize the prompt afterwards
    _interface.prompt();
  });

  //If the user stops the cli, kill the associated process
  _interface.on("close", function() {
    process.exit(0);
  });
};

//Export the module
module.exports = cli;
