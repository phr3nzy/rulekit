import { z } from 'zod';

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

// Validation schemas
export const ruleValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.array(z.union([z.string(), z.number()])),
]);

const operatorSchema = z
	.object({
		eq: ruleValueSchema.optional(),
		ne: ruleValueSchema.optional(),
		gt: z.number().optional(),
		gte: z.number().optional(),
		lt: z.number().optional(),
		lte: z.number().optional(),
		in: z.array(z.union([z.string(), z.number()])).optional(),
		notIn: z.array(z.union([z.string(), z.number()])).optional(),
	})
	.strict();

const attributeSchema = z
	.object({
		[ProductAttributes.price]: operatorSchema.optional(),
		[ProductAttributes.category]: operatorSchema.optional(),
		[ProductAttributes.brand]: operatorSchema.optional(),
	})
	.strict();

export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
	attributeSchema
		.extend({
			and: z.array(z.lazy(() => ruleSchema)).optional(),
			or: z.array(z.lazy(() => ruleSchema)).optional(),
		})
		.strict(),
);

export const crossSellingRuleSetSchema = z
	.object({
		sourceRules: z.array(ruleSchema).min(1),
		recommendationRules: z.array(ruleSchema).min(1),
	})
	.strict();

export const crossSellingConfigSchema = z
	.object({
		id: z.string(),
		name: z.string(),
		description: z.string().optional(),
		ruleSet: crossSellingRuleSetSchema,
		isActive: z.boolean(),
		createdAt: z.date(),
		updatedAt: z.date(),
	})
	.strict();
