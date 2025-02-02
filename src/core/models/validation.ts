import { z } from 'zod';
import { ProductAttributes } from './types';
import type { Rule } from './types';

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
