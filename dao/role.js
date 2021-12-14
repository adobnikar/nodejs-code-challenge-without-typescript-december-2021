'use strict';

const isString = require('lodash/isString');

/**
 * Database roles.
 */

const ROLES = ['user', 'admin'];
const ROLES_SET = new Set(ROLES);

/**
 * Check if a role exists.
 *
 * @param {string} role Role name.
 *
 * @returns {boolean} Role exists.
 */
function dbRoleExists(role) {
	return ROLES_SET.has(role);
}

function index() {
	return ROLES;
}

function formatRole(roles) {
	if (roles == null) return null;
	let role = 'none';
	if (roles.length > 0) {
		if (isString(roles[0])) role = roles[0];
		else role = roles[0].name;
	}
	return role;
}

module.exports = {
	index,
	dbRoleExists,
	formatRole,
};
