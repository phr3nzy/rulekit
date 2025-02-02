import type { DynamicAttributes } from '../attributes/types';

/**
 * Base product type that can be used with rules
 */
export type Product = {
	/**
	 * Unique identifier for the product
	 */
	id: string;

	/**
	 * Display name of the product
	 */
	name: string;

	/**
	 * Dynamic attributes that have been validated against their definitions
	 */
	attributes: DynamicAttributes;
};

/**
 * Base comparison operators
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

/**
 * Type for comparison operators
 */
export type ComparisonOperator = keyof typeof ComparisonOperators;

/**
 * Valid value types for rules
 */
export type RuleValue = string | number | boolean | Array<string | number>;

/**
 * Base filter type with operator constraints
 */
export type BaseFilter = {
	[K in ComparisonOperator]?: RuleValue;
};

/**
 * Single rule structure with recursive AND/OR support
 */
export type Rule = {
	[key: string]: BaseFilter | Rule[] | { [key: string]: BaseFilter };
	and?: Rule[];
	or?: Rule[];
	attributes?: { [key: string]: BaseFilter };
};

/**
 * Cross-selling rule set with source and recommendation rules
 */
export type CrossSellingRuleSet = {
	sourceRules: Rule[];
	recommendationRules: Rule[];
};

/**
 * Configuration type for cross-selling rules
 */
export type CrossSellingConfig = {
	id: string;
	name: string;
	description?: string;
	ruleSet: CrossSellingRuleSet;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};
