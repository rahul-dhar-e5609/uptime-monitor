/**
 *  Helpers for various tasks
 */

//Dependencies
const crypto = require('crypto');
const config = require('./config');

//Container for all the Helpers
const helpers = {};

//Create a SHA256 hash - NODE SUPPORT
helpers.hash = function(str) {
    //Validate string
    if (typeof(str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('SHA256', config.hashingSecret).update(str).digest('hex');
        return hash;
    }
    return false;
}

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
    strLength = typeof(stringLength) == 'number' && stringLength > 0 ? stringLength : false;
    if (strLength) {
        //Define all possible characters that could go into a string
        var possibleCharaters = 'abcdefghijklmnopqrstuvwxyz0123456789';
        //Start the final string
        var str = '';
        for (i = 0; i < strLength; i++) {
            //Get a random charater from the possible charaters
            var randomCharater = possibleCharaters.charAt(Math.floor(Math.random() * possibleCharaters.length))
            //Append this charater to the final string
            str += randomCharater;
        }
        //Return the final string
        return str;
    } else {
        return false;
    }
}
//Export the MODULE
module.exports = helpers;
