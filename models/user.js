'use strict';

const Bookshelf = require('../bookshelf');
const isArray = require('lodash/isArray');

module.exports = Bookshelf.model('User', {
	tableName: 'users',
	hasTimestamps: ['created_at', 'updated_at'],
	hidden: [
		'password',
		'deleted_at',
	],
	softDelete: true,

	/**
	 * Scopes.
	 */

	scopes: {
		isMe: (q, userId) => q.be.isOwnerScope(userId, 'id'),
		isNotMe: (q, userId) => q.be.isNotOwnerScope(userId, 'id'),

		whereRole(q, roles) {
			if (!isArray(roles)) roles = [roles];
			q.be.whereIn('role', roles);
		},
	},
});
