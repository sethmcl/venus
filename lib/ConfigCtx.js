'use strict';

module.exports = ConfigCtx;

/**
 * Configuration context
 * @constructor
 * @param {array} rcs - Array of .venusrc data objects, highest priority last
 * @param {object} annotations - @venus annotations
 */
function ConfigCtx(rcs, annotations) {
  this.rc          = rcs[rcs.length - 1];
  this.annotations = annotations;
}

/**
 * Get value
 * @param {string} p - Property path to lookup
 * @return {object} value or null if path is invalid
 */
ConfigCtx.prototype.get = function (p) {
  if (this.annotations[p]) {
    return this.annotations[p];
  } else if (this.rc[p]) {
    return this.rc[p];
  } else {
    return null;
  }
};
