'use strict';

/**
 * This route can be used to check if the server is running.
 */
async function health(ctx, next) {
	ctx.body = {
		status: 'ok',
	};
}

module.exports = {
	health,
};
