/**
 * CLI related tasks
 * @author Rahul Dhar
 *
 */

//Dependencies
var readline = require("readline");
var util = require("util");
var debug = util.debuglog("cli");
var events = require("events");
var os = require("os");
var v8 = require("v8");
var _data = require("./data");
class _events extends events {}
var e = new _events();

//Instantiate cli module object
var cli = {};

//Input handlers , binds to different events
e.on("man", function(str) {
  cli.responders.help();
});
e.on("help", function(str) {
  cli.responders.help();
});
e.on("exit", function(str) {
  cli.responders.exit();
});
e.on("stats", function(str) {
  cli.responders.stats();
});
e.on("list users", function(str) {
  cli.responders.listUsers();
});
e.on("more user info", function(str) {
  cli.responders.moreUserInfo(str);
});
e.on("list checks", function(str) {
  cli.responders.listChecks(str);
});
e.on("more check info", function(str) {
  cli.responders.moreCheckInfo(str);
});
e.on("list logs", function(str) {
  cli.responders.listLogs();
});
e.on("more log info", function(str) {
  cli.responders.moreLogInfo(str);
});

//Responders object
cli.responders = {};

//Help /Man
cli.responders.help = function() {
  var commands = {
    exit: "Kill the cli and the rest of the application.",
    man: "Show the help page.",
    help: "Alias of the 'man' command.",
    stats:
      "Get statistics of the underlying operating systemand resource utilization.",
    "list users":
      "Show a list of all the registered (undeleted) users in the system.",
    "more user info --{userid}": "Show details of a specific user.",
    "list checks --up --down":
      "Show a list of all the active checks in the system, including their state. The --up and --down flags are both optional.",
    "more check info --{checkid}": "Show details of a specified check.",
    "list logs":
      "Show a list of all the log files available to be read (compressed and uncompressed).",
    "more log info --{fileName}": "Show details of a specified log file."
  };

  //Show a header for the help page that is as wide as the screen.
  cli.horizontalLine();
  cli.centered("CLI Manual");
  cli.horizontalLine();
  cli.verticalSpace(2);

  //Show each command, Followed by its application in white and yellow respectively
  for (var key in commands) {
    if (commands.hasOwnProperty(key)) {
      var values = commands[key];
      var line = "\x1b[33m" + key + "\x1b[0m";
      var padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += values;
      console.log(line);
      cli.verticalSpace(1);
    }
  }
  cli.verticalSpace(1);
  //End with another horizontal line
  cli.horizontalLine();
};

//Create a vertical space
cli.verticalSpace = function(lines) {
  lines = typeof lines == "number" && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
    console.log("");
  }
};

//Create a horizontal line accross the screen
cli.horizontalLine = function() {
  //Get the available screen size
  var width = process.stdout.columns;
  var line = "";
  for (i = 0; i < width; i++) {
    line += "-";
  }
  console.log(line);
};

//Create centered text on screen
cli.centered = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : "";
  var width = process.stdout.columns;

  //Calculate the left padding there should be
  var leftPadding = Math.floor((width - str.length) / 2);
  //Put in left padded space before the string itself
  var line = "";
  for (i = 0; i < leftPadding; i++) {
    line += " ";
  }
  line += str;
  console.log(line);
};

//Exit
cli.responders.exit = function() {
  process.exit(0);
};

//Stats
cli.responders.stats = function() {
  //Compile an object of stats
  var stats = {
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": os.freemem(),
    "Current Malloced Menory": v8.getHeapStatistics().malloced_memory,
    "Peak Malloced Menory": v8.getHeapStatistics().peak_malloced_memory,
    "Allocated Heap Used (%)":
      Math.round(
        v8.getHeapStatistics().used_heap_size /
          v8.getHeapStatistics().total_heap_size
      ) * 100,
    "Avaliable Heap Allocated (%)":
      Math.round(
        v8.getHeapStatistics().total_heap_size /
          v8.getHeapStatistics().heap_size_limit
      ) * 100,
    Uptime: os.uptime() + " seconds"
  };
  //Show a header for the stats page that is as wide as the screen.
  cli.horizontalLine();
  cli.centered("System Statistics");
  cli.horizontalLine();
  cli.verticalSpace(2);

  //Show each command, Followed by its application in white and yellow respectively
  for (var key in stats) {
    if (stats.hasOwnProperty(key)) {
      var values = stats[key];
      var line = "\x1b[33m" + key + "\x1b[0m";
      var padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += values;
      console.log(line);
      cli.verticalSpace(1);
    }
  }
  cli.verticalSpace(1);
  //End with another horizontal line
  cli.horizontalLine();
};

