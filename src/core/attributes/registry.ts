import type { AttributeDefinition, AttributeRegistry } from './types';
import { validateAttribute } from './validator';

/**
 * Service class for managing and validating product attribute definitions.
 * Provides a centralized registry for attribute metadata and validation.
 *
 * @class ProductAttributeRegistry
 *
 * @remarks
 * This class handles:
 * - Registration of attribute definitions
 * - Attribute metadata storage
 * - Validation of attribute values
 * - Custom validation rules
 *
 * @example
 * ```typescript
 * const registry = new ProductAttributeRegistry();
 *
 * // Register an attribute
 * registry.registerAttribute({
 *   name: 'price',
 *   type: AttributeType.NUMBER,
 *   description: 'Product price in cents',
 *   validation: {
 *     type: AttributeType.NUMBER,
 *     required: true,
 *     min: 0
 *   }
 * });
 *
 * // Validate attributes
 * await registry.validateAttributes({
 *   price: 1999,
 *   name: 'Product A'
 * });
 * ```
 */
export class ProductAttributeRegistry {
	private registry: AttributeRegistry = new Map();

	/**
	 * Registers a new attribute definition in the registry.
	 * Throws if an attribute with the same name already exists.
	 *
	 * @param {AttributeDefinition} definition - The attribute definition to register
	 * @throws {Error} If attribute name is already registered
	 *
	 * @remarks
	 * - Attribute names must be unique
	 * - Definition includes metadata and validation rules
	 * - Once registered, attributes can be used for validation
	 *
	 * @example
	 * ```typescript
	 * registry.registerAttribute({
	 *   name: 'category',
	 *   type: AttributeType.ENUM,
	 *   description: 'Product category',
	 *   validation: {
	 *     type: AttributeType.ENUM,
	 *     required: true,
	 *     enum: ['electronics', 'clothing', 'books']
	 *   }
	 * });
	 * ```
	 */
	public registerAttribute(definition: AttributeDefinition): void {
		if (this.registry.has(definition.name)) {
			throw new Error(`Attribute "${definition.name}" is already registered`);
		}

		this.registry.set(definition.name, definition);
	}

	/**
	 * Retrieves an attribute definition by its name.
	 * Returns undefined if the attribute is not found.
	 *
	 * @param {string} name - Name of the attribute to retrieve
	 * @returns {AttributeDefinition | undefined} The attribute definition or undefined
	 *
	 * @example
	 * ```typescript
	 * const priceDef = registry.getAttribute('price');
	 * if (priceDef) {
	 *   console.log(`Price validation: ${JSON.stringify(priceDef.validation)}`);
	 * }
	 * ```
	 */
	public getAttribute(name: string): AttributeDefinition | undefined {
		return this.registry.get(name);
	}

	/**
	 * Removes an attribute definition from the registry.
	 * Returns true if the attribute was found and removed.
	 *
	 * @param {string} name - Name of the attribute to remove
	 * @returns {boolean} True if attribute was removed, false if not found
	 *
	 * @example
	 * ```typescript
	 * if (registry.removeAttribute('oldField')) {
	 *   console.log('Old field definition removed');
	 * }
	 * ```
	 */
	public removeAttribute(name: string): boolean {
		return this.registry.delete(name);
	}

	/**
	 * Returns an array of all registered attribute definitions.
	 * Useful for inspecting or iterating over all attributes.
	 *
	 * @returns {AttributeDefinition[]} Array of all attribute definitions
	 *
	 * @example
	 * ```typescript
	 * const allAttributes = registry.getAllAttributes();
	 * console.log(`Registered attributes: ${allAttributes.map(a => a.name).join(', ')}`);
	 * ```
	 */
	public getAllAttributes(): AttributeDefinition[] {
		return Array.from(this.registry.values());
	}

	/**
	 * Validates a set of attributes against their registered definitions.
	 * Performs both basic and custom validations in the correct order.
	 *
	 * @param {Record<string, unknown>} attributes - Object containing attribute values
	 * @throws {Error} If validation fails or unknown attributes are found
	 *
	 * @remarks
	 * Validation process:
	 * 1. Checks for required attributes
	 * 2. Validates known attributes
	 * 3. Rejects unknown attributes
	 * 4. Runs basic validations first
	 * 5. Runs custom validations last
	 *
	 * @example
	 * ```typescript
	 * try {
	 *   await registry.validateAttributes({
	 *     price: 1999,
	 *     category: 'electronics',
	 *     inStock: true
	 *   });
	 *   console.log('Attributes are valid');
	 * } catch (error) {
	 *   console.error('Validation failed:', error.message);
	 * }
	 * ```
	 */
	public async validateAttributes(attributes: Record<string, unknown>): Promise<void> {
		const basicValidationPromises: Promise<void>[] = [];
		const customValidationPromises: Promise<void>[] = [];

		// First pass: check for required attributes and unknown attributes
		for (const [name, definition] of this.registry.entries()) {
			if (definition.validation.required && !(name in attributes)) {
				throw new Error(`Missing required attribute: ${name}`);
			}

			// Add custom validations for all registered attributes
			if (definition.validation.custom) {
				const value = attributes[name];
				customValidationPromises.push(validateAttribute(name, value, definition, attributes));
			}
		}

		// Second pass: validate provided attributes
		for (const [name, value] of Object.entries(attributes)) {
			const definition = this.registry.get(name);
			if (!definition) {
				throw new Error(`Unknown attribute: ${name}`);
			}

			// Only add basic validations here
			if (!definition.validation.custom) {
				basicValidationPromises.push(validateAttribute(name, value, definition, attributes));
			}
		}

		// Wait for basic validations to complete first
		await Promise.all(basicValidationPromises);

		// Then run custom validations
		await Promise.all(customValidationPromises);
	}

	/**
	 * Removes all attribute definitions from the registry.
	 * Useful when resetting the registry or changing attribute schemas.
	 *
	 * @example
	 * ```typescript
	 * // Clear existing definitions
	 * registry.clear();
	 *
	 * // Register new definitions
	 * registry.registerAttribute(newDefinition);
	 * ```
	 */
	public clear(): void {
		this.registry.clear();
	}
}
