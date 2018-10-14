/**
 * Primary file for the API
 *
 */

//Dependencies
//node's built in module - HTTP Server
const http = require('http');
//node's built in module - URL (dor parsing the request)
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');

//The server should respond to all request with a string
const server = http.createServer(function (request, response) {

    //Get the URL and parse it
    var parsedURL = url.parse(request.url, true); //2nd param (true) -> parse the query string -> parsedURL.query value at the equivalent as if the data was sent to QueryString module

    //Get path from the URL
    var path = parsedURL.pathname; //untrimmed path that user requests, eg. /foo path

    //trimming off any extraneous slashes
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    //Get the query string as an object
    var queryStringObject = parsedURL.query;

    //Get the HTTP Method
    var method = request.method.toLowerCase();

    //Get the headers as an object
    var headers = request.headers;

    //Get the payload, if any
    var decoder = new StringDecoder('utf-8');
    //payload comes in a stream in form of bits of info, therefore it is need to collect that stream as it comes in, when stream comes to an end, make that into one coherent thing
    var buffer = '';
    //append bits of payload to buffer by binding to an event that request object emits -> data
    request.on('data', function (data) {
        buffer += decoder.write(data);
    });
    //event that tells when it's done
    //end event always gets called (Response is always sent) even if there is no data, in which case the data event wont be called
    request.on('end', function () {
        //end the buffer
        buffer += decoder.end();

        //Choose the handler the request should go to, if one isnt found, use notFound handler
        var chosenHandler = typeof (router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;
        //Construct data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer
        }
        //Route the request to the handler specified in the router
        chosenHandler(data, function (statusCode, payload) {
            //Use the status code called back by the handler or default to 200
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;
            //Use the payload called back by the handler or default to empty object
            payload = typeof (payload) == 'object' ? payload : {};
            //Convert payload to a string
            var payloadString = JSON.stringify(payload);

            //Return the response
            response.setHeader('Content-Type', 'application/json');//tell the user we are sending json
            response.writeHead(statusCode);
            //Request has finished
            //Send the response
            //all response headers and body have been sent
            response.end(payloadString);
            //Log the response
            console.log('Returning the response: ', statusCode, payloadString);
        });
    });
});

//Start the server, and have it listen
server.listen(config.port, function () {
    //done listening
    console.log('The server is listening on port ' + config.port + ' in ' + config.envName + ' now');
})

//Define Handlers
var handlers = {};
//Sample Handler
handlers.sample = function (data, callback) {
    //Callback http status code, and a payload object
    callback(406, { 'name': 'sample hanndler' });
}
//Not found handler
handlers.notFound = function (data, callback) {
    callback(404);
}

//Define a request router
var router = {
    'sample': handlers.sample
}
