/**
 *Create and export configuration variables
 */

//Container for all the environments
var environments = {};

//Staging object
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'envName': 'staging',
    'hashingSecret': 'shhhhhh...koi_hai',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+15005550006'
    }
}

//Production object
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'shhhhhh...phir_koi_hai',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'fromPhone': ''
    }
}

//Determine which environment was passed as a command-line argument
var currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

//Check current environment is any of the environments above, default to Staging
var environmentToExport = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

//Export the module
module.exports = environmentToExport;
