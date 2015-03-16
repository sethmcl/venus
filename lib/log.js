'use strict';

var clc = require('cli-color');

module.exports = {
  info: function (name, colorize) {
    var colorFn = this.noop;

    if (colorize) {
      colorFn = clc.green;
    }

    return this.log('info', name, colorFn);
  },

  debug: function (name, colorize) {
    var colorFn = this.noop;

    if (colorize) {
      colorFn = clc.cyan;
    }

    return this.log('debug', name, colorFn);
  },

  warn: function (name, colorize) {
    var colorFn = this.noop;

    if (colorize) {
      colorFn = clc.yellow;
    }

    return this.log('warn', name, colorFn);
  },

  error: function (name, colorize) {
    var colorFn = this.noop;

    if (colorize) {
      colorFn = clc.red.bold;
    }

    return this.log('error', name, colorFn);
  },

  log: function (level, name, color) {
    return function () {
      var str    = Array.prototype.slice.call(arguments, 0, 1);
      var args   = Array.prototype.slice.call(arguments, 1);
      var prefix = color(name) + '::' + color(level);
      var argIdx = 0;

      if (typeof str !== 'string') {
        str = str.toString();
      }

      str = str.replace(/%s/g, function () {
        var arg = args[argIdx++];

        if (typeof arg !== 'undefined') {
          return arg;
        } else {
          return '';
        }

      });

      console.log([prefix, ' ', str, ' (', this.codeLoc(), ') '].join(''));
    }.bind(this);
  },

  codeLoc: function () {
    var stack = new Error().stack;

    stack = stack.split('\n')[3];
    stack = stack.match(/([a-zA-Z0-9.]*:[0-9]*:[0-9]*)\)/)[1];

    return stack;
  },

  noop: function (arg) {
    return arg;
  }
};
