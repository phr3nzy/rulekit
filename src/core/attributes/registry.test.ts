import { describe, it, expect, beforeEach } from 'vitest';
import { ProductAttributeRegistry } from './registry';
import { AttributeType } from './types';

describe('ProductAttributeRegistry', () => {
	let registry: ProductAttributeRegistry;

	beforeEach(() => {
		registry = new ProductAttributeRegistry();
	});

	it('should register and retrieve attributes', () => {
		const colorAttribute = {
			name: 'color',
			type: AttributeType.STRING,
			description: 'Product color',
			validation: {
				type: AttributeType.STRING,
				required: true,
				pattern: '^[a-zA-Z]+$',
			},
		};

		registry.registerAttribute(colorAttribute);
		const retrieved = registry.getAttribute('color');

		expect(retrieved).toEqual(colorAttribute);
	});

	it('should prevent duplicate attribute registration', () => {
		const attribute = {
			name: 'size',
			type: AttributeType.STRING,
			description: 'Product size',
			validation: {
				type: AttributeType.STRING,
				required: true,
			},
		};

		registry.registerAttribute(attribute);
		expect(() => registry.registerAttribute(attribute)).toThrow();
	});

	it('should validate attributes correctly', async () => {
		registry.registerAttribute({
			name: 'weight',
			type: AttributeType.NUMBER,
			description: 'Product weight in kg',
			validation: {
				type: AttributeType.NUMBER,
				required: true,
				min: 0,
				max: 100,
			},
		});

		// Valid attributes
		await expect(
			registry.validateAttributes({
				weight: 50,
			}),
		).resolves.toBeUndefined();

		// Invalid attributes
		await expect(
			registry.validateAttributes({
				weight: -1,
			}),
		).rejects.toThrow();

		await expect(
			registry.validateAttributes({
				weight: 'not a number',
			}),
		).rejects.toThrow();

		await expect(
			registry.validateAttributes({
				unknown: 'value',
			}),
		).rejects.toThrow();
	});

	it('should handle complex validation rules', async () => {
		registry.registerAttribute({
			name: 'tags',
			type: AttributeType.ARRAY,
			description: 'Product tags',
			validation: {
				type: AttributeType.ARRAY,
				required: true,
				min: 1,
				max: 5,
				arrayType: AttributeType.STRING,
			},
		});

		// Valid array
		await expect(
			registry.validateAttributes({
				tags: ['electronics', 'gadget'],
			}),
		).resolves.toBeUndefined();

		// Invalid array (too many items)
		await expect(
			registry.validateAttributes({
				tags: ['1', '2', '3', '4', '5', '6'],
			}),
		).rejects.toThrow();

		// Invalid array (wrong type)
		await expect(
			registry.validateAttributes({
				tags: [1, 2, 3],
			}),
		).rejects.toThrow();
	});

	it('should handle custom validation functions', async () => {
		registry.registerAttribute({
			name: 'sku',
			type: AttributeType.STRING,
			description: 'Product SKU',
			validation: {
				type: AttributeType.STRING,
				required: true,
				custom: value => {
					if (typeof value !== 'string') return false;
					return /^[A-Z]{2}-\d{6}$/.test(value);
				},
			},
		});

		// Valid SKU
		await expect(
			registry.validateAttributes({
				sku: 'AB-123456',
			}),
		).resolves.toBeUndefined();

		// Invalid SKU format
		await expect(
			registry.validateAttributes({
				sku: 'invalid',
			}),
		).rejects.toThrow();
	});

	describe('validation with basic and custom rules', () => {
		it('should handle both basic and custom validations', async () => {
			// Register premium attribute
			registry.registerAttribute({
				name: 'premium',
				type: AttributeType.BOOLEAN,
				description: 'Whether the product is premium',
				validation: {
					type: AttributeType.BOOLEAN,
					required: true,
				},
			});

			// Register price attribute with both basic and custom validations
			registry.registerAttribute({
				name: 'price',
				type: AttributeType.NUMBER,
				description: 'Product price',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 1000,
					custom: (value: unknown, attributes?: Record<string, unknown>) => {
						// Custom validation: if product is premium, price must be at least 100
						if (attributes?.premium && typeof value === 'number') {
							return value >= 100;
						}
						return true;
					},
				},
			});

			// Valid price with basic validation
			await expect(
				registry.validateAttributes({
					price: 50,
					premium: false,
				}),
			).resolves.toBeUndefined();

			// Valid price with both basic and custom validation
			await expect(
				registry.validateAttributes({
					price: 150,
					premium: true,
				}),
			).resolves.toBeUndefined();

			// Invalid price (fails basic validation)
			await expect(
				registry.validateAttributes({
					price: -1,
					premium: false,
				}),
			).rejects.toThrow();

			// Invalid price (fails custom validation)
			await expect(
				registry.validateAttributes({
					price: 50,
					premium: true,
				}),
			).rejects.toThrow();
		});

		it('should handle attributes with both basic and custom validations in parallel', async () => {
			// Register two attributes with both basic and custom validations
			registry.registerAttribute({
				name: 'price',
				type: AttributeType.NUMBER,
				description: 'Product price',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					custom: (value: unknown) => typeof value === 'number' && value > 0,
				},
			});

			registry.registerAttribute({
				name: 'quantity',
				type: AttributeType.NUMBER,
				description: 'Product quantity',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					custom: (value: unknown) => typeof value === 'number' && value > 0,
				},
			});

			// Both validations should run in parallel
			await expect(
				registry.validateAttributes({
					price: 100,
					quantity: 5,
				}),
			).resolves.toBeUndefined();

			// Both validations should fail in parallel
			await expect(
				registry.validateAttributes({
					price: -1,
					quantity: -1,
				}),
			).rejects.toThrow();
		});

		it('should handle attributes with only custom validation', async () => {
			// Register an attribute with only custom validation
			registry.registerAttribute({
				name: 'customOnly',
				type: AttributeType.STRING,
				description: 'Custom validation only',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: (value: unknown) => {
						if (typeof value !== 'string') return false;
						// Custom validation: value must be a palindrome
						const normalized = value.toLowerCase().replace(/[^a-z0-9]/g, '');
						return normalized === normalized.split('').reverse().join('');
					},
				},
			});

			// Valid palindrome
			await expect(
				registry.validateAttributes({
					customOnly: 'A man a plan a canal Panama',
				}),
			).resolves.toBeUndefined();

			// Invalid palindrome
			await expect(
				registry.validateAttributes({
					customOnly: 'not a palindrome',
				}),
			).rejects.toThrow();

			// Invalid type
			await expect(
				registry.validateAttributes({
					customOnly: 123,
				}),
			).rejects.toThrow();
		});
	});

	it('should remove attributes correctly', () => {
		const attribute = {
			name: 'removable',
			type: AttributeType.BOOLEAN,
			description: 'Test attribute',
			validation: {
				type: AttributeType.BOOLEAN,
			},
		};

		registry.registerAttribute(attribute);
		expect(registry.removeAttribute('removable')).toBe(true);
		expect(registry.getAttribute('removable')).toBeUndefined();
		expect(registry.removeAttribute('nonexistent')).toBe(false);
	});

	it('should clear all attributes', () => {
		registry.registerAttribute({
			name: 'test1',
			type: AttributeType.STRING,
			description: 'Test 1',
			validation: {
				type: AttributeType.STRING,
			},
		});

		registry.registerAttribute({
			name: 'test2',
			type: AttributeType.NUMBER,
			description: 'Test 2',
			validation: {
				type: AttributeType.NUMBER,
			},
		});

		expect(registry.getAllAttributes()).toHaveLength(2);
		registry.clear();
		expect(registry.getAllAttributes()).toHaveLength(0);
	});
});
