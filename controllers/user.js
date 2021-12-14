'use strict';

const Joi = require('../helpers/joi-ext');
const User = require('../models/user');
const AuthHelper = require('../helpers/auth');

/**
 * Login as user.
 *
 * @param {string} email
 * @param {string} password
 */
async function loginUser(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		email: Joi.string().trim().max(255).required(),
		password: Joi.string().allow('').required(),
	}));

	let user = await AuthHelper.checkUserCredentials(ctx, User.where('email', body.email), body.password); // Check credentials.
	await AuthHelper.loginUser(ctx, user.id, true); // Login - create a new session.

	ctx.body = { message: 'Login successful.' };
}

/**
 * Login with API key.
 *
 * @param {string} api_key
 */
async function loginApiKey(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		api_key: Joi.string().required(),
	}));
	let key = await AuthHelper.checkApiKeyCredentials(ctx, body.api_key); // Check credentials.
	await AuthHelper.loginApiKey(ctx, key.id); // Login - create a new session.
	ctx.body = { message: 'Login successful.' };
}

/**
 * Logout.
 */
async function logout(ctx, next) {
	await AuthHelper.logout(ctx); // Logout - destroy the current session.
	ctx.body = { message: 'Logout successful.' };
}

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = {
	loginUser,
	loginApiKey,
	logout,
};
