/**
 * Helpers for various tasks
 * @author  Rahul Dhar
 *
 */

//Dependencies
const crypto = require("crypto");
const config = require("./config");
const https = require("https");
const querystring = require("querystring");

//Container for all the Helpers
const helpers = {};

//Create a SHA256 hash - NODE SUPPORT
helpers.hash = function(str) {
  //Validate string
  if (typeof str == "string" && str.length > 0) {
    const hash = crypto
      .createHmac("SHA256", config.hashingSecret)
      .update(str)
      .digest("hex");
    return hash;
  }
  return false;
};

//Parse a JSON string to an object in all cases, without throwing
helpers.parseJsonToObject = function(str) {
  try {
    const obj = JSON.parse(str);
    return obj;
  } catch (e) {
    return {};
  }
};

//Create a string of random alphanumeric characters of a given string
helpers.createRandomString = function(stringLength) {
  strLength =
    typeof stringLength == "number" && stringLength > 0 ? stringLength : false;
  if (strLength) {
    //Define all possible characters that could go into a string
    var possibleCharaters = "abcdefghijklmnopqrstuvwxyz0123456789";
    //Start the final string
    var str = "";
    for (i = 0; i < strLength; i++) {
      //Get a random charater from the possible charaters
      var randomCharater = possibleCharaters.charAt(
        Math.floor(Math.random() * possibleCharaters.length)
      );
      //Append this charater to the final string
      str += randomCharater;
    }
    //Return the final string
    return str;
  } else {
    return false;
  }
};

//Send an SMS via twilio
helpers.sendTwilioSms = function(phone, message, callback) {
  //Validate the parameters
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message.trim()
      : false;

  if (phone && message) {
    //Config the request payload
    var payload = {
      From: config.twilio.fromPhone,
      To: "+1" + phone,
      Body: message
    };

    //Stringify the payload
    var stringPayload = querystring.stringify(payload); //not doing json as posting a form 'Content-Type': 'application/x-www-form-urlencode',
    //Configure the request details
    var requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencode",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    //Instantiate the request object
    var req = https.request(requestDetails, function(res) {
      //Grab the status of the sent request
      var status = res.statusCode;
      //Callback successfully is the request went through
      if (status == 200 || status == 201) {
        //no error`
        callback(false);
      } else {
        callback("Status code returned was " + status);
      }
    });

    //Bind to the error event so that it does not get thrown
    req.on("error", function(e) {
      callback(e);
    });

    //Add the payload to request
    req.write(stringPayload);

    //End the request (send)
    req.end();
  } else {
    callback("Given parameters are missing or invalid.");
  }
};

//Export the MODULE
module.exports = helpers;
