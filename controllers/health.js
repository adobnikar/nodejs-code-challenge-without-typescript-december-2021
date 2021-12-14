'use strict';

let startTime = Number(new Date());

/**
 * This route can be used to check if the server is running.
 */
async function health(ctx, next) {
	ctx.body = {
		message: 'Up and running.',
		uptime: (Number(new Date()) - startTime) / 1000,
	};
}

/**
 * Exported functions.
 * @type {Object}
 */
module.exports = {
	health,
};
