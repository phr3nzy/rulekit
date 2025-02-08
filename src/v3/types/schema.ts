/**
 * @file Core type definitions for RuleKit v3
 * Provides type-safe schema definitions and utilities
 */

import { AttributeType } from '../../core/attributes/types';
import type { AttributeTypeValue } from '../../core/attributes/types';

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
export type TypedValidationRule<T extends AttributeTypeValue> = {
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
		validation: TypedValidationRule<AttributeTypeValue>;
	};
}

/**
 * Utility type to extract the actual value type from a schema field
 */
export type ExtractSchemaValue<
	T extends { type: AttributeTypeValue; validation: TypedValidationRule<AttributeTypeValue> },
> = ExtractAttributeValue<
	T['type'],
	T['type'] extends typeof AttributeType.ARRAY ? T['validation']['arrayType'] : undefined
>;

/**
 * Type-safe attributes object derived from schema
 */
export type TypedAttributes<TSchema extends AttributeSchema> = {
	[K in keyof TSchema]: ExtractSchemaValue<TSchema[K]>;
} & { readonly __validated: boolean };

/**
 * Type-safe entity with generic schema
 */
export type TypedEntity<TSchema extends AttributeSchema> = {
	id: string;
	name: string;
	attributes: TypedAttributes<TSchema>;
};

/**
 * Available comparison operators with type safety
 */
export const TypedComparisonOperators = {
	eq: 'eq',
	ne: 'ne',
	gt: 'gt',
	gte: 'gte',
	lt: 'lt',
	lte: 'lte',
	in: 'in',
	notIn: 'notIn',
} as const;

export type TypedComparisonOperator = keyof typeof TypedComparisonOperators;

/**
 * Type-safe filter based on attribute type
 */
export type TypedFilter<
	T extends AttributeTypeValue,
	TArrayType extends AttributeTypeValue | undefined = undefined,
> = {
	[K in TypedComparisonOperator]?: K extends 'in' | 'notIn'
		? T extends typeof AttributeType.ARRAY
			? TArrayType extends AttributeTypeValue
				? Array<ExtractAttributeValue<TArrayType>>
				: unknown[]
			: Array<ExtractAttributeValue<T>>
		: ExtractAttributeValue<T, TArrayType>;
};

/**
 * Type-safe rule with generic schema
 */
export type TypedRule<TSchema extends AttributeSchema> = {
	and?: Array<TypedRule<TSchema>>;
	or?: Array<TypedRule<TSchema>>;
	attributes?: {
		[K in keyof TSchema]?: TypedFilter<
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
export type TypedRuleSet<TSchema extends AttributeSchema> = {
	fromRules: TypedRule<TSchema>[];
	toRules: TypedRule<TSchema>[];
};

/**
 * Type-safe matching configuration with generic schema
 */
export type TypedMatchingConfig<TSchema extends AttributeSchema> = {
	id: string;
	name: string;
	description?: string;
	ruleSet: TypedRuleSet<TSchema>;
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
): obj is TypedAttributes<TSchema> {
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
