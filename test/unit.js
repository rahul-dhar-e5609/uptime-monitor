var helpers = require("./../lib/helpers");
var assert = require("assert");

var logs = require("./../lib/logs");
var exampleDebuggingProblem = require("./../lib/exampleDebugginProblem");

var unit = {};

//Assert that the getANumber is returning a number
unit["helpers.getANumber should return a number"] = function(done) {
  var val = helpers.getANumber();
  assert.equal(typeof val, "number");
  done();
};

//Assert that the getANumber is returning 1
unit["helpers.getANumber should return 1"] = function(done) {
  var val = helpers.getANumber();
  assert.equal(val, 1);
  done();
};

//Assert that the getANumber is returning the number 2
unit["helpers.getANumber should return 2"] = function(done) {
  var val = helpers.getANumber();
  assert.equal(val, 2);
  done();
};

//Logs.truncate should not throw if the log id does not exist
unit[
  "Logs.truncate should not throw if the log id does not exist, callback an error instead"
] = function(done) {
  assert.doesNotThrow(function() {
    logs.truncate("I do not exist", function(err) {
      assert.ok(err);
      done();
    });
  }, TypeError);
};

unit["exampleDebugginProblem.init should not throw, but it does"] = function(
  done
) {
  assert.doesNotThrow(function() {
    exampleDebuggingProblem.init();
    done();
  }, TypeError);
};

// //Logs.list should callback an error and a false error
// unit[
//   "Logs.list should callback a false error and an array of log names"
// ] = function(done) {
//   logs.list(true, function(err, logFileNames) {
//     assert.equal(err, false);
//     assert.ok(logFileNames instanceof Array);
//     assert.ok(logFileNames.length > 1);
//     done();
//   });
// };

module.exports = unit;
