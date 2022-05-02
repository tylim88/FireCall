module.exports = {
	root: true,
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
		'plugin:import/errors',
		'plugin:import/warnings',
		'plugin:import/typescript',
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
	],
	parser: '@typescript-eslint/parser',
	ignorePatterns: [
		'/lib/**/*', // Ignore built files.
	],
	plugins: ['@typescript-eslint', 'import'],
	parserOptions: {
		project: ['tsconfig.json'],
	},
	rules: {
		'@typescript-eslint/switch-exhaustiveness-check': 'error',
		'@typescript-eslint/ban-ts-comment': 'off',
		'guard-for-in': 'off',
		'import/first': 'error',
		'import/no-unresolved': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'error',
		camelcase: 'off',
		'require-jsdoc': 'off',
	},
}
