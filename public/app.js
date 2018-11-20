/**
 * This is the front end logic for the application.
 *
 */

//This is the container for the frontend app
var app = {};

//Config
app.config = {
  sessionToken: false
};

//Ajax client for the restfull API
app.client = {};

//Interface for making the api calls
app.client.request = function(
  headers,
  path,
  method,
  queryStringObject,
  payload,
  callback
) {
  //Setting defaults
  headers = typeof headers == "object" && headers !== null ? headers : {};
  path = typeof path == "string" ? path : "/";
  method =
    typeof method == "string" &&
    ["POST", "GET", "DELETE", "PUT"].indexOf(method) > -1
      ? method.toUpperCase()
      : "GET";
  queryStringObject =
    typeof queryStringObject == "object" && queryStringObject !== null
      ? queryStringObject
      : {};
  payload = typeof payload == "object" && payload !== null ? payload : {};
  callback = typeof callback == "function" ? callback : false;

  //For each query string parameter sent, ad it to the path
  var requestUrl = path + "?";
  var conter = 0;
  for (var queryKey in queryStringObject) {
    if (queryStringObject.hasOwnProperty(queryKey)) {
      counter++;
      //If atleast one query string parameter has already been added, preprend new ones with &
      if (counter > 1) {
        requestUrl += "&";
      }
      //Add the key and values
      requestUrl += queryKey + "=" + queryStringObject[queryKey];
    }
  }
  //Form the http request as a JSON type
  var xhr = new XMLHttpRequest();
  xhr.open(method, requestUrl, true);
  xhr.setRequestHeader("Content-Type", "application/json");

  //Add each of the headers sent
  for (var headerKey in headers) {
    if (headers.hasOwnProperty(headerKey)) {
      xhr.setRequestHeader(headerKey, headers[headerKey]);
    }
  }

  //If there is a current session token, add as a header
  if (app.config.sessionToken) {
    xhr.setRequestHeader("token", app.config.sessionToken.id);
  }

  ///When the request comes back, handle the response
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
      var statusCode = xhr.status;
      var responseReturned = xhr.responseText;

      //Callback id=f requested
      if (callback) {
        try {
          var parsedResponse = JSON.parse(responseReturned);
          callback(statusCode, parsedResponse);
        } catch (e) {
          callback(statusCode, false);
        }
      }
    }
  };
  //Send the payload as JSON
  var payloadString = JSON.stringify(payload);
  xhr.send(payloadString);
};
