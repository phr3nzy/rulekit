import js from '@eslint/js';
import typescript from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

const parserOptions = {
	project: './tsconfig.json',
	ecmaVersion: 'latest',
	sourceType: 'module',
};

const typescriptPluginConfig = {
	plugins: {
		'@typescript-eslint': typescript,
	},
};

/** @type {Array<import('eslint').Linter.FlatConfig>} */
export default [
	// Base JS config with globals
	{
		files: ['**/*.{js,ts}'],
		...js.configs.recommended,
		languageOptions: {
			globals: {
				...globals.node,
				...globals.browser,
			},
		},
	},

	// TypeScript config for source files
	{
		files: ['**/*.ts'],
		ignores: ['**/*.test.ts', '**/*.bench.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions,
		},
		...typescriptPluginConfig,
		rules: {
			// TypeScript specific rules
			'@typescript-eslint/explicit-function-return-type': 'off',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'warn',

			// Enable recommended TypeScript rules
			...typescript.configs['recommended'].rules,
		},
	},

	// TypeScript config for test files with relaxed rules
	{
		files: ['**/*.test.ts', '**/*.bench.ts'],
		languageOptions: {
			parser: typescriptParser,
			parserOptions,
		},
		...typescriptPluginConfig,
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
			'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
		},
	},

	// Prettier config (must be last to properly override other formatting rules)
	prettier,
]; 