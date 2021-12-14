'use strict';

const path = require('path');

// Load .env configuration.
require(path.resolve(__dirname, './load-env'));

module.exports = {
	client: 'pg',
	connection: {
		host: process.env.POSTGRES_HOST || 'challenge_postgres',
		port: process.env.POSTGRES_PORT || '5432',
		user: process.env.POSTGRES_USER || 'challenge_user',
		password: process.env.POSTGRES_PASSWORD || '',
		database: process.env.POSTGRES_DATABASE || 'challenge_db',
		charset: 'utf8mb4',
		timezone: 'UTC',
	},
	pool: {
		min: 2,
		max: 10,
	},
	migrations: {
		directory: path.resolve(__dirname, './migrations'),
		tableName: 'migrations',
	},
	seeds: {
		directory: path.resolve(__dirname, './seeds'),
		loadExtensions: ['.js'],
	},
	debug: process.env.KNEX_DEBUG === 'true',
	log: {
		// eslint-disable-next-line no-empty-function
		warn() { }, // NOTE: Do not log warning messages.
	},
};
