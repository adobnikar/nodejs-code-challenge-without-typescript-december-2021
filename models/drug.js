'use strict';

const { get } = require('lodash');
const Bookshelf = require('../bookshelf');

module.exports = Bookshelf.model('Drug', {
	tableName: 'drugs',
	hasTimestamps: ['created_at', 'updated_at'],

	// Format data coming from the database.
	parse: function(response) {
		if (response.confirmed != null) response.confirmed = Boolean(response.confirmed);
		if (response.published != null) response.published = Boolean(response.published);
		return response;
	},

	/**
	 * Scopes.
	 */

	scopes: {
		canRead(q, ctx) {
			let ctxRole = get(ctx, 'state.user.role', null);
			let ctxIsAdmin = (ctxRole === 'admin');
			if (!ctxIsAdmin) {
				q.be.where('confirmed', true).where('published', true);
			}
		},
	},
});
