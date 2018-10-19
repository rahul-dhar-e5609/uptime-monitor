/**
 * Primary file for the API.
 * @author  Rahul Dhar
 *
 */

//Dependencies
var server = require("./lib/server");
var workers = require("./lib/workers");

//Declare the app
var app = {};

//Initialization function
app.init = function() {
  //Start the server
  server.init();
  //Start the workers
  workers.init();
};

//Execute the init
app.init();

//Export the app
module.exports = app; //Used for testing
