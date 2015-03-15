'use strict';

var Config  = require('./Config');
var Plugins = require('./Plugins');
var str     = require('./util/str');
var log     = require('./log');

module.exports = Kernel;

/**
 * Venus' core object which orchestrates all other activity.
 * @constructor
 * @param {object} argv - key/value hash.
 */
function Kernel(argv) {
  this.config  = new Config(argv);
  this.log     = this.logger();
  this.plugins = new Plugins(this);
}

/**
 * Run the application
 */
Kernel.prototype.run = function () {
  var config = this.config.ctx();
  var errors = this.plugins.instantiate();

  if (errors.length > 0) {
    this.dependencyFailure(errors);
    return;
  }

  if (config.get('h') || config.get('help')) {
    this.usage();
  } else {
    this.plugins.init()
      .then(this.plugins.attach)
      .then(this.plugins.run)
      .then(this.plugins.exit)
      .then(null, this.error);
  }
};

/**
 * Fail due to missing dependencies
 * @param {array} errors Missing dependencies
 */
Kernel.prototype.dependencyFailure = function (errors) {
  errors.forEach(function (error) {
    this.log.error('Missing dependency %s (required by %s)', error.dependsOn, error.plugin);
  }, this);

  process.exit(1);
};

/**
 * Create log functions
 */
Kernel.prototype.logger = function () {
  var colorize = !Boolean(this.config.ctx().get('noColors'));

  return {
    info: log.info('venus', colorize),
    debug: log.debug('venus', colorize),
    error: log.error('venus', colorize)
  };
};

/**
 * Handle error
 * @param {Error} err
 */
Kernel.prototype.error = function (err) {
  console.error(err.stack);
  process.exit(1);
};

/**
 * Show help
 */
Kernel.prototype.usage = function () {
  var args = [
    {
      switches: ['-h', '--help'],
      description: 'show help'
    },
    {
      switches: ['--disable-colors'],
      description: 'disable colors in output logs'
    }
  ];

  console.log('Usage: venus [command] [arguments]\n');
  console.log('Options:');

  args.forEach(function (arg) {
    console.log(str.fmt(arg.switches.join(', '), 2, 30), arg.description);
  });
};
