'use strict';

const isFinite = require('lodash/isFinite');
const Joi = require('../helpers/joi-ext');

/**
 * Run tool calculator.
 * Calculates the BMI.
 *
 * @param {string} id Tool id. Only valid tool id is "BMI".
 * @param {number} height Height in centimeters. Min value is 1. Max value is 500.
 * @param {number} weight Weight in kilograms. Min value is 1. Max value is 500.
 */
 async function calc(ctx, next) {
	let id = String(ctx.params.id).toLowerCase();
	if (id !== 'bmi') {
		ctx.throw(400, 'Only valid tool id is "BMI".');
	}
	let body = Joi.attempt(ctx.request.body, Joi.object().keys({
		height: Joi.number().min(1).max(500),
		weight: Joi.number().min(1).max(500),
	}));

	let weight = body.weight;
	let height = body.height / 100;
	let bmi = (weight / height) / height;

	ctx.body = {
		height: body.height,
		weight: body.weight,
		bmi: bmi,
	};
}

module.exports = {
	calc,
};
