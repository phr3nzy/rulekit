import { z } from 'zod';

// Base comparison operators as const
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

// Derive operator types from the const object
export type ComparisonOperator = keyof typeof ComparisonOperators;

// Value types that can be used in rules
export type RuleValue = string | number | boolean | Array<string | number>;

// Base filter with strict operator typing
export type BaseFilter = {
	[K in ComparisonOperator]?: RuleValue;
};

// Product attributes as const
export const ProductAttributes = {
	price: 'price',
	category: 'category',
	brand: 'brand',
} as const;

// Derive attribute types from the const object
export type ProductAttribute = keyof typeof ProductAttributes;

// Single rule structure with recursive type for AND/OR
export type Rule = {
	[K in ProductAttribute]?: BaseFilter;
} & {
	and?: Rule[];
	or?: Rule[];
};

// Zod schema for validation
export const ruleValueSchema = z.union([
	z.string(),
	z.number(),
	z.boolean(),
	z.array(z.union([z.string(), z.number()])),
]);

// Create a schema for each operator
const operatorSchema = z.object({}).catchall(ruleValueSchema);

// Create a schema for product attributes
const attributeSchema = z.object({
	[ProductAttributes.price]: operatorSchema.optional(),
	[ProductAttributes.category]: operatorSchema.optional(),
	[ProductAttributes.brand]: operatorSchema.optional(),
});

// Recursive type for the rule schema
export const ruleSchema: z.ZodType<Rule> = z.lazy(() =>
	attributeSchema.extend({
		and: z.array(z.lazy(() => ruleSchema)).optional(),
		or: z.array(z.lazy(() => ruleSchema)).optional(),
	}),
);

// Cross-selling rule set with source and recommendation rules
export type CrossSellingRuleSet = {
	sourceRules: Rule[];
	recommendationRules: Rule[];
};

export const crossSellingRuleSetSchema = z.object({
	sourceRules: z.array(ruleSchema),
	recommendationRules: z.array(ruleSchema),
});

// Configuration type with metadata
export type CrossSellingConfig = {
	id: string;
	name: string;
	description?: string;
	ruleSet: CrossSellingRuleSet;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};

export const crossSellingConfigSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	ruleSet: crossSellingRuleSetSchema,
	isActive: z.boolean(),
	createdAt: z.date(),
	updatedAt: z.date(),
});
