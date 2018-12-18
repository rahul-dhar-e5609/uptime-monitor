/**
 * Primary file for the API.
 * @author  Rahul Dhar
 *
 */

//Dependencies
var server = require("./lib/server");
var workers = require("./lib/workers");
var cli = require("./lib/cli");
var exampleDebuggingProblem = require("./lib/exampleDebugginProblem");

//Declare the app
var app = {};

//Initialization function
app.init = function() {
  debugger;
  //Start the server
  server.init();
  debugger;
  //Start the workers
  workers.init();
  debugger;
  //Start the CLI, but make sure it start last, cause it would hang the console
  setTimeout(function() {
    cli.init();
  }, 50);
  debugger;
  var foo = 1;
  console.log("Just assigned 1 to foo");
  debugger;
  foo++;
  console.log("Just incremented foo");
  debugger;
  foo = foo * foo;
  console.log("Just squared foo");
  debugger;
  foo = foo.toString();
  console.log("Just converted foo to a string");
  debugger;
  exampleDebuggingProblem.init();
  console.log("Just called the library");
  debugger;
};

//Execute the init
app.init();

//Export the app
module.exports = app; //Used for testing
