/**
 * Defines the core attribute types supported by the system.
 * Each type represents a different kind of value that can be stored and validated.
 *
 * @remarks
 * - STRING: Text values
 * - NUMBER: Numeric values
 * - BOOLEAN: True/false values
 * - DATE: Date/time values
 * - ENUM: Values from a predefined set
 * - ARRAY: List of values of a specific type
 *
 * @example
 * ```typescript
 * const definition = {
 *   type: AttributeType.STRING,
 *   validation: {
 *     required: true,
 *     pattern: '^[A-Z].*$'
 *   }
 * };
 * ```
 */
export const AttributeType = {
	STRING: 'string',
	NUMBER: 'number',
	BOOLEAN: 'boolean',
	DATE: 'date',
	ENUM: 'enum',
	ARRAY: 'array',
} as const;

export type AttributeTypeValue = (typeof AttributeType)[keyof typeof AttributeType];

/**
 * Defines the structure for attribute validation rules.
 * Combines type checking with additional validation constraints.
 *
 * @interface ValidationRule
 *
 * @property {AttributeTypeValue} type - The type of value to validate
 * @property {boolean} [required] - Whether the attribute is required
 * @property {number} [min] - Minimum value (for numbers) or length (for strings/arrays)
 * @property {number} [max] - Maximum value (for numbers) or length (for strings/arrays)
 * @property {string} [pattern] - Regular expression pattern for string validation
 * @property {readonly string[]} [enum] - Valid values for enum types
 * @property {AttributeTypeValue} [arrayType] - Type of elements in array
 * @property {Function} [custom] - Custom validation function
 *
 * @example
 * ```typescript
 * const numberRule: ValidationRule = {
 *   type: AttributeType.NUMBER,
 *   required: true,
 *   min: 0,
 *   max: 100
 * };
 *
 * const enumRule: ValidationRule = {
 *   type: AttributeType.ENUM,
 *   required: true,
 *   enum: ['draft', 'published', 'archived'] as const
 * };
 *
 * const arrayRule: ValidationRule = {
 *   type: AttributeType.ARRAY,
 *   arrayType: AttributeType.STRING,
 *   max: 5
 * };
 * ```
 */
export type ValidationRule = {
	type: AttributeTypeValue;
	required?: boolean;
	min?: number;
	max?: number;
	pattern?: string;
	enum?: readonly string[];
	arrayType?: AttributeTypeValue;
	/**
	 * Custom validation function that can access other attributes
	 * @param value - The value to validate
	 * @param attributes - Optional object containing all attributes being validated
	 * @returns boolean or Promise<boolean> indicating if validation passed
	 */
	custom?: (value: unknown, attributes?: Record<string, unknown>) => boolean | Promise<boolean>;
};

/**
 * Defines the complete structure of an attribute including metadata.
 * Used to define and document attributes in the system.
 *
 * @interface AttributeDefinition
 *
 * @property {string} name - Unique identifier for the attribute
 * @property {AttributeTypeValue} type - The attribute's data type
 * @property {string} description - Human-readable description
 * @property {ValidationRule} validation - Rules for validating values
 * @property {unknown} [defaultValue] - Default value if none provided
 *
 * @example
 * ```typescript
 * const priceAttribute: AttributeDefinition = {
 *   name: 'price',
 *   type: AttributeType.NUMBER,
 *   description: 'Product price in cents',
 *   validation: {
 *     type: AttributeType.NUMBER,
 *     required: true,
 *     min: 0
 *   },
 *   defaultValue: 0
 * };
 * ```
 */
export type AttributeDefinition = {
	name: string;
	type: AttributeTypeValue;
	description: string;
	validation: ValidationRule;
	defaultValue?: unknown;
};

/**
 * Registry type for storing and managing attribute definitions.
 * Provides a centralized store for attribute metadata.
 *
 * @typedef {Map<string, AttributeDefinition>} AttributeRegistry
 *
 * @example
 * ```typescript
 * const registry: AttributeRegistry = new Map();
 *
 * registry.set('price', {
 *   name: 'price',
 *   type: AttributeType.NUMBER,
 *   description: 'Product price',
 *   validation: { type: AttributeType.NUMBER, min: 0 }
 * });
 * ```
 */
export type AttributeRegistry = Map<string, AttributeDefinition>;

/**
 * Type-safe attribute value type that changes based on the attribute type.
 * Provides compile-time type checking for attribute values.
 *
 * @template T - The attribute type
 * @typedef {T extends AttributeType} AttributeValue
 *
 * @example
 * ```typescript
 * // String attribute
 * const name: AttributeValue<typeof AttributeType.STRING> = 'John';
 *
 * // Number attribute
 * const age: AttributeValue<typeof AttributeType.NUMBER> = 25;
 *
 * // Array attribute
 * const tags: AttributeValue<typeof AttributeType.ARRAY> = ['new', 'featured'];
 * ```
 */
export type AttributeValue<T extends AttributeTypeValue> = T extends typeof AttributeType.STRING
	? string
	: T extends typeof AttributeType.NUMBER
		? number
		: T extends typeof AttributeType.BOOLEAN
			? boolean
			: T extends typeof AttributeType.DATE
				? Date
				: T extends typeof AttributeType.ENUM
					? string
					: T extends typeof AttributeType.ARRAY
						? unknown[]
						: never;

/**
 * Container type for storing multiple dynamic attributes.
 * Includes a validation flag to track attribute validation status.
 *
 * @interface DynamicAttributes
 *
 * @property {boolean} __validated - Flag indicating if attributes are validated
 * @property {unknown} [key: string] - Dynamic attribute values
 *
 * @example
 * ```typescript
 * const attributes: DynamicAttributes = {
 *   name: 'Product A',
 *   price: 1999,
 *   inStock: true,
 *   __validated: true
 * };
 * ```
 */
export type DynamicAttributes = {
	[key: string]: unknown;
} & {
	readonly __validated: boolean;
};
