const { check } = require('express-validator');

function eventValidator(route) {
	switch (route) {
		case '/':
			return [
				check(
					'id',
					'id must be a hexadecimal string of 24 characters'
				).isLength({ min: 24, max: 24 }),
			];

		case '/create':
			return [
				check('username', 'Username must be a string').isString(),
				check(
					'password',
					'Password must contain at least 4 characters'
				).isLength({ min: 4 }),
			];

		case '/edit':
			return [
				check('username', 'Username must be a string').isString(),
				check(
					'password',
					'Password must contain at least 4 characters'
				).isLength({ min: 4 }),
			];

		case '/delete':
			return [
				check(
					'id',
					'id must be a hexadecimal string of 24 characters'
				).isLength({ min: 24, max: 24 }),
			];
	}
}

module.exports = eventValidator;
