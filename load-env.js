'use strict';

const fs = require('fs');
const path = require('path');
const secret = require(path.resolve(__dirname, './helpers/secret'));

// Load .env configuration.
require('dotenv').config({
	path: path.resolve(__dirname, './.env'),
});

// Set default port values.
process.env.SERVER_PORT = process.env.SERVER_PORT || 3000;

// Set the default values of env variables.
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.NODE_ENV_ALIAS = 'Unknown';
process.env.THROTTLE_PER_IP = true; // Used for throttling.
if (process.env.NODE_ENV === 'development') {
	process.env.NODE_ENV_ALIAS = 'Dev';
	process.env.THROTTLE_PER_IP = false;
} else if (process.env.NODE_ENV === 'stage') {
	process.env.NODE_ENV_ALIAS = 'Stage';
	process.env.THROTTLE_PER_IP = false;
} else if (process.env.NODE_ENV === 'production') {
	process.env.NODE_ENV_ALIAS = 'Live';
}

// Generate secret keys.
function checkJWTSecret(name) {
	// Check if JWT secret preset. If not then generate it.
	if (process.env[name] == null) {
		let jwtSecret = secret.generateSecret();
		fs.appendFileSync(path.resolve(__dirname, './.env'),
			`\n${name}=` + jwtSecret + '\n');
		process.env[name] = jwtSecret;
		console.log(`${name} generated.`);
	}
}

// Generate JWT secret for authorization purposes.
checkJWTSecret('JWT_SECRET');
