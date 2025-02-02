/**
 * Base attribute types supported by the system
 */
export const AttributeType = {
	STRING: 'string',
	NUMBER: 'number',
	BOOLEAN: 'boolean',
	DATE: 'date',
	ENUM: 'enum',
	ARRAY: 'array',
} as const;

export type AttributeType = (typeof AttributeType)[keyof typeof AttributeType];

/**
 * Base validation rules for attributes
 */
export type ValidationRule = {
	type: AttributeType;
	required?: boolean;
	min?: number;
	max?: number;
	pattern?: string;
	enum?: readonly string[];
	arrayType?: AttributeType;
	/**
	 * Custom validation function that can access other attributes
	 * @param value - The value to validate
	 * @param attributes - Optional object containing all attributes being validated
	 * @returns boolean or Promise<boolean> indicating if validation passed
	 */
	custom?: (value: unknown, attributes?: Record<string, unknown>) => boolean | Promise<boolean>;
};

/**
 * Attribute definition with metadata
 */
export type AttributeDefinition = {
	name: string;
	type: AttributeType;
	description: string;
	validation: ValidationRule;
	defaultValue?: unknown;
};

/**
 * Registry for storing attribute definitions
 */
export type AttributeRegistry = Map<string, AttributeDefinition>;

/**
 * Type-safe attribute value based on its type
 */
export type AttributeValue<T extends AttributeType> = T extends typeof AttributeType.STRING
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
 * Dynamic attributes container with type safety
 */
export type DynamicAttributes = {
	[key: string]: unknown;
} & {
	readonly __validated: boolean;
};
