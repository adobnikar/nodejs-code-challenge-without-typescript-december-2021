'use strict';

const Joi = require('../helpers/joi-ext');
const User = require('../models/user');
const AuthHelper = require('../helpers/auth');
const PasswordHelper = require('../helpers/password');
const UserDAO = require('../dao/user');
const RoleDAO = require('../dao/role');
const get = require('lodash.get');

/**
 * Register a new user.
 *
 * @param {string} email Valid email address.
 * @param {string} password Password must be a non-empty string. The password strength check is skipped intentionally.
 * @param {string} repeatPassword Repeated password must match the original password field.
 * @param {string} [first_name] User's first name.
 * @param {string} [last_name] User's last name.
 */
 async function store(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		email: Joi.string().trim().email().min(4).max(255).required().error(() => 'Please enter a valid email address.'),
		password: Joi.string().required(),
		repeatPassword: Joi.string().required(),
		first_name: Joi.string().trim().allow('').allow(null).default(null),
		last_name: Joi.string().trim().allow('').allow(null).default(null),
	}));

	// let userInputs = [];
	// userInputs.push(body.email);
	// if (body.first_name != null) userInputs.push(body.first_name);
	// if (body.last_name != null) userInputs.push(body.last_name);
	// PasswordHelper.checkPasswordStrength(ctx, body.password, userInputs);

	if (body.password !== body.repeatPassword) {
		ctx.throw(400, 'Repeated password does not match.');
	}

	ctx.body = await UserDAO.store(ctx, {
		email: body.email,
		password: body.password,
		first_name: body.first_name,
		last_name: body.last_name,
	});
}

/**
 * Login as user.
 *
 * @param {string} email
 * @param {string} password
 */
async function login(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		email: Joi.string().trim().max(255).required(),
		password: Joi.string().allow('').required(),
	}));

	let user = await AuthHelper.checkUserCredentials(ctx, User.where('email', body.email), body.password); // Check credentials.
	await AuthHelper.loginUser(ctx, user.id, true); // Login - create a new session.

	ctx.body = {
		message: 'Login successful.',
		token: get(ctx, "response.headers['x-set-auth-token']", 'Please check the "x-set-auth-token" header of the response.'),
		user: await UserDAO.show(ctx, user.id),
	};
}

/**
 * Logout.
 */
async function logout(ctx, next) {
	await AuthHelper.logout(ctx); // Logout - destroy the current session.
	ctx.body = { message: 'Logout successful.' };
}

/**
 * Update a user.
 *
 * @param {integer} id User id.
 * @param {string} [first_name] User's first name.
 * @param {string} [last_name] User's last name.
 * @param {string} [password] Password must be a non-empty string. The password strength check is skipped intentionally.
 * @param {string} [role] Options are "user" and "admin".
 */
 async function update(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		id: Joi.number().integer().required(),
		first_name: Joi.string().trim().allow('').allow(null).default(null),
		last_name: Joi.string().trim().allow('').allow(null).default(null),
		password: Joi.string().allow(null).default(null),
		role: Joi.string().valid(RoleDAO.index()).allow(null).default(null),
	}));
	ctx.body = await UserDAO.update(ctx, body.id, body);
}

/**
 * Delete a user.
 *
 * @param {integer} id User id.
 */
 async function destroy(ctx, next) {
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		id: Joi.number().integer().required(),
	}));
	await UserDAO.destroy(ctx, body.id);
	ctx.body = { message: 'Account successfully deleted.' };
}

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = {
	store,
	login,
	logout,
	update,
	destroy,
};
