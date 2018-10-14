/**
*Create and export configuration variables
*/

//Container for all the environments
var environments = {};

//Staging object
environments.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging'
}

//Production object
environments.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName': 'production'
}

//Determine which environment was passed as a command-line argument
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check current environment is any of the environments above, default to Staging
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;
