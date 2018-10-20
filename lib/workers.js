/**
 * Worker related tasks
 * @author  Rahul Dhar
 *
 */

//Dependencies
var path = require("path");
var fs = require("fs");
var _data = require("./data");
var https = require("https");
var http = require("http");
var helpers = require("./helpers");
var url = require("url");
var _logs = require("./logs");
var util = require("util");
var debug = util.debuglog("workers");

//Instantiate the worker object
var workers = {};

//Look up all the checks, get their data, send to a validator
workers.gatherAllChecks = function() {
  //Get all the checks that exist on the system
  _data.list("checks", function(err, checks) {
    if (!err && checks && checks.length > 0) {
      checks.forEach(function(check) {
        //Read in the check data
        _data.read("checks", check, function(err, originalCheckData) {
          if (!err && originalCheckData) {
            //Pass the data to check validator and let that function
            //continue or log error
            workers.validateCheckData(originalCheckData);
          } else {
            debug("Error reading one of the check data.");
          }
        });
      });
    } else {
      //This is a background worker, so there is no requester here to
      //callback to
      debug("Error: Could not find any checks to process.");
    }
  });
};

//Sanity checking the check data
workers.validateCheckData = function(originalCheckData) {
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData != null
      ? originalCheckData
      : {};
  originalCheckData.userPhone =
    typeof originalCheckData.userPhone == "string" &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone.trim()
      : false;
  originalCheckData.id =
    typeof originalCheckData.ID == "string" &&
    originalCheckData.ID.trim().length == 20
      ? originalCheckData.ID.trim()
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["https", "http"].indexOf(originalCheckData.protocol.trim()) > -1
      ? originalCheckData.protocol.trim()
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(originalCheckData.method.trim()) >
      -1
      ? originalCheckData.method.trim()
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeOutSeconds =
    typeof originalCheckData.timeOutSeconds == "number" &&
    originalCheckData.timeOutSeconds % 1 === 0 &&
    originalCheckData.timeOutSeconds >= 1 &&
    originalCheckData.timeOutSeconds <= 5
      ? originalCheckData.timeOutSeconds
      : false;

  //Set the keys that may not be set if the workers have never seen this check before.
  //There are two new keys, state (check is currently up or down), lastChecked (timestamp of the last time the check was checked)
  //If check is never been performed, we assume it was down.
  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["up", "down"].indexOf(originalCheckData.state.trim()) > -1
      ? originalCheckData.state.trim()
      : "down";
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  //If all the checks pass, pass the data along the next step along the process
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeOutSeconds
  ) {
    workers.performCheck(originalCheckData);
  } else {
    debug("Error: One of the checks is not properly formatted. Skipping it.");
  }
};

