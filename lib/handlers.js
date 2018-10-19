/**
 * Request handlers
 * @author  Rahul Dhar
 *
 */

//Dependencies
const _data = require("./data");
const helpers = require("./helpers");
const config = require("./config");
//Define Handlers
var handlers = {};

//Users
handlers.users = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    //Private methods
    handlers._users[data.method](data, callback);
  } else {
    //Method not allowed
    callback(405);
  }
};

//Container for user's submethods
handlers._users = {};

//Users - POST
//Required data: firstname, lastname, phone, password, tosAgreement
//Optional data: none
handlers._users.post = function(data, callback) {
  //Check all required fields are filled out - Sanity Checky
  var firstname =
    typeof data.payload.firstname == "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstname.trim()
      : false;
  var lastname =
    typeof data.payload.lastname == "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastname.trim()
      : false;
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;
  var tosAgreement =
    typeof data.payload.tosAgreement == "boolean" &&
    data.payload.tosAgreement == true
      ? true
      : false;

  if (firstname && lastname && phone && password && tosAgreement) {
    //Make sure user does not already exists
    _data.read("users", phone, function(err, data) {
      if (err) {
        //Hash the password - USING CRYPTO - NODE MODULE
        const hashedPassword = helpers.hash(password);

        //Create user object
        if (hashedPassword) {
          const userObject = {
            firstname: firstname,
            lastname: lastname,
            phone: phone,
            hashedPassword: hashedPassword,
            tosAgreement: true
          };

          //Store the user
          _data.create("users", phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {
                Error: "Could not create the new user."
              });
            }
          });
        } else {
          callback(500, {
            Error: "Could not has the user's password"
          });
        }
      } else {
        //user already exists
        callback(400, {
          Error: "A user with that phone number already exists."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};
//Users - GET
//Required Data: phone
//Optional Data: none
handlers._users.get = function(data, callback) {
  //Checkt the phone number provided is valid
  var phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //Get the token from the headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    //Verify given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        //Looking up the user
        _data.read("users", phone, function(err, data) {
          if (!err && data) {
            //Remove hashed password from user object before returning to requester
            delete data.hashedPassword;
            callback(200, data);
          } else {
            callback(404);
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};
//Users - PUT
//Required Data: phone
//Optional Data: firstname, lastname, password (at least one must be specified)
handlers._users.put = function(data, callback) {
  //Check required fields
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;

  //Check optional fields
  var firstname =
    typeof data.payload.firstname == "string" &&
    data.payload.firstname.trim().length > 0
      ? data.payload.firstname.trim()
      : false;
  var lastname =
    typeof data.payload.lastname == "string" &&
    data.payload.lastname.trim().length > 0
      ? data.payload.lastname.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  //Error if the phone is invalid
  if (phone) {
    //Error if nothing is sent to update
    if (firstname || lastname || password) {
      //Get the token from the headers
      var token =
        typeof data.headers.token == "string" ? data.headers.token : false;
      //Verify given token is valid for the phone number
      handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
        if (tokenIsValid) {
          //Look up the user
          _data.read("users", phone, function(err, userData) {
            if (!err && userData) {
              //Update the fields necessary
              if (firstname) {
                userData.firstname = firstname;
              }
              if (lastname) {
                userData.lastname = lastname;
              }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              //Store the new updates
              _data.update("users", phone, userData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  console.log(err);
                  callback(500, {
                    Error: "Could not update the user."
                  });
                }
              });
            } else {
              callback(400, {
                Error: "The specified user does not exist."
              });
            }
          });
        } else {
          callback(403, {
            Error: "Missing required token in header, or token is invalid."
          });
        }
      });
    } else {
      callback(400, {
        Error: "Missing fields to update"
      });
    }
  } else {
    callback(400, {
      Error: "Missing required field"
    });
  }
};
//Users - DELETE
//Required field: phone
handlers._users.delete = function(data, callback) {
  //Check phone number is valid
  const phone =
    typeof data.queryStringObject.phone == "string" &&
    data.queryStringObject.phone.length == 10
      ? data.queryStringObject.phone.trim()
      : false;
  if (phone) {
    //Get the token from the headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    //Verify given token is valid for the phone number
    handlers._tokens.verifyToken(token, phone, function(tokenIsValid) {
      if (tokenIsValid) {
        //Looking up the user
        _data.read("users", phone, function(err, userData) {
          if (!err && userData) {
            //Remove hashed password from user object before returning to requester
            _data.delete("users", phone, function(err) {
              if (!err) {
                //Delete each of the checks associated with teh user
                var userChecks =
                  typeof userData.checks == "object" &&
                  userData.checks instanceof Array
                    ? userData.checks
                    : [];
                var checksToDelete = userChecks.length;
                if (checksToDelete > 0) {
                  var checksDeleted = 0;
                  var deletionErrors = false;
                  //Loop through checks
                  userChecks.forEach(function(checkID) {
                    //Delete the check
                    _data.delete("checks", checkID, function(err) {
                      if (err) {
                        deletionErrors = true;
                      }
                      checksDeleted++;
                      if (checksDeleted == checksToDelete) {
                        if (!deletionErrors) {
                          callback(200);
                        } else {
                          callback(500, {
                            Error:
                              "Errors encountered while attempting to delte all of the user's checks. All checks may not have been deleted from the system successfully."
                          });
                        }
                      }
                    });
                  });
                } else {
                  callback(200);
                }
              } else {
                callback(500, {
                  Error: "Could not delete the specified user."
                });
              }
            });
          } else {
            callback(400, {
              Error: "Could not find the specified user."
            });
          }
        });
      } else {
        callback(403, {
          Error: "Missing required token in header, or token is invalid."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};

//Tokens
handlers.tokens = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    //Private methods
    handlers._tokens[data.method](data, callback);
  } else {
    //Method not allowed
    callback(405);
  }
};

//Container for all the token methods
handlers._tokens = {};

//Token - post
//Required Data: phone, password
//Optional Data: none
handlers._tokens.post = function(data, callback) {
  var phone =
    typeof data.payload.phone == "string" &&
    data.payload.phone.trim().length == 10
      ? data.payload.phone.trim()
      : false;
  var password =
    typeof data.payload.password == "string" &&
    data.payload.password.trim().length > 0
      ? data.payload.password.trim()
      : false;

  if (phone && password) {
    //looking user who matches the phone number
    _data.read("users", phone, function(err, userData) {
      if (!err && userData) {
        //Hash the sent password and compare it with the password in the user userObject
        var hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          //If valid, create a new token with a random name, Set expiration 1 hr in the future
          var tokenID = helpers.createRandomString(20);
          var expires = Date.now() + 1000 * 60 * 60;
          var tokenObject = {
            phone: phone,
            id: tokenID,
            expires: expires
          };
          //Store the token
          _data.create("tokens", tokenID, tokenObject, function(err) {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, {
                Error: "Could not create the new token."
              });
            }
          });
        } else {
          callback(400, {
            Error: "The password did not match the specified user's password"
          });
        }
      } else {
        callback(400, {
          Error: "Could not find the specified user."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s)."
    });
  }
};

//Token - get
//Required Data: id
//Optional Data: none
handlers._tokens.get = function(data, callback) {
  //Check the id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //Looking up the token
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields."
    });
  }
};

//Token - put
//Required Fields: id, extend
//Optional Fields: none
handlers._tokens.put = function(data, callback) {
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;
  var extend =
    typeof data.payload.extend == "boolean" && data.payload.extend == true
      ? true
      : false;
  if (id && extend) {
    //Lookup the token
    _data.read("tokens", id, function(err, tokenData) {
      if (!err && tokenData) {
        //Check to make sure that the token isn't already expired
        if (tokenData.expires > Date.now()) {
          //Set the expiration an hour from now
          tokenData.expires = Date.now() + 1000 * 60 * 60;

          //Store the new updates
          _data.update("tokens", id, tokenData, function(err) {
            if (!err) {
              callback(200);
            } else {
              callback(500, {
                Error: "Could not update the token expiration."
              });
            }
          });
        } else {
          callback(400, {
            Error: "Token has already expired and can't be extended."
          });
        }
      } else {
        callback(400, {
          Error: "Specified token does not exists."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required field(s) or field(s) are invalid."
    });
  }
};

//Token - delete
//Required Data: id
//Optional Data: none
handlers._tokens.delete = function(data, callback) {
  //Check id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //Looking up the token
    _data.read("tokens", id, function(err, data) {
      if (!err && data) {
        _data.delete("tokens", id, function(err) {
          if (!err) {
            callback(200, data);
          } else {
            callback(500, {
              Error: "Could not delete the specified token."
            });
          }
        });
      } else {
        callback(400, {
          Error: "Could not find the specified token."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};

//Verify if a given token ID  is calid for a given user
handlers._tokens.verifyToken = function(id, phone, callback) {
  //Lookup the token
  _data.read("tokens", id, function(err, tokenData) {
    if (!err && tokenData) {
      //Check that the token is for the given user and has not expired
      if (tokenData.phone == phone && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

//Check service
handlers.checks = function(data, callback) {
  var acceptableMethods = ["post", "get", "put", "delete"];
  if (acceptableMethods.indexOf(data.method) > -1) {
    //Private methods
    handlers._checks[data.method](data, callback);
  } else {
    //Method not allowed
    callback(405);
  }
};

//Container for all the token methods
handlers._checks = {};

//Check - post
//Required Data: protocol, url, method, successCodes, timeOutSeconds
//Optional Data: none
handlers._checks.post = function(data, callback) {
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeOutSeconds =
    typeof data.payload.timeOutSeconds == "number" &&
    data.payload.timeOutSeconds % 1 === 0 &&
    data.payload.timeOutSeconds >= 1 &&
    data.payload.timeOutSeconds <= 5
      ? data.payload.timeOutSeconds
      : false;

  if (protocol && url && method && successCodes && timeOutSeconds) {
    //Get the token from the headers
    var token =
      typeof data.headers.token == "string" ? data.headers.token : false;
    //Lookup user by reading the token
    _data.read("tokens", token, function(err, tokenData) {
      if (!err && tokenData) {
        var userPhone = tokenData.phone;
        //Lookup the user Data
        _data.read("users", userPhone, function(err, userData) {
          if (!err && userData) {
            console.log("User data: ", userData);
            var userChecks =
              typeof userData.checks == "object" &&
              userData.checks instanceof Array
                ? userData.checks
                : [];
            //Verify the user has less than number of max checks
            if (userChecks.length < config.maxChecks) {
              //Create a random id for the check
              var checkID = helpers.createRandomString(20);
              //Create the check object and include the user's phone
              var checkObject = {
                ID: checkID,
                userPhone: userPhone,
                protocol: protocol,
                url: url,
                method: method,
                successCodes: successCodes,
                timeOutSeconds: timeOutSeconds
              };
              //save the object
              _data.create("checks", checkID, checkObject, function(err) {
                if (!err) {
                  //Add the check id to the user;'s object
                  userData.checks = userChecks;
                  userData.checks.push(checkID);
                  //Save the new user data
                  _data.update("users", userPhone, userData, function(err) {
                    if (!err) {
                      //Return the data about the new check to the requester
                      callback(200, checkObject);
                    } else {
                      callback(500, {
                        Error: "Could not update the user with the new check."
                      });
                    }
                  });
                } else {
                  callback(500, {
                    Error: "Could not create the new check."
                  });
                }
              });
            } else {
              callback(400, {
                Error:
                  "The user already has the maximum number of checks (" +
                  config.maxChecks +
                  ")."
              });
            }
          } else {
            callback(403, {
              Error: "Invalid user."
            });
          }
        });
      } else {
        callback(403, {
          Error: "Invalid token."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields or inputs are invalid"
    });
  }
};

//Checks - get
//Required Data: id
//OPtional Data: none
handlers._checks.get = function(data, callback) {
  //Checkt the id provided is valid
  var id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        //Get the token from the headers
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        //Verify given token is valid and belongs to the user who created the check
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            //Return the check data
            callback(200, checkData);
          } else {
            callback(403);
          }
        });
      } else {
        callback(404);
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};

//Checks - put
//Required Data: id
//Optional Data: protocol, url ,method, successCodes, timeOutSeconds, ONE MUST BE SPECIFIED
handlers._checks.put = function(data, callback) {
  //Check required fields
  var id =
    typeof data.payload.id == "string" && data.payload.id.trim().length == 20
      ? data.payload.id.trim()
      : false;

  //Check optional fields
  var protocol =
    typeof data.payload.protocol == "string" &&
    ["https", "http"].indexOf(data.payload.protocol.trim()) > -1
      ? data.payload.protocol.trim()
      : false;
  var url =
    typeof data.payload.url == "string" && data.payload.url.trim().length > 0
      ? data.payload.url.trim()
      : false;
  var method =
    typeof data.payload.method == "string" &&
    ["post", "get", "put", "delete"].indexOf(data.payload.method.trim()) > -1
      ? data.payload.method.trim()
      : false;
  var successCodes =
    typeof data.payload.successCodes == "object" &&
    data.payload.successCodes instanceof Array &&
    data.payload.successCodes.length > 0
      ? data.payload.successCodes
      : false;
  var timeOutSeconds =
    typeof data.payload.timeOutSeconds == "number" &&
    data.payload.timeOutSeconds % 1 === 0 &&
    data.payload.timeOutSeconds >= 1 &&
    data.payload.timeOutSeconds <= 5
      ? data.payload.timeOutSeconds
      : false;

  //Check to make sure id is valid
  if (id) {
    //Check to make sure one or more optional fields have been sent
    if (protocol || url || method || successCodes || timeOutSeconds) {
      //Looking up the check
      _data.read("checks", id, function(err, checkData) {
        if (!err && checkData) {
          //Get the token from the headers
          var token =
            typeof data.headers.token == "string" ? data.headers.token : false;
          //Verify given token is valid and belongs to the user who created the check
          handlers._tokens.verifyToken(token, checkData.userPhone, function(
            tokenIsValid
          ) {
            if (tokenIsValid) {
              //Update the check where necessary
              if (protocol) {
                checkData.protocol = protocol;
              }
              if (url) {
                checkData.url = url;
              }
              if (method) {
                checkData.method = method;
              }
              if (successCodes) {
                checkData.successCodes = successCodes;
              }
              if (timeOutSeconds) {
                checkData.timeOutSeconds = timeOutSeconds;
              }
              //Save the updates
              _data.update("checks", id, checkData, function(err) {
                if (!err) {
                  callback(200);
                } else {
                  callback(500, {
                    Error: "Could not update the check."
                  });
                }
              });
            } else {
              callback(403);
            }
          });
        } else {
          callback(400, {
            Error: "Check ID did not exist."
          });
        }
      });
    } else {
      callback(400, {
        Error: "Missing fields to update."
      });
    }
  } else {
    callback(400, {
      Error: "Missing required field(s)."
    });
  }
};

//Check - DELETE
//Required Data: id
//Optional Data: none
handlers._checks.delete = function(data, callback) {
  //Check id is valid
  const id =
    typeof data.queryStringObject.id == "string" &&
    data.queryStringObject.id.length == 20
      ? data.queryStringObject.id.trim()
      : false;
  if (id) {
    //Lookup the check
    _data.read("checks", id, function(err, checkData) {
      if (!err && checkData) {
        //Get the token from the headers
        var token =
          typeof data.headers.token == "string" ? data.headers.token : false;
        //Verify given token is valid for the authenticated user's phone number
        handlers._tokens.verifyToken(token, checkData.userPhone, function(
          tokenIsValid
        ) {
          if (tokenIsValid) {
            //Delete the check data
            _data.delete("checks", id, function(err) {
              if (!err) {
                //Looking up the user
                _data.read("users", checkData.userPhone, function(
                  err,
                  userData
                ) {
                  if (!err && userData) {
                    var userChecks =
                      typeof userData.checks == "object" &&
                      userData.checks instanceof Array
                        ? userData.checks
                        : [];
                    //Remove the deleted check from list of checks
                    var checkPosition = userChecks.indexOf(id);
                    if (checkPosition > -1) {
                      userChecks.splice(checkPosition, 1);
                      //Resave the user's data
                      _data.update(
                        "users",
                        checkData.userPhone,
                        userData,
                        function(err) {
                          if (!err) {
                            callback(200);
                          } else {
                            callback(500, {
                              Error: "Could not update the user."
                            });
                          }
                        }
                      );
                    } else {
                      callback(500, {
                        Error:
                          "Could not find the check on the user's object so could not remove it."
                      });
                    }
                  } else {
                    callback(500, {
                      Error: "Could not find the user who created the check."
                    });
                  }
                });
              } else {
                callback(500, {
                  Error: "Could not delete check data."
                });
              }
            });
          } else {
            callback(403);
          }
        });
      } else {
        callback(403, {
          Error: "The specified check id does not exist."
        });
      }
    });
  } else {
    callback(400, {
      Error: "Missing required fields"
    });
  }
};

//Ping Handler
handlers.ping = function(data, callback) {
  callback(200);
};
//Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
};

//Export the module
module.exports = handlers;
