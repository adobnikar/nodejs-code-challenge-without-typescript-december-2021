'use strict';

const moment = require('moment');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const LockHelper = require('../helpers/lock');
const AuthHelper = require('../helpers/auth');
const AuthTokenInvalidateHelper = require('../helpers/auth-token-invalidate');
const RoleDAO = require('../dao/role');

const get = require('lodash/get');
const isArray = require('lodash/isArray');
const isNonEmptyString = require('../helpers/isNonEmptyString');
const isNonEmptyArray = require('../helpers/isNonEmptyArray');

const User = require('../models/user');

function formatUser(data, ctx = null) {
	if (data == null) return;

	if (('id' in data) && (ctx != null)) {
		data.is_me = (data.id === get(ctx, 'state.user.id', null));
	}
	if (isArray(data.roles)) data.role = RoleDAO.formatRole(data.roles);

	if ('first_name' in data) data.first_name = (data.first_name || '').trim();
	if ('last_name' in data) data.last_name = (data.last_name || '').trim();
	if (('first_name' in data) && ('last_name' in data)) {
		data.full_name = `${data.first_name.trim()} ${data.last_name.trim()}`.trim();
	}
}

async function checkDuplicateEmail(ctx, email, userId = null) {
	let query = User.where('email', email);
	if (userId != null) query.whereNot('id', userId);
	let dCount = await query.count();
	ctx.assert(dCount <= 0, 400, 'An account with this email already exists.');
}

function setDefaultUserData(data) {
	let ctime = moment.utc().format('YYYY-MM-DD HH:mm:ss');
	return {
		email: data.email,
		password: (data.password != null) ? data.password : null,
		role: (data.role != null) ? data.role : 'user',
		first_name: data.first_name || '',
		last_name: data.last_name || '',
		created_at: (data.created_at != null) ? data.created_at : ctime,
		updated_at: (data.updated_at != null) ? data.updated_at : ctime,
	};
}

/**
 * Get user details.
 *
 * @param {KoaContext} ctx
 * @param {integer} [userId]
 */
 async function show(ctx, userId) {
	let user = await User.where('id', userId).first();
	ctx.assert(user, 400, `User with id ${userId} not found.`);
	user = user.toJSON();
	formatUser(user, ctx);
	return user;
}

/**
 * Create a new user.
 *
 * @param {KoaContext} ctx
 * @param {object} data User's data.
 */
 async function store(ctx, data) {
	await checkDuplicateEmail(ctx, data.email);

	// Create the user.
	let user = new User(setDefaultUserData({
		email: data.email,
		password: (data.password != null) ? await bcrypt.hash(data.password, 10) : null,
		role: data.role,
		first_name: data.first_name,
		last_name: data.last_name,
	}));
	await user.save();

	user = user.toJSON();
	formatUser(user, ctx);
	return user;
}
store = LockHelper.lockify(store, 'cuUser');

/**
 * Update an existing user.
 *
 * @param {KoaContext} ctx
 * @param {integer} id User id.
 * @param {object} data User's data.
 */
 async function update(ctx, id, data) {
	// Only admin can edit other users.
	let user = await User.select(['id', 'role']).where('id', id).first();
	ctx.assert(user, 400, `User with id ${id} not found.`);
	user = user.toJSON();
	let isMe = (user.id === get(ctx, 'state.user.id', null));
	let ctxRole = get(ctx, 'state.user.role', null);
	let ctxIsAdmin = (ctxRole === 'admin');

	// Check if the logged in user can edit this user.
	if (!isMe && !ctxIsAdmin) {
		ctx.throw(400, 'You don\'t have the permission to edit this user.');
	}

	// Check if the role can be changed.
	let newRole = null;
	if (ctxIsAdmin) {
		newRole = data.role;
	} else if (data.role != null) {
		ctx.throw(400, `Only admins have the permission to change other user's role.`);
	}

	// Update the user.
	user = new User({ id: id });
	if (data.password != null) user.set('password', await bcrypt.hash(data.password, 10));
	if (data.first_name != null) user.set('first_name', data.first_name);
	if (data.last_name != null) user.set('last_name', data.last_name);
	if (newRole != null) user.set('role', newRole);

	// Save the changes.
	if (Object.keys(user.changed).length > 0) {
		await user.save();
	}

	// If user's role was changed then we need to invalidate the JWT access token.
	if (newRole != null) {
		AuthTokenInvalidateHelper.invalidateUser(id);
	}

	user = user.toJSON();
	formatUser(user, ctx);
	return user;
}
update = LockHelper.lockify(update, 'cuUser');

/**
 * Soft delete a user account.
 *
 * @param {KoaContext} ctx
 * @param {integer} userId
 */
 async function destroy(ctx, userId) {
	let user = await User.select(['id']).where('id', userId).first();
	ctx.assert(user, 400, `User with id ${userId} not found.`);

	let isMe = (user.id === get(ctx, 'state.user.id', null));
	let ctxRole = get(ctx, 'state.user.role', null);
	let ctxIsAdmin = (ctxRole === 'admin');

	if (!isMe && !ctxIsAdmin) {
		ctx.throw(400, 'You do not have the permission to delete this user.');
	}

	await User.where('id', userId).delete();
	await AuthHelper.logout(ctx, userId);
}

/**
 * Exported functions.
 * @type {Object}
 */
 module.exports = {
	show,
	store,
	update,
	destroy,
};
