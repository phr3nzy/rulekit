import type { DynamicAttributes } from '../attributes/types';
import { z } from 'zod';

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
	 * Price of the product
	 */
	price: number;

	/**
	 * Category of the product
	 */
	category: string;

	/**
	 * Brand of the product
	 */
	brand: string;

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
 * Product attributes that can be used in rules
 */
export const ProductAttributes = {
	price: 'price',
	category: 'category',
	brand: 'brand',
} as const;

/**
 * Type for product attributes
 */
export type ProductAttribute = keyof typeof ProductAttributes;

/**
 * Single rule structure with recursive AND/OR support
 */
export type Rule = {
	[K in ProductAttribute]?: BaseFilter;
} & {
	and?: Rule[];
	or?: Rule[];
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
