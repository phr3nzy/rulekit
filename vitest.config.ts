import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json-summary', 'json', 'lcov'],
			include: ['src/**/*.ts'],
			exclude: [
				'**/*.test.ts',
				'**/*.bench.ts',
				'**/*.d.ts',
				'dist/**',
				'coverage/**',
				'**/*.config.*',
			],
			all: true,
			clean: true,
			thresholds: {
				statements: 90,
				branches: 90,
				functions: 90,
				lines: 90,
			},
		},
	},
});
