'use strict';

const isFinite = require('lodash/isFinite');
const isNumber = require('lodash/isNumber');

/**
 * Check if value is number and finite.
 *
 * @param {mixed} val
 */
module.exports = (val) => isNumber(val) && isFinite(val);
