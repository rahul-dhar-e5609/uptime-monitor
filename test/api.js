/**
 * API Tests
 */

//Dependencies
var app = require("./../index");
var assert = require("assert");
var http = require("http");
var config = require("./../lib/config");

//Create holder for the test
var api = {};

var helpers = {};
helpers.makeGetRequest = function(path, callback) {
  //Configure the request details
  var requestDetails = {
    protocol: "http:",
    hostname: "localhost",
    port: config.httpPort,
    method: "GET",
    path: path,
    headers: {
      "Content-Type": "application/jsons"
    }
  };

  //Send the request
  var req = http.request(requestDetails, function(res) {
    callback(res);
  });
  req.end();
};

//The main inti function should be able to run withour throwing
api["app.init should start without throwing"] = function(done) {
  assert.doesNotThrow(function() {
    app.init(function(err) {
      done();
    });
  }, TypeError);
};

//Make a request to ping
api["/ping should respond to GET with 200"] = function(done) {
  helpers.makeGetRequest("/ping", function(res) {
    assert.equal(res.statusCode, 200);
    done();
  });
};

//Make a request to api/users
api["/api/users should respond to GET with 400"] = function(done) {
  helpers.makeGetRequest("/api/users", function(res) {
    assert.equal(res.statusCode, 400);
    done();
  });
};

//Make a request to random path
api["A random should respond to GET with 404"] = function(done) {
  helpers.makeGetRequest("/this/path/should/not/exis", function(res) {
    assert.equal(res.statusCode, 404);
    done();
  });
};

//Export the module
module.exports = api;
