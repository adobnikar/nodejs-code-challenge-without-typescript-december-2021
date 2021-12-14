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

// // Auth.
// router.post('auth.login.user', '/auth/login', AuthController.loginUser);
// router.post('auth.login.api-key', '/auth/login/api-key', AuthController.loginApiKey);

// // Password.
// router.post('password-reset.email', '/password-reset/email', PasswordResetController.sendResetEmail);
// router.post('password-reset.test', '/password-reset/test', PasswordResetController.testToken);
// router.post('password-reset.reset', '/password-reset/reset', PasswordResetController.reset);

// // Support email.
// router.get('emails.show.support', '/emails/support', EmailController.showSupportEmail);

// // User invites.
// router.post('user-invite.test', '/user-invite/test', UserInviteController.testToken);
// router.post('user-invite.user', '/user-invite/user', UserInviteController.showUser);
// router.post('users.store.invite', '/users/invite', UserController.storeInvite);

// Auth group. Any routes in this group need to pass the "AuthMiddleware.auth" middleware.
router.group('auth', () => {
	// Auth.
	router.get('auth.logout', '/auth/logout', UserController.logout);

	// TODO: add user or invite token middleware
	// router.group(['user'], () => {
	// 	// User settings.
	// 	router.get('users.show.email', '/users/email', UserController.showEmail); // TODO: move to admin
	// 	router.get('users.show.username', '/users/username', UserController.showUsername); // TODO: move to user or invite token
	// 	router.post('users.show.password-strength', '/users/password-strength', UserController.checkPasswordStrength); // TODO: move to user or invite token
	// });

	// router.group('user', () => {
	// 	// User settings.
	// 	router.get('languages.index', '/languages', UserController.indexLanguages);
	// 	router.get('timezones.index', '/timezones', UserController.indexTimezones);
	// 	router.get('roles.index', '/roles', UserController.indexRoles);
	// 	router.get('users.show.me', '/users/me', UserController.showMe);
	// 	router.put('users.update.me', '/users/me', UserController.updateMe);
	// 	router.del('users.destroy.me', '/users/me', UserController.destroyMe);
	// });

	// router.group('admin', () => {
	// 	// API keys.
	// 	router.get('apiKeys.index', '/api-keys', ApiKeyController.index);
	// 	router.post('apiKeys.store', '/api-keys', ApiKeyController.store);
	// 	router.put('apiKeys.update', '/api-keys/:id(\\d+)', ApiKeyController.update);
	// 	router.del('apiKeys.destroy', '/api-keys/:id(\\d+)', ApiKeyController.destroy);

	// 	// Users.
	// 	router.get('users.index', '/users', UserController.index);
	// 	router.get('users.show', '/users/:id(\\d+)', UserController.show);
	// 	router.post('users.store', '/users', UserController.store);
	// 	router.put('users.update', '/users/:id(\\d+)', UserController.update);
	// 	router.del('users.destroy', '/users/:id(\\d+)', UserController.destroy);

	// 	// User invites.
	// 	router.post('user-invite.email', '/user-invite/email', UserInviteController.sendInviteEmail);

	// 	// Preview and send emails.
	// 	router.get('emails.show', '/emails', EmailController.show);
	// 	router.get('emails.show.confirmation', '/emails/confirmation', EmailController.showConfirmationEmail);
	// 	router.get('emails.show.verify', '/emails/verify', EmailController.showVerifyEmail);
	// 	router.get('emails.show.password-reset', '/emails/password-reset', EmailController.showPasswordResetEmail);
	// 	router.get('emails.show.password-reset-help', '/emails/password-reset-help', EmailController.showPasswordResetHelpEmail);
	// 	router.get('emails.show.invite', '/emails/invite', EmailController.showInvite);
	// 	router.get('emails.show.test', '/emails/test', EmailController.showTestEmail);
	// });

	// 	router.group('user', () => {
	// 		// API keys.
	// 		router.get('apiKeys.index', '/api-keys', ApiKeyController.index);
	// 		router.post('apiKeys.store', '/api-keys', ApiKeyController.store);
	// 		router.put('apiKeys.update', '/api-keys/:id(\\d+)', ApiKeyController.update);
	// 		router.del('apiKeys.destroy', '/api-keys/:id(\\d+)', ApiKeyController.destroy);

	// 		// Users.
	// 		router.get('users.show.me', '/users/me', UserController.showMe);
	// 		router.put('users.update.me', '/users/me', UserController.updateMe);
	// 		router.del('users.destroy.me', '/users/me', UserController.destroyMe);

	// 		router.group('admin', () => {
	// 			// Users.
	// 			router.get('roles.index', '/roles', UserController.indexRoles);
	// 			router.get('users.index', '/users', UserController.index);
	// 			router.get('users.show', '/users/:id(\\d+)', UserController.show);
	// 			router.get('users.show.email', '/users/email', UserController.showEmail);
	// 			router.post('users.store', '/users', UserController.store);
	// 			router.put('users.update', '/users/:id(\\d+)', UserController.update);
	// 			router.del('users.destroy', '/users/:id(\\d+)', UserController.destroy);

	// 			// Preview and send emails.
	// 			router.get('emails.show', '/emails', EmailController.show);
	// 			router.get('emails.show.test', '/emails/test', EmailController.showTestEmail);
	// 			router.get('emails.show.password.reset', '/emails/password-reset', EmailController.showPasswordResetEmail);
	// 			router.get('emails.show.password.reset.help', '/emails/password-reset-help', EmailController.showPasswordResetHelpEmail);
	// 		});
	// 	});

	// router.group('apiKey', () => {
	// 	// Agents.
	// 	// router.get('agents.show', '/agents', AgentController.show);
	// 	// router.post('agents.store', '/agents', AgentController.store);
	// 	// router.put('agents.update', '/agents', AgentController.update);
	// 	// router.del('agents.destroy', '/agents', AgentController.destroy);
	// });
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
