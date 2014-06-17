'use strict';

var path = require('path');
var q    = require('q');

module.exports = Plugins;

/**
 * Plugin Manager
 * @constructor
 * @param {Kernel} kernel - Venus kernel object
 */
function Plugins(kernel) {
  this.config = kernel.config;
}

/**
 * Instantiate all plugins, specified in config
 */
Plugins.prototype.instantiate = function () {
  var def = q.defer();

  this.config.ctx().then(function (ctx) {
    var rcPath           = ctx.rc.__dirOnDisk;
    this.pluginOptions   = ctx.get('plugins');
    this.pluginInstances = {};

    Object.keys(this.pluginOptions).forEach(function (p) {
      var plugin;
      var PluginConstructor;

      p = path.resolve(rcPath, p);

      try {
        debugger;
        PluginConstructor = require(p);
        plugin = new PluginConstructor();
      } catch (e) {
        def.reject('Unable to instantiate plugin ' + p);
        return;
      }

      try {
        this.add(plugin, p);
      } catch (e) {
        def.reject(e);
      }
    }, this);

    def.resolve();
  }.bind(this));

  return def.promise;
};

/**
 * @param {object} plugin - plugin to add
 * @param {string} p - plugin source path
 */
Plugins.prototype.add = function (plugin, p) {
  debugger;
  if (!plugin.name) {
    throw new Error('Plugin loaded from ' + p + ' is missing the name property');
  }

  if (this.pluginInstances[plugin.name]) {
    throw new Error('Plugin name collision: ' + plugin.name);
  }

  this.pluginInstances[plugin.name] = plugin;
};
