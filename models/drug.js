'use strict';

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
		// TODO: implement canSee / csnView / canRead scope
	},
});
