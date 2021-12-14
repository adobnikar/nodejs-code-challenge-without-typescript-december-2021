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
 * Exported functions.
 * @type {Object}
 */
 module.exports = {
	store,
};
