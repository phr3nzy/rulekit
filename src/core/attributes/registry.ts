import type { AttributeDefinition, AttributeRegistry } from './types';
import { validateAttribute } from './validator';

/**
 * Service for managing product attribute definitions
 */
export class ProductAttributeRegistry {
	private registry: AttributeRegistry = new Map();

	/**
	 * Register a new attribute definition
	 */
	public registerAttribute(definition: AttributeDefinition): void {
		if (this.registry.has(definition.name)) {
			throw new Error(`Attribute "${definition.name}" is already registered`);
		}

		this.registry.set(definition.name, definition);
	}

	/**
	 * Get an attribute definition by name
	 */
	public getAttribute(name: string): AttributeDefinition | undefined {
		return this.registry.get(name);
	}

	/**
	 * Remove an attribute definition
	 */
	public removeAttribute(name: string): boolean {
		return this.registry.delete(name);
	}

	/**
	 * Get all registered attribute definitions
	 */
	public getAllAttributes(): AttributeDefinition[] {
		return Array.from(this.registry.values());
	}

	/**
	 * Validate attributes against their definitions
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
	 * Clear all registered attributes
	 */
	public clear(): void {
		this.registry.clear();
	}
}
