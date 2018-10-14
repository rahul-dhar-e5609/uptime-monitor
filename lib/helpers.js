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

//Export the MODULE
module.exports = helpers;
