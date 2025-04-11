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
