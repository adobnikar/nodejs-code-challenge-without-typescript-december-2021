'use strict';

const MomentExtension = require('./joi-moment');

const JoiStringConvertible = function(joi) {
	return {
		base: joi.string(),
		name: 'stringConvertible',
		coerce(value, state, options) {
			function isNumeric(n) {
				return !isNaN(parseFloat(n)) && isFinite(n);
			}
			if (isNumeric(value)) {
				return value.toString();
			}
			return value;
		},
	};
};

const Joi = require('joi').extend([ JoiStringConvertible ]).extend(MomentExtension);
const extend = require('lodash/extend');

const settings = {
	passwordMinLength: 8,
	passwordMaxLength: 255,
	passwordRegex: /^(?=.*\d)(?=.*[A-Za-z]).*$/,
	passwordErrorMessage: 'Password must contain at at least one letter and one number.',
};

// Set a default error handler.
Joi.originalValidateFn = Joi.validate;
Joi.validate = (data, schema, options) => {
	let baseOptions = {
		allowUnknown: true,
		stripUnknown: true,
	};
	options = extend(baseOptions, options);
	let result = Joi.originalValidateFn(data, schema, options);
	return result;
};

Joi.attempt = function(value, schema, message, options) {
	const result = this.validate(value, schema, options);
	const error = result.error;

	if (error) {
		if (!message) {
			// if (typeof error.annotate === 'function') {
			// 	error.message = error.annotate();
			// }
			throw error;
		}

		if (!(message instanceof Error)) {
			if (typeof error.annotate === 'function') {
				error.message = `${message} ${error.annotate()}`;
			}
			throw error;
		}

		throw message;
	}

	return result.value;
};

Joi.password = () => {
	return Joi.string().min(settings.passwordMinLength).max(settings.passwordMaxLength)
		.regex(settings.passwordRegex, settings.passwordErrorMessage);
};

Joi.color = () => {
	return Joi.string().trim().regex(/^#[0-9a-f]{6}$/i, 'Invalid color value.');
};

Joi.loginCode = () => {
	return Joi.string().trim().min(5).max(5).regex(/^\d{5}$/, 'Invalid login code value.');
};

Joi.username = () => {
	return Joi.string().trim().min(3).max(255).regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase alphanumeric characters and the underscore "_".');
};

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = Joi;
