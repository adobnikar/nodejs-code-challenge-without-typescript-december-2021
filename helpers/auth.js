'use strict';

const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const SecretHelper = require('../helpers/secret');
const AuthTokenInvalidateHelper = require('../helpers/auth-token-invalidate');

const isString = require('lodash/isString');
const isArray = require('lodash/isArray');
const get = require('lodash/get');

const RoleDAO = require('../dao/role');
const Session = require('../models/session');
const User = require('../models/user');

let rollingJWTSecrets = [];

/**
 * Settings.
 */

const ROLLING_SECRET_TIMEOUT = 60 * 60 * 1000; // In milliseconds.
const ACCESS_TOKEN_MAX_AGE = AuthTokenInvalidateHelper.ACCESS_TOKEN_MAX_AGE; // 15 min in milliseconds.
const SESSION_MAX_AGE = 24 * 60 * 60 * 1000; // In milliseconds, null is infinite.
const USE_COOKIES = true;

async function getRegisteredUser(ctx, userQuery) {
	let user = await userQuery.select(['id', 'password', 'role']).first();
	ctx.assert(user, 400, 'Credentials are incorrect.');
	return user;
}

/**
 * Check user credentials.
 *
 * @param {KoaContext} ctx Koa context.
 * @param {BookshelfQuery} userQuery
 * @param {string} password
 */
async function checkUserCredentials(ctx, userQuery, password) {
	// Get the user & check if the user was found.
	let user = await getRegisteredUser(ctx, userQuery);

	// Check if user has the password set.
	let pwHash = user.get('password');
	const WRONG_PWD_ERROR = 'Credentials are incorrect.';
	if (!isString(pwHash)) {
		ctx.throw(400, WRONG_PWD_ERROR);
	}

	// Verify password with bcrypt.
	if (!(await bcrypt.compare(password, pwHash))) {
		ctx.throw(400, WRONG_PWD_ERROR);
	}

	user = user.toJSON();
	return user;
}

/**
 * Helper function to clear expired rolling JWT secrets and to generate new secrets.
 */
function rollJWTSecrets() {
	for (let secret of rollingJWTSecrets) {
		let diff = Date.now() - secret.createdAt;
		secret.main = (diff < ROLLING_SECRET_TIMEOUT);
		secret.active = (diff < (ROLLING_SECRET_TIMEOUT + 2 * ACCESS_TOKEN_MAX_AGE));
	}
	rollingJWTSecrets = rollingJWTSecrets.filter(secret => secret.active);
	if ((rollingJWTSecrets.length < 1) || !rollingJWTSecrets[0].main) {
		// If there are no main secrets generate a new one.
		rollingJWTSecrets.unshift({
			secret: SecretHelper.generateSecret(),
			createdAt: Date.now(),
			main: true,
			active: true,
		});
	}
}

/**
 * Helper function to sign JWT token with rolling secrets.
 *
 * @param {object} data
 * @param {object} opts
 */
function rollingJWTSign(data, opts) {
	rollJWTSecrets();
	return jwt.sign(data, rollingJWTSecrets[0].secret, opts);
}

/**
 * Helper function to verify JWT token with rolling secrets.
 *
 * @param {string} token JWT string.
 */
function rollingJWTVerify(token) {
	rollJWTSecrets();
	let verror = null;
	for (let secret of rollingJWTSecrets) {
		try {
			let decoded = jwt.verify(token, secret.secret);
			if (!AuthTokenInvalidateHelper.isValid(decoded)) {
				let error = new Error('Token was invalidated.');
				error.name = 'TokenInvalidated';
				throw error;
			}
			return decoded;
		} catch (error) {
			if (verror == null) verror = error;
		}
	}
	if (verror != null) throw verror;
	throw new Error('Out of rolling secrets. This error should never happen.');
}

/**
 * Helper function to create and set the access token.
 *
 * @param {KoaContext} ctx
 * @param {object} session Session object.
 * @param {string} key Secret session key.
 */
async function createAccessTokenData(ctx, session, key) {
	let dataObj = {
		t: 'a', // Type: access token.
		s: session.id, // Session id.
		k: key, // Secret session key.
		u: session.user_id || null, // User id.
		c: Date.now(), // Created at.
	};

	if (session.user_id != null) {
		let user = await User.select(['id', 'role']).where('id', session.user_id).first();
		if (user == null) {
			if (ctx == null) throw new Error('User not found.');
			else ctx.throw(400, 'User not found.');
		}
		user = user.toJSON();
		if (isString(user.role)) dataObj.r = user.role; // User's roles.
	}

	return dataObj;
}

function setAccessToken(ctx, dataObj) {
	// Create signed token.
	let token = rollingJWTSign(dataObj, {
		expiresIn: Math.floor(ACCESS_TOKEN_MAX_AGE / 1000), // Must be passed in as seconds.
	});

	// Set auth response header.
	ctx.set('x-set-auth-token', token);

	// Set cookie.
	if (USE_COOKIES) {
		let cookieOpts = {
			overwrite: true,
			httpOnly: true,
		};
		if (SESSION_MAX_AGE != null) cookieOpts.maxAge = SESSION_MAX_AGE;
		ctx.cookies.set('token', token, cookieOpts);
	}
}

/**
 * Helper function to create and set the access token.
 *
 * @param {KoaContext} ctx
 * @param {object} session Session object.
 * @param {string} key Secret session key.
 */
async function createAndSetAccessToken(ctx, session, key) {
	let dataObj = await createAccessTokenData(ctx, session, key);
	setAccessToken(ctx, dataObj);
	return dataObj;
}

/**
 * Login as user.
 *
 * @param {KoaContext} ctx
 * @param {integer} userId
 */
