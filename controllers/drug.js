'use strict';

const Drug = require('../models/drug');

/**
 * List drugs.
 */
 async function index(ctx, next) {
	let drugs = await Drug.canRead(ctx).get();
	drugs = drugs.toJSON();
	ctx.body = drugs;
}

/**
 * Get drug by id.
 *
 * @param {integer} id Drug id.
 */
async function show(ctx, next) {
	let id = parseInt(ctx.params.id);

	let drug = await Drug.where('id', id).canRead(ctx).first();
	ctx.assert(drug, 400, `Drug with id ${id} not found.`);
	drug = drug.toJSON();

	ctx.body = drug;
}

/**
 * Get drug by slug.
 *
 * @param {string} slug Drug slug.
 */
 async function showSlug(ctx, next) {
	let slug = ctx.params.slug;

	let drug = await Drug.where('slug', slug).canRead(ctx).first();
	ctx.assert(drug, 400, `Drug with slug "${slug}" not found.`);
	drug = drug.toJSON();

	ctx.body = drug;
}

module.exports = {
	index,
	show,
	showSlug,
};
