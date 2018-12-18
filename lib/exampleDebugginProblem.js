/**
 * This is a library that demonstrated something
 * throwing when its init is called
 */

//Container

var example = {};

example.init = function() {
  var foo = bar;
};

module.exports = example;