async function loginUser(ctx, userId) {
	await getRegisteredUser(ctx, User.where('id', userId));

	// Remove all expired sessions.
	await Session.isExpired().delete({ require: false });

	// Store the session in the database.
	let sessionKey = SecretHelper.generateSecret(); // Generate random session key.
	let expiresAt = null;
	if (SESSION_MAX_AGE != null) {
		expiresAt = moment.utc().add(SESSION_MAX_AGE, 'ms').format('YYYY-MM-DD HH:mm:ss');
	}
	let session = new Session({
		key: await bcrypt.hash(sessionKey, 10),
		user_id: userId,
		expires_at: expiresAt,
		data: null,
	});
	await session.save();
	session = session.toJSON();

	let token = await createAndSetAccessToken(ctx, session, sessionKey);
	setAuthUser(ctx, token);
}

/**
 * Logout.
 *
 * @param {KoaContext} ctx
 * @param {integer} [userId] Pass the user id if you want to clear all sessions for this user.
 */
async function logout(ctx, userId = null) {
	// Clear all sessions for the given user id.
	if (userId != null) {
		AuthTokenInvalidateHelper.invalidateUser(userId);
		await Session.where('user_id', userId).delete({ require: false });
	}

	let ctxUserId = get(ctx, 'state.user.id', null);
	if ((userId == null) || (userId === ctxUserId)) {
		// Remove the session from the database.
		let sessionId = get(ctx, 'state.session.id', null);
		if (sessionId != null) {
			AuthTokenInvalidateHelper.invalidateSession(sessionId);
			await Session.where('id', sessionId).delete({ require: false });
		}

		// Override the header.
		ctx.set('x-set-auth-token', 'logout');

		if (USE_COOKIES) {
			// Override the cookie.
			let opts = {
				overwrite: true,
				httpOnly: true,
				maxAge: 0,
			};
			ctx.cookies.set('token', 'logout', opts);
		}
	}
}

async function validateToken(ctx, token) {
	// Token format:
	// t: 'a', // Type: access token.
	// s: session.id, // Session id.
	// k: key, // Secret session key.
	// u: user_id, // User id.
	// c: Date.now(), // Created at.

	let decoded = jwt.decode(token);
	if (decoded == null) {
		throw new Error('Token invalid. Could not be decoded.');
	}
	if (decoded.t !== 'a') {
		throw new Error('Invalid token type. Access token is required.');
	}
	if (decoded.c > Date.now()) {
		throw new Error('Invalid token created at timestamp. Token was created in the future.');
	}

	try {
		// Validate token signature.
		// If token fails validation it will throw an error.
		decoded = rollingJWTVerify(token);
		return decoded;
	} catch (error) {
		if ((error.name !== 'TokenExpiredError') && !((error.name === 'JsonWebTokenError') && (error.message === 'invalid signature'))) {
			throw error;
		}

		// Check if valid session in the database.
		let session = null;
		if (decoded.u != null) {
			session = await Session.where('id', decoded.s).where('user_id', decoded.u).isValid().first();
		}
		if (session == null) {
			throw new Error('No valid session found in the database.');
		}

		// Verify secret session key with bcrypt.
		let hash = session.get('key');
		if (!(await bcrypt.compare(decoded.k, hash))) {
			throw new Error('Secret session key incorrect.');
		}

		// Create a new access token.
		session = session.toJSON();
		let tokenData = await createAndSetAccessToken(ctx, session, decoded.k);
		return tokenData;
	}

	// This should never happen.
	// return null;
}

/**
 * Get and verify auth token.
 *
 * @param {KoaContext} ctx
 */
async function getToken(ctx) {
	// Try to find the JWT token.
	let token = null;

	// First try to get the session token from the authorization header.
	if (ctx.headers.authorization != null) {
		let tokens = ctx.headers.authorization.split(' ');
		if (tokens.length >= 2) {
			token = tokens[1];
		}
	}

	// Try to get the session key from the cookie.
	if (USE_COOKIES && (token == null)) {
		token = ctx.cookies.get('token');
	}

	// If there is no token we can't do anything.
	if (!isString(token)) {
		return null;
	}

	// Validate token and return decoded token data.
	try {
		let decoded = await validateToken(ctx, token);
		return decoded;
	} catch (error) {
		return null;
	}
}

function decodeUserData(token) {
	// Create the user object.
	let roles = RoleDAO.resolveRoles(token.r || []);
	let user = {
		id: token.u || null,
		roles: new Set(roles),
		role: RoleDAO.formatRole(roles),
	};

	// Attach the hasRole/can function to the user.
	user.hasRole = (roleNames) => {
		if (!isArray(roleNames)) roleNames = [roleNames];
		for (let roleName of roleNames) {
			// Spelling check.
			if (!RoleDAO.dbRoleExists(roleName)) throw new Error(`Checked hasRole/can for unknown role "${roleName}".`);
			if (user.roles.has(roleName)) return true;
		}
		return false;
	};
	user.can = user.hasRole;

	// Cast the set of role names to an array when serialized to JSON.
	user.roles.toJSON = () => {
		return Array.from(user.roles);
	};

	return user;
}

/**
 * Function that attaches the logged in user to the context.
 *
 * @param {KoaContext} ctx
 * @param {object} token
 */
function setAuth(ctx, token) {
	setAuthUser(ctx, token);
}

/**
 * Function that attaches the logged in user to the context.
 *
 * @param {KoaContext} ctx
 * @param {object} token
 */
function setAuthUser(ctx, token) {
	ctx.state = ctx.state || {};
	ctx.state.user = decodeUserData(token); // Create the user object and attach the user the context state.
	ctx.state.session = { id: token.s }; // Attach the session to the context state.
}

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = {
	checkUserCredentials,
	loginUser,
	logout,
	getToken,
	setAuth,
	setAuthUser,
};
