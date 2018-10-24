/**
 * These are server related tasks.
 * @author  Rahul Dhar
 */

//Dependencies
//node's built in module - HTTP Server
const http = require("http");
const https = require("https");
//node's built in module - URL (dor parsing the request)
const url = require("url");
const StringDecoder = require("string_decoder").StringDecoder;
const config = require("./config");
const fs = require("fs");
const _data = require("./data");
const handlers = require("./handlers");
const helpers = require("./helpers");
const path = require("path");
var util = require("util");
var debug = util.debuglog("server");

//Instantiate a server module object
var server = {};

//Instatiating the http server
server.httpServer = http.createServer(function(request, response) {
  server.unifiedServer(request, response);
});

//Instantiate the HTTPS Server
server.httpsServerOptions = {
  key: fs.readFileSync(path.join(__dirname, "/../https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../https/cert.pem"))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function(
  request,
  response
) {
  server.unifiedServer(request, response);
});

//Unified server logic for both http and https servers
server.unifiedServer = function(request, response) {
  //Get the URL and parse it
  var parsedURL = url.parse(request.url, true); //2nd param (true) -> parse the query string -> parsedURL.query value at the equivalent as if the data was sent to QueryString module

  //Get path from the URL
  var path = parsedURL.pathname; //untrimmed path that user requests, eg. /foo path

  //trimming off any extraneous slashes
  var trimmedPath = path.replace(/^\/+|\/+$/g, "");

  //Get the query string as an object
  var queryStringObject = parsedURL.query;

  //Get the HTTP Method
  var method = request.method.toLowerCase();

  //Get the headers as an object
  var headers = request.headers;

  //Get the payload, if any
  var decoder = new StringDecoder("utf-8");
  //payload comes in a stream in form of bits of info, therefore it is need to collect that stream as it comes in, when stream comes to an end, make that into one coherent thing
  var buffer = "";
  //append bits of payload to buffer by binding to an event that request object emits -> data
  request.on("data", function(data) {
    buffer += decoder.write(data);
  });
  //event that tells when it's done
  //end event always gets called (Response is always sent) even if there is no data, in which case the data event wont be called
  request.on("end", function() {
    //end the buffer
    buffer += decoder.end();

    //Choose the handler the request should go to, if one isnt found, use notFound handler
    var chosenHandler =
      typeof server.router[trimmedPath] !== "undefined"
        ? server.router[trimmedPath]
        : handlers.notFound;
    //If request is within public dir, use public handler
    chosenHandler =
      trimmedPath.indexOf("public/") > -1 ? handlers.public : chosenHandler;

    //Construct data object to send to the handler
    var data = {
      trimmedPath: trimmedPath,
      queryStringObject: queryStringObject,
      method: method,
      headers: headers,
      payload: helpers.parseJsonToObject(buffer)
    };
    //Route the request to the handler specified in the router
    chosenHandler(data, function(statusCode, payload, contentType) {
      //Determine the type of response, fallback to json
      contentType = typeof contentType == "string" ? contentType : "json";

      //Use the status code called back by the handler or default to 200
      statusCode = typeof statusCode == "number" ? statusCode : 200;

      //Return the response-parts that are content specific
      var payloadString = "";
      if (contentType == "json") {
        response.setHeader("Content-Type", "application/json"); //tell the user we are sending json
        //Use the payload called back by the handler or default to empty object
        payload = typeof payload == "object" ? payload : {};
        //Convert payload to a string
        payloadString = JSON.stringify(payload);
      }
      if (contentType == "html") {
        response.setHeader("Content-Type", "text/html"); //tell the user we are sending html
        payloadString = typeof payload == "string" ? payload : "";
      }
      if (contentType == "favicon") {
        response.setHeader("Content-Type", "image/x-icon"); //tell the user we are sending html
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (contentType == "css") {
        response.setHeader("Content-Type", "text/css"); //tell the user we are sending html
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (contentType == "png") {
        response.setHeader("Content-Type", "image/png"); //tell the user we are sending html
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (contentType == "jpg") {
        response.setHeader("Content-Type", "image/jpeg"); //tell the user we are sending html
        payloadString = typeof payload !== "undefined" ? payload : "";
      }
      if (contentType == "plain") {
        response.setHeader("Content-Type", "text/plain"); //tell the user we are sending html
        payloadString = typeof payload !== "undefined" ? payload : "";
      }

      //Return the response-parts that are common to all content-types
      response.writeHead(statusCode);
      //Request has finished
      //Send the response
      //all response headers and body have been sent
      response.end(payloadString);

      //if response is 200, print green otherwise print red
      if (statusCode == 200) {
        debug(
          "\x1b[32m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      } else {
        debug(
          "\x1b[31m%s\x1b[0m",
          method.toUpperCase() + " /" + trimmedPath + " " + statusCode
        );
      }
    });
  });
};

//Define a request router
server.router = {
  "": handlers.index,
  "account/create": handlers.accountCreate,
  "account/edit": handlers.accountEdit,
  "account/deleted": handlers.accountDeleted,
  "session/create": handlers.sessionCreate,
  "session/deleted": handlers.sessionDeleted,
  "checks/all": handlers.checksList,
  "checks/create": handlers.checksCreate,
  "checks/edit": handlers.checksEdit,
  ping: handlers.ping,
  "api/users": handlers.users,
  "api/tokens": handlers.tokens,
  "api/checks": handlers.checks,
  "favicon.ico": handlers.favicon,
  public: handlers.public
};

//Init script
server.init = function() {
  //Start the server, and have it listen
  server.httpServer.listen(config.httpPort, function() {
    console.log(
      "\x1b[36m%s\x1b[0m",
      "The server is listening on port " + config.httpPort
    );
  });

  //Start the HTTPS Server
  server.httpsServer.listen(config.httpsPort, function() {
    console.log(
      "\x1b[35m%s\x1b[0m",
      "The server is listening on port " + config.httpsPort
    );
  });
};
//Export the module
module.exports = server;
