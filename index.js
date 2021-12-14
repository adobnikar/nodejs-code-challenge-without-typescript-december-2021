'use strict';

// Load .env configuration.
process.chdir(__dirname);
require('./load-env');

const Koa = require('koa');
const Log = require('unklogger');

const DatabaseHelper = require('./helpers/database');

// Require middleware.
const mwLogger = require('./middleware/logger');
const mwClickJacking = require('./middleware/click-jacking');
const mwCORS = require('./middleware/cors');
const mwOptions = require('./middleware/options');
const mwErrorHandler = require('./middleware/error-handler');
const mwBaseUrl = require('./middleware/base-url');
const routes = require('./routes');

// Async wrapper. Enable await calls.
(async () => {
	await DatabaseHelper.waitForDatabase();
	if (process.env.AUTO_MIGRATE_DB === 'true') {
		await DatabaseHelper.createDatabase(); // Create database if it does not exists.
		await DatabaseHelper.migrateLatest(); // Run latest database migrations.
	}

	// Create a Koa server instance.
	const app = new Koa();
	app.proxy = true;

	// Error handler - If the error reaches the bottom of the stack.
	app.on('error', (err) => {
		Log.error(err.message);
		Log.error(err.stack);
	});

	// Middleware.
	app.use(mwLogger);
	app.use(mwClickJacking);
	if (process.env.NODE_ENV === 'development' ||
		process.env.NODE_ENV === 'stage') {
		app.use(mwCORS);
	}
	app.use(mwOptions);
	app.use(mwErrorHandler);
	app.use(mwBaseUrl);

	// Routes.
	app.use(async (ctx, next) => {
		// Attach the router to the ctx.state so that every controller can access it.
		ctx.state.router = routes.router;
		await next();
	});
	await routes.applyUse(app);

	// Start the server.
	let server = app.listen(process.env.SERVER_PORT || 3000);
	if (server.address() === null) {
		let errMsg = 'Error: Please select a different server port by configuring the ".env" file.';
		Log.error(errMsg);
		process.exit(1);
	}
	Log.success('Server: http://127.0.0.1:' + server.address().port);
})().catch((err) => {
	Log.error('Error: Server failed to start.');
	Log.error(err);
	process.exit(1);
});