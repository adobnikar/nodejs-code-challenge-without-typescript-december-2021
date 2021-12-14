'use strict';

const zxcvbn = require('zxcvbn');

function getPasswordStrength(password, allData = false, userInputs = []) {
	let strength = zxcvbn(password, userInputs);
	if (allData) return strength;
	else return { score: strength.score };
}

function checkPasswordStrength(ctx, password, userInputs = []) {
	let strength = getPasswordStrength(password, false, userInputs);
	if (strength.score < 2) ctx.throw(400, 'The password is too weak.');
}

module.exports = {
	getPasswordStrength,
	checkPasswordStrength,
};
