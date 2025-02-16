import { describe, it, expect, beforeEach } from 'vitest';
import { ProductAttributeRegistry } from '../attributes/registry';
import { AttributeType } from '../attributes/types';
import type { Entity } from './types';

// Alias Entity as Product for better semantic meaning in tests
type Product = Entity;

describe('Product with Dynamic Attributes', () => {
	let registry: ProductAttributeRegistry;

	beforeEach(() => {
		registry = new ProductAttributeRegistry();
	});

	it('should create a product with valid dynamic attributes', async () => {
		// Register some attributes
		registry.registerAttribute({
			name: 'price',
			type: AttributeType.NUMBER,
			description: 'Product price',
			validation: {
				type: AttributeType.NUMBER,
				required: true,
				min: 0,
			},
		});

		registry.registerAttribute({
			name: 'category',
			type: AttributeType.STRING,
			description: 'Product category',
			validation: {
				type: AttributeType.STRING,
				required: true,
			},
		});

		registry.registerAttribute({
			name: 'brand',
			type: AttributeType.STRING,
			description: 'Product brand',
			validation: {
				type: AttributeType.STRING,
				required: true,
			},
		});

		// Create a product with valid attributes
		const validProduct: Product = {
			id: '1',
			name: 'Test Product',
			attributes: {
				price: 99.99,
				category: 'Electronics',
				brand: 'TestBrand',
				__validated: true,
			},
		};

		// Validate the attributes
		await registry.validateAttributes({
			price: validProduct.attributes.price,
			category: validProduct.attributes.category,
			brand: validProduct.attributes.brand,
		});

		// If we get here, validation passed
		expect(validProduct.attributes.price).toBe(99.99);
		expect(validProduct.attributes.category).toBe('Electronics');
		expect(validProduct.attributes.brand).toBe('TestBrand');
	});

	it('should handle complex attribute types', async () => {
		// Register a complex attribute with multiple types
		registry.registerAttribute({
			name: 'specifications',
			type: AttributeType.ARRAY,
			description: 'Product specifications',
			validation: {
				type: AttributeType.ARRAY,
				required: true,
				min: 1,
				max: 5,
				arrayType: AttributeType.STRING,
			},
		});

		registry.registerAttribute({
			name: 'size',
			type: AttributeType.ENUM,
			description: 'Product size',
			validation: {
				type: AttributeType.ENUM,
				required: true,
				enum: ['S', 'M', 'L', 'XL'] as const,
			},
		});

		// Create a product with complex attributes
		const product: Product = {
			id: '2',
			name: 'Complex Product',
			attributes: {
				specifications: ['Cotton', 'Machine Washable', 'Imported'],
				size: 'L',
				__validated: true,
			},
		};

		// Validate the attributes
		await registry.validateAttributes({
			specifications: product.attributes.specifications,
			size: product.attributes.size,
		});

		expect(product.attributes.specifications).toHaveLength(3);
		expect(product.attributes.size).toBe('L');
	});

	it('should reject invalid attribute values', async () => {
		registry.registerAttribute({
			name: 'inStock',
			type: AttributeType.BOOLEAN,
			description: 'Product stock status',
			validation: {
				type: AttributeType.BOOLEAN,
				required: true,
			},
		});

		const invalidProduct: Product = {
			id: '3',
			name: 'Invalid Product',
			attributes: {
				inStock: 'yes', // Invalid type: should be boolean
				__validated: false,
			},
		};

		// Validation should fail
		await expect(
			registry.validateAttributes({
				inStock: invalidProduct.attributes.inStock,
			}),
		).rejects.toThrow();
	});

	it('should handle optional attributes', async () => {
		registry.registerAttribute({
			name: 'releaseDate',
			type: AttributeType.DATE,
			description: 'Product release date',
			validation: {
				type: AttributeType.DATE,
				required: false,
			},
		});

		// Product without optional attribute is valid
		expect({
			id: '4',
			name: 'Optional Product',
			attributes: {
				__validated: true,
			},
		} satisfies Product).toBeDefined();

		// Product with optional attribute
		const productWithDate: Product = {
			id: '5',
			name: 'Optional Product with Date',
			attributes: {
				releaseDate: new Date('2024-01-01'),
				__validated: true,
			},
		};

		// Should also pass validation
		await registry.validateAttributes({
			releaseDate: productWithDate.attributes.releaseDate,
		});

		expect(productWithDate.attributes.releaseDate).toBeInstanceOf(Date);
	});

	it('should handle multiple attributes with dependencies', async () => {
		// Register attributes with dependencies
		registry.registerAttribute({
			name: 'hasWarranty',
			type: AttributeType.BOOLEAN,
			description: 'Product has warranty',
			validation: {
				type: AttributeType.BOOLEAN,
				required: true,
			},
		});

		registry.registerAttribute({
			name: 'warrantyPeriod',
			type: AttributeType.NUMBER,
			description: 'Warranty period in months',
			validation: {
				type: AttributeType.NUMBER,
				required: false,
				min: 1,
				max: 60,
				custom: async (value, attributes) => {
					const hasWarranty = attributes?.hasWarranty;
					if (hasWarranty === true && (value === undefined || value === null)) {
						throw new Error('Warranty period is required when warranty is enabled');
					}
					if (hasWarranty === false && value !== undefined && value !== null) {
						throw new Error('Warranty period should not be set when warranty is disabled');
					}
					return true;
				},
			},
		});

		// Valid product with warranty
		const productWithWarranty: Product = {
			id: '6',
			name: 'Warranty Product',
			attributes: {
				hasWarranty: true,
				warrantyPeriod: 24,
				__validated: true,
			},
		};

		// Should pass validation
		await registry.validateAttributes({
			hasWarranty: productWithWarranty.attributes.hasWarranty,
			warrantyPeriod: productWithWarranty.attributes.warrantyPeriod,
		});

		// Valid product without warranty
		const productWithoutWarranty: Product = {
			id: '7',
			name: 'No Warranty Product',
			attributes: {
				hasWarranty: false,
				__validated: true,
			},
		};

		// Should pass validation
		await registry.validateAttributes({
			hasWarranty: productWithoutWarranty.attributes.hasWarranty,
		});

		// Invalid product with warranty but no period
		const invalidProduct: Product = {
			id: '8',
			name: 'Invalid Warranty Product',
			attributes: {
				hasWarranty: true,
				__validated: false,
			},
		};

		// Should fail validation
		await expect(
			registry.validateAttributes({
				hasWarranty: invalidProduct.attributes.hasWarranty,
			}),
		).rejects.toThrow('Warranty period is required when warranty is enabled');
	});
});
