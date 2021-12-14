'use strict';

// NOTES:
// - Good Nginx reverse proxy setup tutorial: https://linuxize.com/post/nginx-reverse-proxy/
// - Use the Koa.js "proxy" flag to support reverse proxy headers.

async function middleware(ctx, next) {
	let serverBaseUrl = ctx.origin;
	let clientBaseUrl = ctx.origin;

	ctx.getServerBaseUrl = () => {
		return serverBaseUrl;
	};

	ctx.getClientBaseUrl = () => {
		return clientBaseUrl;
	};

	await next();
}

module.exports = middleware;
