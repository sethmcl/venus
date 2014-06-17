'use strict';

var Config  = require('./Config');
var Plugins = require('./Plugins');

module.exports = Kernel;

/**
 * Venus' core object which orchestrates all other activity.
 * @constructor
 * @param {object} argv - key/value hash.
 */
function Kernel(argv) {
  this.config  = new Config(argv);
  this.plugins = new Plugins(this);
}

/**
 * Run the application
 */
Kernel.prototype.run = function () {
  this.plugins.instantiate()
    .then(this.plugins.argv)
    .then(this.plugins.init)
    .then(this.plugins.attach)
    .then(this.plugins.run)
    .then(this.exit)
    .then(null, this.error);
};

/**
 * Handle error
 * @param {Error} err
 */
Kernel.prototype.error = function (err) {
  console.error(err);
  process.exit(1);
};

