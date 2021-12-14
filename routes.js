'use strict';

const KoaRouter = require('koa-router');
const KoaRouterGroups = require('koa-router-groups');
const KoaApiExplorer = require('./libs/koa-api-explorer/index');

// Require middleware.
const koaBody = require('koa-body');
const AuthMiddleware = require('./middleware/auth');

// Require all exposed controllers.
const HealthController = require('./controllers/health');
const UserController = require('./controllers/user');
const DrugController = require('./controllers/drug');
const ToolController = require('./controllers/tool');

// Create koa router instance.
let router = new KoaRouter({
	// prefix: '/api',
});
KoaRouterGroups.extend(router);

// Register middleware functions.
router.registerMiddleware('body', koaBody({
	jsonLimit: '64mb',
	formLimit: '64mb',
	textLimit: '64mb',
	multipart: true,
	parsedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
}));
router.registerMiddleware('auth', AuthMiddleware.auth);
router.registerMiddleware('user', AuthMiddleware.roles(['user', 'admin']));
router.registerMiddleware('admin', AuthMiddleware.roles(['admin']));

/***********************************************************************************
 *
 * ROUTE DEFINITIONS
 *
 ***********************************************************************************/

// Push the middleware used by all routes to the stack.
router.pushMiddleware('body');

// Routes outside any auth groups will be accessible to everyone
// because they will have to pass no auth middleware.

// Health.
router.get('health', '/health', HealthController.health);

// Users.
router.post('users.store', '/user/register', UserController.store);
router.post('users.login', '/user/login', UserController.login);

// Auth group. Any routes in this group need to pass the "AuthMiddleware.auth" middleware.
router.group(['auth', 'user'], () => {
	// Users.
	router.get('users.logout', '/user/logout', UserController.logout);
	router.post('users.update', '/user/update', UserController.update);
	router.post('users.destroy', '/user/delete', UserController.destroy);

	// Drugs.
	router.get('drugs.index', '/drugs', DrugController.index);
	router.get('drugs.show', '/drugs/:id(\\d+)', DrugController.show);
	router.get('drugs.show.slug', '/drugs/slug/:slug', DrugController.showSlug);

	// Tools.
	router.post('tools.calc', '/tools/:id', ToolController.calc);
});

/**
 * Apply routes middleware function.
 *
 * @param {Koa} app
 */
async function applyUse(app) {
	// Apply the routes to the app.
	app.use(router.routes()).use(router.allowedMethods());

	// API Explorer.
	let explorer = new KoaApiExplorer({
		routesFile: __filename,
		controllerDir: './controllers',
		docsDir: './docs',
		routesExportDoc: true,
		port: process.env.SERVER_PORT || 3000,
		router: router,
		version: '1.0.0',
		title: 'Node.js Code Challenge ' + process.env.NODE_ENV_ALIAS,
		description: 'Node.js Code Challenge.',
		contactName: 'Info',
		contactEmail: 'info@example.com',
	});
	app.use(explorer.apiExplorer());
}

module.exports = {
	router,
	applyUse,
};
