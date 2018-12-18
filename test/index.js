/**
 * This is the test runner
 */

//Override node env variable
process.env.NODE_ENV = "testing";

//Create the application logic for the test runner
_app = {};

//Container for the test
_app.test = {};

_app.test.unit = require("./unit");
_app.test.api = require("./api");

//Count all the test
_app.countTest = function() {
  var counter = 0;
  for (var key in _app.test) {
    if (_app.test.hasOwnProperty(key)) {
      var subTests = _app.test[key];
      for (var testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          counter++;
        }
      }
    }
  }
  return counter;
};
//This is to run all the tests and successes
_app.runTests = function() {
  var errors = [];
  var successes = 0;
  var limit = _app.countTest();
  var counter = 0;
  for (var key in _app.test) {
    if (_app.test.hasOwnProperty(key)) {
      var subTests = _app.test[key];
      for (var testName in subTests) {
        if (subTests.hasOwnProperty(testName)) {
          (function() {
            var tmpTestName = testName;
            var testValue = subTests[testName];
            //Call the test
            try {
              testValue(function() {
                //If it calls back without throwing, then it succeeded, so log in green
                console.log("\x1b[32m%s\x1b[0m", tmpTestName);
                counter++;
                successes++;
                if (counter == limit) {
                  _app.produceTestReport(limit, successes, errors);
                }
              });
            } catch (e) {
              //If throws then it failed, capture and log it
              errors.push({
                name: testName,
                error: e
              });
              console.log("\x1b[31m%s\x1b[0m", tmpTestName);
              counter++;
              if (counter == limit) {
                _app.produceTestReport(limit, successes, errors);
              }
            }
          })();
        }
      }
    }
  }
};

//Produce a test outcome
_app.produceTestReport = function(limit, successes, errors) {
  console.log("");
  console.log(
    "-------------------------BEGIN TEST REPORT------------------------"
  );
  console.log("");
  console.log("Total tests", limit);
  console.log("Pass", successes);
  console.log("Fail", errors.length);
  console.log("");

  if (errors.length > 0) {
    errors.forEach(testError => {
      console.log("\x1b[31m%s\x1b[0m", testError.name);
      console.log("Test error", testError.error);
    });
  }

  console.log("");
  console.log(
    "-----------------------------END-----------------------------------"
  );
  process.exit(0);
};

//Run the test
_app.runTests();