//List Users
cli.responders.listUsers = function() {
  _data.list("uses", function(err, userIds) {
    if (!err && userIds && userIds.length > 0) {
      cli.verticalSpace(1);
      userIds.forEach(userId => {
        _data.read("users", userId, function(err, userData) {
          if (!err && userData) {
            var line =
              "Name: " +
              userData.firstName +
              " " +
              userData.lastName +
              " Phone: " +
              userData.phone +
              " Checks: ";
            var numberOfChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array &&
              userData.checks.length > 0
                ? userData.checks.length
                : 0;
            line += numberOfChecks;
            console.log(line);
            cli.verticalSpace();
          }
        });
      });
    }
  });
};

//More user info
cli.responders.moreUserInfo = function(str) {
  //Get the id from the string
  var arr = str.split("--");
  var userid =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (userid) {
    _data.read("users", userid, function(err, userdata) {
      if (!err && userdata) {
        //Remove the hashed password
        delete userdata.hashedPassword;

        //Print the json array with text highlighting
        cli.verticalSpace();
        console.dir(userdata, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

//List checks
cli.responders.listChecks = function(str) {
  _data.list("checks", function(err, checkids) {
    if (!err && checkids) {
      cli.verticalSpace();
      checkids.forEach(function(checkid) {
        _data.read("checks", checkid, function(err, checkdata) {
          var includecheck = false;
          var lowerString = str.toLowerCase();

          //GET the state, default to down
          var state =
            typeof checkdata.state == "string" ? checkdata.state : "down";
          var stateOrUnknown =
            typeof checkdata.state == "string" ? checkdata.state : "unknown";
          // If the user has specified any state or has not specified any check, include the cuurect check accordingly
          if (
            lowerString.indexOf("--" + state) > -1 ||
            (lowerString.indexOf("--dowm") == -1 &&
              lowerString.indexOf("--up") == -1)
          ) {
            var line =
              "ID: " +
              checkdata.id +
              " " +
              checkdata.method.toUpperCase() +
              " " +
              checkdata.protocol +
              "://" +
              checkdata.url +
              " State: " +
              stateOrUnknown;
          }
          console.log(line);
          cli.verticalSpace();
        });
      });
    }
  });
};

//More check info
cli.responders.moreCheckInfo = function(str) {
  //Get the id from the string
  var arr = str.split("--");
  var checkid =
    typeof arr[1] == "string" && arr[1].trim().length > 0
      ? arr[1].trim()
      : false;
  if (checkid) {
    _data.read("checks", checkid, function(err, checkdata) {
      if (!err && checkdata) {
        //Print the json array with text highlighting
        cli.verticalSpace();
        console.dir(checkdata, { colors: true });
        cli.verticalSpace();
      }
    });
  }
};

//List logs
cli.responders.listLogs = function() {
  console.log("You asked for logs.");
};

//More log info
cli.responders.moreLogInfo = function(str) {
  console.log("You asked for more log info.", str);
};
//Input processor
cli.processInput = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;
  //Only process input if user actually wrote something
  if (str) {
    //Codify the unique strings that identify the unique questions allowed to be asked
    var uniqueInputs = [
      "man",
      "help",
      "exit",
      "stats",
      "list users",
      "more user info",
      "list checks",
      "more check info",
      "list logs",
      "more log info"
    ];
    //Go through the possible inputs, emit an event when match is found
    var matchFound = false;
    var counter = 0;
    uniqueInputs.some(function(input) {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        //Emit an event matching the unique input, and include full string given by user
        e.emit(input, str);
        return true;
      }
    });
    //If no match is found, ask user to retry.
    if (!matchFound) {
      console.log("Sorry, try again.");
    }
  }
};

//Init script
cli.init = function() {
  //Send the start message to the console in dark blue
  console.log("\x1b[34m%s\x1b[0m", "The cli is running");

  //Start the interface
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">"
  });

  //Create an initial prompt
  _interface.prompt();

  //Handle each line of input separately
  _interface.on("line", function(str) {
    //Send to the input processor
    cli.processInput(str);
    //Reinitialize the prompt afterwards
    _interface.prompt();
  });

  //If the user stops the cli, kill the associated process
  _interface.on("close", function() {
    process.exit(0);
  });
};

//Export the module
module.exports = cli;
