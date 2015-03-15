'use strict';

var path     = require('path');
var Promise  = require('bluebird');
var VenusCtx = require('./VenusCtx');

module.exports = Plugins;

/**
 * Plugin Manager
 * @constructor
 * @param {Kernel} kernel - Venus kernel object
 */
function Plugins(kernel) {
  this.log             = kernel.log;
  this.config          = kernel.config;
  this.configCtx       = this.config.ctx();
  this.run             = this.exec.bind(this, 'run');
  this.attach          = this.exec.bind(this, 'attach');
  this.init            = this.exec.bind(this, 'init');
  this.exit            = this.exec.bind(this, 'exit');
  this.pluginInstances = {};
}

/**
 * Instantiate all plugins, specified in config
 */
Plugins.prototype.instantiate = function () {
  var configCtx      = this.configCtx;
  var defaultPlugins = configCtx.getWithMeta('defaultPlugins');
  var plugins        = configCtx.getWithMeta('plugins');
  var pluginsToLoad  = this.preparePluginsToLoad(defaultPlugins, plugins);

  pluginsToLoad.forEach(this.instantiatePlugin, this);

  return this.checkDependencies(this.pluginInstances);
};

/**
 * Check dependencies between plugins. If a plugin has a `dependsOn` property,
 * verify that all plugins specified are also loaded.
 *
 * For example, if a plugin instance has dependsOn = ['venus-http'], then we
 * need to ensure that the `venus-http` plugin is also loaded.
 * @param {object} plugins Loaded plugins
 */
Plugins.prototype.checkDependencies = function (plugins) {
  var missingDependencies = [];

  Object.keys(plugins).forEach(function (pluginName) {
    var dependsOn = this.pluginInstances[pluginName].dependsOn;

    if (!dependsOn) {
      return;
    }

    if (typeof dependsOn === 'string') {
      dependsOn = [dependsOn];
    }

    if (!Array.isArray(dependsOn)) {
      return;
    }

    dependsOn.forEach(function (dependency) {
      if (!this.pluginInstances[dependency]) {
        missingDependencies.push({
          plugin: pluginName,
          dependsOn: dependency
        });
      }
    }, this);

  }, this);

  return missingDependencies;
};

/**
 * Prepare list of plugins to load
 */
Plugins.prototype.preparePluginsToLoad = function (defaultPlugins, plugins) {
  var pluginList = [];

  if (typeof defaultPlugins.value === 'object') {
    pluginList = pluginList.concat(
      Object
        .keys(defaultPlugins.value)
        .filter(this.filterDefaultPlugins.bind(this, plugins.value))
        .map(this.getValue.bind(this, defaultPlugins))
    );
  }

  if (typeof plugins.value === 'object') {
    pluginList = pluginList.concat(
        Object
          .keys(plugins.value)
        .map(this.getValue.bind(this, plugins))
    );
  }

  return pluginList;
};

/**
 * Filter out default plugins that are also listed in plugins
 */
Plugins.prototype.filterDefaultPlugins = function (customPlugins, pluginName) {
  if (typeof customPlugins !== 'object') {
    return true;
  }

  return !customPlugins[pluginName];
};

/**
 * Return item from object
 */
Plugins.prototype.getValue = function (obj, key) {
  return {
    name: key,
    data: obj.value[key],
    meta: obj.meta
  };
};

/**
 * Instantiate a plugin
 * @param {object} p
 */
Plugins.prototype.instantiatePlugin = function (p) {
  var plugin;
  var PluginConstructor;
  var pluginPath;
  var venus;
  var config;
  var cwd = this.config.cwd;

  if (p.meta.type === 'file') {
    cwd = p.meta.dir;
  }

  if (typeof p.data === 'string') {
    pluginPath = p.data;
  } else if (typeof p.data.path === 'string') {
    pluginPath = p.data.path;
  } else {
    pluginPath = p.name;
  }

  try {
    PluginConstructor = require(pluginPath);
  }
  catch (e1) {
    try {
      pluginPath        = path.resolve(cwd, pluginPath);
      PluginConstructor = require(pluginPath);
    } catch (e) {
      throw new Error('Unable to instantiate plugin: ' + pluginPath + e1.stack);
    }
  }

  config = this.config.ctx();
  config.addStore({
    provider: 'literal',
    data: p.data
  }, 1);

  venus  = new VenusCtx(PluginConstructor.prototype.name, config, this.pluginInstances);
  plugin = new PluginConstructor(venus, config);

  try {
    this.add(plugin, p);
  } catch (e) {
    throw Error(e);
  }

  this.log.debug('Loaded plugin %s via require(\'%s\')', plugin.name, pluginPath);
};

/**
 * @param {object} plugin - plugin to add
 * @param {string} p - plugin source path
 */
Plugins.prototype.add = function (plugin, p) {
  if (!plugin.name) {
    throw new Error('Plugin loaded from ' + p + ' is missing the name property');
  }

  if (this.pluginInstances[plugin.name]) {
    throw new Error('Plugin name collision: ' + plugin.name);
  }

  this.pluginInstances[plugin.name] = plugin;
};

/**
 * Run
 */
Plugins.prototype.exec = function (method) {
  return Promise.all(
    Object
      .keys(this.pluginInstances)
      .map(function (key) {
        var plugin = this.pluginInstances[key];

        if (typeof plugin[method] === 'function') {
          return this.pluginInstances[key][method]();
        }
      }, this)
  );
};
