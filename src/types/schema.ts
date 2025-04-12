/**
 * @file Core type definitions for RuleKit v3
 * Provides type-safe schema definitions and utilities
 */

import { AttributeType } from '../attributes/types';
import type { AttributeTypeValue } from '../attributes/types';

/**
 * Type-level utility to extract the actual value type from an attribute type
 */
export type ExtractAttributeValue<
	T extends AttributeTypeValue,
	TArrayType extends AttributeTypeValue | undefined = undefined,
> = T extends typeof AttributeType.STRING
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
						? TArrayType extends AttributeTypeValue
							? Array<ExtractAttributeValue<TArrayType>>
							: unknown[]
						: never;

/**
 * Validation rule with improved type safety
 */
export type ValidationRule<T extends AttributeTypeValue> = {
	type: T;
	required?: boolean;
	min?: T extends typeof AttributeType.NUMBER
		? number
		: T extends typeof AttributeType.STRING | typeof AttributeType.ARRAY
			? number
			: never;
	max?: T extends typeof AttributeType.NUMBER
		? number
		: T extends typeof AttributeType.STRING | typeof AttributeType.ARRAY
			? number
			: never;
	pattern?: T extends typeof AttributeType.STRING ? string : never;
	enum?: T extends typeof AttributeType.ENUM ? readonly string[] : never;
	arrayType?: T extends typeof AttributeType.ARRAY ? AttributeTypeValue : never;
	custom?: (
		value: ExtractAttributeValue<T>,
		attributes?: Record<string, unknown>,
	) => boolean | Promise<boolean>;
};

/**
 * Type-safe attribute schema definition
 */
export interface AttributeSchema {
	[key: string]: {
		type: AttributeTypeValue;
		validation: ValidationRule<AttributeTypeValue>;
	};
}

/**
 * Utility type to extract the actual value type from a schema field
 */
export type ExtractSchemaValue<
	T extends { type: AttributeTypeValue; validation: ValidationRule<AttributeTypeValue> },
> = ExtractAttributeValue<
	T['type'],
	T['type'] extends typeof AttributeType.ARRAY ? T['validation']['arrayType'] : undefined
>;

/**
 * Type-safe attributes object derived from schema
 */
export type Attributes<TSchema extends AttributeSchema> = {
	[K in keyof TSchema]: ExtractSchemaValue<TSchema[K]>;
} & { readonly __validated: boolean };

/**
 * Type-safe entity with generic schema
 */
export type Entity<TSchema extends AttributeSchema> = {
	id: string;
	name: string;
	attributes: Attributes<TSchema>;
};

/**
 * Available comparison operators with type safety
 */
export const ComparisonOperators = {
	eq: 'eq',
	ne: 'ne',
	gt: 'gt',
	gte: 'gte',
	lt: 'lt',
	lte: 'lte',
	in: 'in',
	notIn: 'notIn',
} as const;

export type ComparisonOperator = keyof typeof ComparisonOperators;

/**
 * Type-safe filter based on attribute type
 */

// Helper type for numeric operators
type NumericFilterValue<T extends AttributeTypeValue> = T extends typeof AttributeType.NUMBER
	? number
	: never;

// Helper type for equality operators (can apply to most primitive types)
type EqualityFilterValue<
	T extends AttributeTypeValue,
	TArrayType extends AttributeTypeValue | undefined,
> = T extends typeof AttributeType.ARRAY
	? TArrayType extends AttributeTypeValue
		? Array<ExtractAttributeValue<TArrayType>>
		: unknown[]
	: ExtractAttributeValue<T>;

// Helper type for array operators
type ArrayFilterValue<
	T extends AttributeTypeValue,
	TArrayType extends AttributeTypeValue | undefined,
> = T extends typeof AttributeType.ARRAY
	? TArrayType extends AttributeTypeValue
		? Array<ExtractAttributeValue<TArrayType>> // If attribute is array, expect array of element type
		: unknown[]
	: Array<ExtractAttributeValue<T>>; // If attribute is not array, expect array of attribute type

export type Filter<
	T extends AttributeTypeValue,
	TArrayType extends AttributeTypeValue | undefined = undefined,
> = {
	eq?: EqualityFilterValue<T, TArrayType>;
	ne?: EqualityFilterValue<T, TArrayType>;
	gt?: NumericFilterValue<T>;
	gte?: NumericFilterValue<T>;
	lt?: NumericFilterValue<T>;
	lte?: NumericFilterValue<T>;
	in?: ArrayFilterValue<T, TArrayType>;
	notIn?: ArrayFilterValue<T, TArrayType>;
};

/**
 * Type-safe rule with generic schema
 */
export type Rule<TSchema extends AttributeSchema> = {
	and?: Array<Rule<TSchema>>;
	or?: Array<Rule<TSchema>>;
	attributes?: {
		[K in keyof TSchema]?: Filter<
			TSchema[K]['type'],
			TSchema[K]['type'] extends typeof AttributeType.ARRAY
				? TSchema[K]['validation']['arrayType']
				: undefined
		>;
	};
};

/**
 * Type-safe rule set with generic schema
 */
export type RuleSet<TSchema extends AttributeSchema> = {
	fromRules: Rule<TSchema>[];
	toRules: Rule<TSchema>[];
};

/**
 * Type-safe matching configuration with generic schema
 */
export type MatchingConfig<TSchema extends AttributeSchema> = {
	id: string;
	name: string;
	description?: string;
	ruleSet: RuleSet<TSchema>;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

/**
 * Type guard to check if a value matches an attribute type
 */
export function isValidAttributeValue<T extends AttributeTypeValue>(
	value: unknown,
	type: T,
	arrayType?: AttributeTypeValue,
): value is ExtractAttributeValue<T> {
	if (value === null || value === undefined) return false;

	switch (type) {
		case AttributeType.STRING:
			return typeof value === 'string';
		case AttributeType.NUMBER:
			return typeof value === 'number' && !isNaN(value);
		case AttributeType.BOOLEAN:
			return typeof value === 'boolean';
		case AttributeType.DATE:
			return value instanceof Date && !isNaN(value.getTime());
		case AttributeType.ENUM:
			return typeof value === 'string';
		case AttributeType.ARRAY:
			return (
				Array.isArray(value) &&
				(!arrayType || value.every(item => isValidAttributeValue(item, arrayType)))
			);
		default:
			return false;
	}
}

/**
 * Type guard to check if an object matches a schema
 */
export function isValidSchemaObject<TSchema extends AttributeSchema>(
	obj: unknown,
	schema: TSchema,
): obj is Attributes<TSchema> {
	if (!obj || typeof obj !== 'object') return false;

	const attributes = obj as Record<string, unknown>;
	if (typeof attributes.__validated !== 'boolean') return false;

	return Object.entries(schema).every(([key, def]) => {
		if (!(key in attributes)) return !def.validation.required;
		return isValidAttributeValue(
			attributes[key],
			def.type,
			def.type === AttributeType.ARRAY ? def.validation.arrayType : undefined,
		);
	});
}
