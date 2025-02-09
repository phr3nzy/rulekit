import { describe, it, expect, beforeEach } from 'vitest';
import { ProductAttributeRegistry } from './registry';
import { AttributeType } from './types';
import { AttributeValidationError } from './validator';

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

		it('should handle custom validation returning Promise.resolve(false)', async () => {
			// Register an attribute with custom validation that returns Promise.resolve(false)
			registry.registerAttribute({
				name: 'customAttr',
				type: AttributeType.STRING,
				description: 'Custom validation',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: () => Promise.resolve(false),
				},
			});

			try {
				await registry.validateAttributes({
					customAttr: 'test',
				});
				// Should not reach here
				expect(true).toBe(false);
			} catch (error: unknown) {
				if (error instanceof AttributeValidationError) {
					expect(error).toBeInstanceOf(AttributeValidationError);
					expect(error.attributeName).toBe('customAttr');
					expect(error.message).toContain('Custom validation failed');
				} else {
					throw error;
				}
			}
		});

		it('should handle failing custom validations in parallel', async () => {
			// Register two attributes with custom validations that will fail
			registry.registerAttribute({
				name: 'customOne',
				type: AttributeType.STRING,
				description: 'First custom validation',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: () => Promise.reject(new Error('First validation failed')),
				},
			});

			registry.registerAttribute({
				name: 'customTwo',
				type: AttributeType.STRING,
				description: 'Second custom validation',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: () => Promise.reject(new Error('Second validation failed')),
				},
			});

			// Both custom validations should fail
			await expect(
				registry.validateAttributes({
					customOne: 'test',
					customTwo: 'test',
				}),
			).rejects.toThrow('First validation failed');
		});

		it('should handle missing optional attributes with custom validation', async () => {
			// Register an attribute with custom validation but not required
			registry.registerAttribute({
				name: 'optionalCustomAttr',
				type: AttributeType.STRING,
				description: 'Optional custom validation',
				validation: {
					type: AttributeType.STRING,
					required: false,
					custom: () => Promise.resolve(true),
				},
			});

			registry.registerAttribute({
				name: 'otherAttr',
				type: AttributeType.STRING,
				description: 'Other attribute',
				validation: {
					type: AttributeType.STRING,
					required: false,
				},
			});

			// Should pass because optionalCustomAttr is optional
			await expect(
				registry.validateAttributes({
					otherAttr: 'test',
				}),
			).resolves.toBeUndefined();
		});

		it('should skip custom validation for optional attributes not provided', async () => {
			// Register an attribute with custom validation but not required
			registry.registerAttribute({
				name: 'optionalCustomAttr',
				type: AttributeType.STRING,
				description: 'Optional custom validation',
				validation: {
					type: AttributeType.STRING,
					required: false,
					custom: () => Promise.reject(new Error('Should not be called')),
				},
			});

			// Register another optional attribute without custom validation
			registry.registerAttribute({
				name: 'otherAttr',
				type: AttributeType.STRING,
				description: 'Other attribute',
				validation: {
					type: AttributeType.STRING,
					required: false,
				},
			});

			// Should pass because optionalCustomAttr is optional and not provided
			await expect(
				registry.validateAttributes({
					otherAttr: 'test',
				}),
			).resolves.toBeUndefined();
		});

		it('should handle parallel basic and custom validations with basic failing first', async () => {
			// Register multiple attributes with both basic and custom validations
			registry.registerAttribute({
				name: 'basicAttr',
				type: AttributeType.NUMBER,
				description: 'Basic validation',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 100,
					custom: (value: unknown) => {
						// Custom validation would pass but basic validation fails
						// Still use value to avoid ESLint errors
						return new Promise(resolve => {
							// Delay custom validation to ensure basic validation fails first
							setTimeout(() => resolve(typeof value === 'number'), 100);
						});
					},
				},
			});

			registry.registerAttribute({
				name: 'customAttr',
				type: AttributeType.NUMBER,
				description: 'Custom validation',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 100,
					custom: (value: unknown) => {
						// Custom validation would pass but basic validation fails
						// Still use value to avoid ESLint errors
						return new Promise(resolve => {
							// Delay custom validation to ensure basic validation fails first
							setTimeout(() => resolve(typeof value === 'number'), 100);
						});
					},
				},
			});

			// Basic validation should fail before custom validation runs
			// This triggers both basic and custom validation paths in parallel
			await expect(
				registry.validateAttributes({
					basicAttr: 150, // Fails basic validation (max: 100)
					customAttr: 200, // Fails basic validation (max: 100)
				}),
			).rejects.toThrow('Value must be at most 100');
		});

		it('should handle basic validation failures for attributes without custom validation in parallel', async () => {
			// Register multiple attributes with only basic validation
			registry.registerAttribute({
				name: 'basicOne',
				type: AttributeType.NUMBER,
				description: 'Basic validation one',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 100,
				},
			});

			registry.registerAttribute({
				name: 'basicTwo',
				type: AttributeType.NUMBER,
				description: 'Basic validation two',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 100,
				},
			});

			// Both basic validations should fail in parallel
			await expect(
				registry.validateAttributes({
					basicOne: 150,
					basicTwo: 200,
				}),
			).rejects.toThrow('Value must be at most 100');

			// Both basic validations should pass in parallel
			await expect(
				registry.validateAttributes({
					basicOne: 50,
					basicTwo: 75,
				}),
			).resolves.toBeUndefined();
		});

		it('should handle single basic validation failure without custom validation', async () => {
			// Register an attribute with only basic validation
			registry.registerAttribute({
				name: 'basicAttr',
				type: AttributeType.NUMBER,
				description: 'Basic validation',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					max: 100,
				},
			});

			// Basic validation should fail
			await expect(
				registry.validateAttributes({
					basicAttr: -1,
				}),
			).rejects.toThrow('Value must be at least 0');

			// Basic validation should pass
			await expect(
				registry.validateAttributes({
					basicAttr: 50,
				}),
			).resolves.toBeUndefined();
		});

		it('should handle mixed basic and custom validation failures', async () => {
			// Register an attribute with basic validation
			registry.registerAttribute({
				name: 'basicAttr',
				type: AttributeType.NUMBER,
				description: 'Basic validation',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
				},
			});

			// Register an attribute with custom validation that will fail
			registry.registerAttribute({
				name: 'customAttr',
				type: AttributeType.STRING,
				description: 'Custom validation',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: () => Promise.reject(new Error('Custom validation failed')),
				},
			});

			// Both validations should fail
			await expect(
				registry.validateAttributes({
					basicAttr: -1, // Fails basic validation
					customAttr: 'test', // Fails custom validation
				}),
			).rejects.toThrow();
		});

		it('should handle missing required attributes with custom validation', async () => {
			// Register an attribute with custom validation and required flag
			registry.registerAttribute({
				name: 'requiredCustomAttr',
				type: AttributeType.STRING,
				description: 'Required custom validation',
				validation: {
					type: AttributeType.STRING,
					required: true,
					custom: () => Promise.resolve(true),
				},
			});

			// Should fail because required attribute is missing
			await expect(
				registry.validateAttributes({
					otherAttr: 'test',
				}),
			).rejects.toThrow('Missing required attribute: requiredCustomAttr');
		});

		it('should handle attribute with both basic and custom validation where only custom fails', async () => {
			// Register an attribute with both basic and custom validation
			registry.registerAttribute({
				name: 'mixedAttr',
				type: AttributeType.NUMBER,
				description: 'Mixed validation',
				validation: {
					type: AttributeType.NUMBER,
					required: true,
					min: 0,
					custom: (value: unknown) => {
						// Basic validation will pass (value > 0)
						// but custom validation will fail (value must be even)
						return Promise.resolve(typeof value === 'number' && value % 2 === 0);
					},
				},
			});

			// Basic validation passes (5 > 0) but custom fails (5 is not even)
			await expect(
				registry.validateAttributes({
					mixedAttr: 5,
				}),
			).rejects.toThrow('Custom validation failed');

			// Both basic and custom validation pass
			await expect(
				registry.validateAttributes({
					mixedAttr: 6,
				}),
			).resolves.toBeUndefined();
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
