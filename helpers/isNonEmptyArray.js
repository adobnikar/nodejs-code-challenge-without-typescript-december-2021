'use strict';

const isArray = require('lodash/isArray');

function isNonEmptyArray(arr) {
	if (!isArray(arr)) return false;
	return arr.length > 0;
}

module.exports = isNonEmptyArray;