//Perform the check, send the original check data and the outcome of the check process to the next step in the check process
workers.performCheck = function(originalCheckData) {
  //Prepare the initial check outcome
  var checkOutcome = {
    error: false,
    response: false
  };

  //Mark that the outcome has not been sent yet
  var outcomeSent = false;

  //Parse the host name and the path out of the originalCheckData
  var parsedUrl = url.parse(
    originalCheckData.protocol + "://" + originalCheckData.url,
    true
  );
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path; //Using path and not pathname because we need the query string

  //Contructing the request
  var requestDetails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeOutSeconds * 1000 // expecting milliseconds
  };

  //Instantiate the request object using either the http or the https module.
  var _moduleToUse = originalCheckData.protocol == "http" ? http : https;
  var req = _moduleToUse.request(requestDetails, function(res) {
    //Grab the status of the sent request
    var status = res.statusCode;

    //Update the check outcome and pass the data along
    checkOutcome.responseCode = status;
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //Bind to the error event so that it does not get thrown.
  req.on("error", function(e) {
    //Update the checoutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: e
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //Bind to the timeout
  req.on("timeout", function(e) {
    //Update the checoutcome and pass the data along
    checkOutcome.error = {
      error: true,
      value: "timeout"
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutcome);
      outcomeSent = true;
    }
  });

  //End the request/ Send the request
  req.end();
};

//Process the check putcome and update the check data as needed and then trigger an alert to the iser
//Special logic for accomodating a check that has never been tested before (don't want to alert on that one)
workers.processCheckOutcome = function(originalCheckData, checkOutcome) {
  //Decide if the check is up/down
  var state =
    !checkOutcome.error &&
    checkOutcome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1
      ? "up"
      : "down";

  //Decide if an alert is warranted
  var alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state !== state
      ? true
      : false;

  //log the outcome of the check
  var timeOfCheck = Date.now();
  workers.log(
    originalCheckData,
    checkOutcome,
    state,
    alertWarranted,
    timeOfCheck
  );

  //Update the check data
  var newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = timeOfCheck;

  //Save the data.
  _data.update("checks", newCheckData.id, newCheckData, function(err) {
    if (!err) {
      //Send the new check data to the next phase of the process, sending the alert to the user.
      if (alertWarranted) {
        workers.alertUserToStatusChange(newCheckData);
      } else {
        debug("Check outcome has not changed, no alert needed.");
      }
    } else {
      debug("Error: Trying to save update to one of the checks.");
    }
  });
};

//Alert the user as to as change in their check status
workers.alertUserToStatusChange = function(newCheckData) {
  var message =
    "Alert: Your check for " +
    newCheckData.method.toUpperCase() +
    " " +
    newCheckData.protocol +
    "://" +
    newCheckData.url +
    " is currently " +
    newCheckData.state;
  helpers.sendTwilioSms(newCheckData.userPhone, message, function(err) {
    if (!err) {
      debug(
        "Success: User was alerted to a status change in their check via sms.",
        message
      );
    } else {
      debug(
        "Error: Could not send sms alert to user who had a state change in their check."
      );
    }
  });
};

workers.log = function(
  originalCheckData,
  checkOutcome,
  state,
  alertWarranted,
  timeOfCheck
) {
  //Form the log data
  var logData = {
    check: originalCheckData,
    outcome: checkOutcome,
    state: state,
    alert: alertWarranted,
    time: timeOfCheck
  };

  //Convert data to a string
  var logString = JSON.stringify(logData);

  //Determine the name of the log file
  var logFileName = originalCheckData.id;

  //Append the log string to the file
  _logs.append(logFileName, logString, function(err) {
    if (!err) {
      debug("Logging to file succeeded.");
    } else {
      debug("Logging to file failed.");
    }
  });
};

//Timer to execute the worker process once per minute
workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

//Rotate (compress) the log files
workers.rotateLogs = function() {
  //List all the non-compressed log files.
  _logs.list(false, function(err, logs) {
    if (!err && logs && logs.length > 0) {
      logs.forEach(function(logName) {
        //Compress the data to a different file
        var logID = logName.replace(".log", "");
        var newFileID = logID + "-" + Date.now();
        _logs.compress(logID, newFileID, function(err) {
          if (!err) {
            //Truncate the log
            _logs.truncate(logID, function(err) {
              if (!err) {
                debug("Success truncating log file.");
              } else {
                debug("Error truncating log file.");
              }
            });
          } else {
            debug("Error compressing one of the log files.", err);
          }
        });
      });
    } else {
      debug("Could not find any logs to rotate.");
    }
  });
};

//Timer to execute the log rotation process once per day.
workers.logRotateLoop = function() {
  setInterval(function() {
    workers.rotateLogs();
  }, 1000 * 60 * 60 * 24);
};

//Init script
workers.init = function() {
  //Send to console in yellow
  console.log("\x1b[33m%s\x1b[0m", "Background workers are running."); //Put in yellow

  //Execute all the checks immediately
  workers.gatherAllChecks();
  //Call the loop so the cheks will execute later on
  workers.loop();
  //Compress all the logs immediately
  workers.rotateLogs();
  //Call the compression loop so that logs will be compressed later on.
  workers.logRotateLoop();
};

//Export the module
module.exports = workers;
