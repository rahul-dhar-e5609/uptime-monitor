/**
 * Request handlers
 */

//Dependencies
const _data = require('./data');
const helpers = require('./helpers');

//Define Handlers
var handlers = {};

//Users
handlers.users = function(data, callback) {
  var acceptableMethods = [
    'post',
    'get',
    'put',
    'delete'
  ];
  if (acceptableMethods.indexOf(data.method) > -1) {
    //Private methods
    handlers._users[data.method](data, callback);
  } else {
    //Method not allowed
    callback(405);
  }
}

//Container for user's submethods
handlers._users = {};

//Users - POST
//Required data: firstname, lastname, phone, password, tosAgreement
//Optional data: none
handlers._users.post = function(data, callback) {
  //Check all required fields are filled out - Sanity Checky
  var firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
  var lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
  var phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  var tosAgreement = typeof(data.payload.tosAgreement) == 'boolean' && data.payload.tosAgreement == true ? true : false;

  if (firstname && lastname && phone && password && tosAgreement) {
    //Make sure user does not already exists
    _data.read('users', phone, function(err, data) {
      if (err) {
        //Hash the password - USING CRYPTO - NODE MODULE
        const hashedPassword = helpers.hash(password);

        //Create user object
        if (hashedPassword) {
          const userObject = {
            'firstname': firstname,
            'lastname': lastname,
            'phone': phone,
            'hashedPassword': hashedPassword,
            'tosAgreement': true
          }

          //Store the user
          _data.create('users', phone, userObject, function(err) {
            if (!err) {
              callback(200);
            } else {
              console.log(err);
              callback(500, {
                'Error': 'Could not create the new user.'
              });
            }
          });
        } else {
          callback(500, {
            'Error': 'Could not has the user\'s password'
          })
        }
      } else {
        //user already exists
        callback(400, {
          'Error': 'A user with that phone number already exists.'
        });
      }
    });
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    });
  }
}
//Users - GET
//Required Data: phone
//Optional Data: none
//@TODO Only let an authenticated user access their object, Don't let them access anyone elses
handlers._users.get = function(data, callback) {
  //Checkt the phone number provided is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //Looking up the user
    _data.read('users', phone, function(err, data) {
      if (!err && data) {
        //Remove hashed password from user object before returning to requester
        delete data.hashedPassword;
        callback(200, data);
      } else {
        callback(404);
      }
    })
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    })
  }
}
//Users - PUT
//Required Data: phone
//Optional Data: firstname, lastname, password (at least one must be specified)
//@TODO Only let authenticated user update their own object, dont let them update anyone elses
handlers._users.put = function(data, callback) {
  //Check required fields
  const phone = typeof(data.payload.phone) == 'string' && data.payload.phone.trim().length == 10 ? data.payload.phone.trim() : false;

  //Check optional fields
  var firstname = typeof(data.payload.firstname) == 'string' && data.payload.firstname.trim().length > 0 ? data.payload.firstname.trim() : false;
  var lastname = typeof(data.payload.lastname) == 'string' && data.payload.lastname.trim().length > 0 ? data.payload.lastname.trim() : false;
  var password = typeof(data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  //Error if the phone is invalid
  if (phone) {
    //Error if nothing is sent to update
    if (firstname || lastname || password) {
      //Look up the user
      _data.read('users', phone, function(err, userData) {
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
          _data.update('users', phone, userData, function(err) {
            if (!err) {
              callback(200)
            } else {
              console.log(err);
              callback(500, {
                'Error': 'Could not update the user.'
              });
            }
          })
        } else {
          callback(400, {
            'Error': 'The specified user does not exist.'
          });
        }
      })
    } else {
      callback(400, {
        'Error': 'Missing fields to update'
      });
    }
  } else {
    callback(400, {
      'Error': 'Missing required field'
    });
  }
}
//Users - DELETE
//Required field: phone
//@TODO Only let an authenticated user delete their object. Dont let them delete anyone elses
//@TODO Cleanup (delete) any other data files associated with the user
handlers._users.delete = function(data, callback) {
  //Check phone number is valid
  const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.length == 10 ? data.queryStringObject.phone.trim() : false;
  if (phone) {
    //Looking up the user
    _data.read('users', phone, function(err, data) {
      if (!err && data) {
        //Remove hashed password from user object before returning to requester
        _data.delete('users', phone, function(err) {
          if (!err) {
            callback(200, data);
          } else {
            callback(500, {
              'Error': 'Could not delete the specified user.'
            });
          }
        });
      } else {
        callback(400, {
          'Error': 'Could not find the specified user.'
        });
      }
    })
  } else {
    callback(400, {
      'Error': 'Missing required fields'
    })
  }
}
//Ping Handler
handlers.ping = function(data, callback) {
  callback(200);
}
//Not found handler
handlers.notFound = function(data, callback) {
  callback(404);
}

//Export the module
module.exports = handlers;
