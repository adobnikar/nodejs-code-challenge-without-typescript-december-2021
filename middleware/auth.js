'use strict';

const get = require('lodash/get');
const AuthHelper = require('../helpers/auth');

/**
 * Authorization middleware.
 * This function checks if the API key is logged in by checking if a API key session is present.
 * It also attaches the API key to the context state.
 */
async function auth(ctx, next) {
	// Check if the auth token present and valid.
	let token = await AuthHelper.getToken(ctx);

	// Check if the session is present.
	if (token == null) {
		ctx.throw(401, 'Not authorized. Please login.');
	}

	try {
		// Set the user or API key as authorized.
		AuthHelper.setAuth(ctx, token);
	} catch (err) {
		ctx.throw(401, 'Not authorized. Please login.');
	}

	// Execute the route.
	if (next != null) await next();
}

/**
 * Middleware that checks if user has any of the given roles.
 *
 * @param roleList (array of strings) Or-List of roles.
 */
function roles(roleList) {
	// If roleList not an array the encapsulate it into an array.
	if (roleList.constructor !== Array) {
		roleList = [roleList];
	}

	return async function(ctx, next) {
		// Check if the user is logged in.
		let userId = get(ctx, 'state.user.id', null);
		if (userId == null) {
			ctx.throw(403, 'Forbidden. This endpoint can only be accessed as a logged in user.');
		}

		// Check if user has any of the roles on the list.
		let user = ctx.state.user;
		for (let roleName of roleList) {
			if (!user.roles.has(roleName)) {
				continue;
			}

			// Execute the route.
			if (next != null) await next();
			return;
		}

		// None of the roles matched.
		ctx.throw(403, 'Forbidden. You are missing the permission to perform this action.');
	};
}

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = {
	auth,
	roles,
};
