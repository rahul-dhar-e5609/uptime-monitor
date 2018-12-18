/**
 * Primary file for the API.
 * @author  Rahul Dhar
 *
 */

//Dependencies
var server = require("./lib/server");
var workers = require("./lib/workers");
var cli = require("./lib/cli");
var cluster = require("cluster");
var os = require("os");

//Declare the app
var app = {};

//Initialization function
app.init = function(callback) {
  //if we are on master thread, start background workers and cli
  if (cluster.isMaster) {
    //Start the workers
    workers.init();

    //Start the CLI, but make sure it start last, cause it would hang the console
    setTimeout(function() {
      cli.init();
      callback();
    }, 50);

    //Fork the process
    for (var i = 0; i < os.cpus().length; i++) {
      cluster.fork();
    }
  } else {
    //if we are not on the master thread,Start the server
    server.init();
  }
};

//Execute the init
//Self invoking only if required directly, as in from a testcase or from cmd
if (require.main === module) {
  app.init(function() {});
}
//Export the app
module.exports = app; //Used for testing
