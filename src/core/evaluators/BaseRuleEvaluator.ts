import type { Product } from '../models/Product';
import type { Rule, ComparisonOperator, RuleValue } from '../models/Rule';
import type { IRuleEvaluator } from '../interfaces/IRuleEvaluator';
import { ComparisonOperators } from '../models/Rule';

/**
 * Base implementation of IRuleEvaluator
 */
export class BaseRuleEvaluator implements IRuleEvaluator {
	/**
	 * Evaluates a single product against a rule
	 */
	async evaluateRule(product: Product, rule: Rule): Promise<boolean> {
		// Handle AND conditions
		if (rule.and?.length) {
			return (await Promise.all(rule.and.map(r => this.evaluateRule(product, r)))).every(Boolean);
		}

		// Handle OR conditions
		if (rule.or?.length) {
			return (await Promise.all(rule.or.map(r => this.evaluateRule(product, r)))).some(Boolean);
		}

		// Handle empty AND/OR conditions
		if (rule.and !== undefined && !rule.and.length) return true;
		if (rule.or !== undefined && !rule.or.length) return false;

		// Handle leaf node (actual comparison)
		return this.evaluateLeafRule(product, rule);
	}

	/**
	 * Evaluates multiple products against a single rule
	 */
	async evaluateRuleBatch(products: Product[], rule: Rule): Promise<boolean[]> {
		return Promise.all(products.map(product => this.evaluateRule(product, rule)));
	}

	/**
	 * Evaluates a single product against multiple rules
	 */
	async evaluateRules(product: Product, rules: Rule[]): Promise<boolean> {
		return (await Promise.all(rules.map(rule => this.evaluateRule(product, rule)))).some(Boolean);
	}

	/**
	 * Clears any internal caches or state
	 */
	async clear(): Promise<void> {
		// No-op in base implementation
	}

	/**
	 * Evaluates a leaf rule node (actual comparison)
	 */
	protected evaluateLeafRule(product: Product, rule: Rule): boolean {
		for (const [attribute, conditions] of Object.entries(rule)) {
			if (attribute === 'and' || attribute === 'or') continue;

			const productValue = product[attribute as keyof Product];
			if (productValue === undefined) return false;

			for (const [operator, ruleValue] of Object.entries(conditions)) {
				if (!this.evaluateCondition(operator as ComparisonOperator, productValue, ruleValue)) {
					return false;
				}
			}
		}

		return true;
	}

	/**
	 * Evaluates a single condition
	 */
	protected evaluateCondition(
		operator: ComparisonOperator,
		productValue: unknown,
		ruleValue: RuleValue,
	): boolean {
		switch (operator) {
			case ComparisonOperators.eq:
				return productValue === ruleValue;
			case ComparisonOperators.ne:
				return productValue !== ruleValue;
			case ComparisonOperators.gt:
				return (
					typeof productValue === 'number' &&
					typeof ruleValue === 'number' &&
					productValue > ruleValue
				);
			case ComparisonOperators.gte:
				return (
					typeof productValue === 'number' &&
					typeof ruleValue === 'number' &&
					productValue >= ruleValue
				);
			case ComparisonOperators.lt:
				return (
					typeof productValue === 'number' &&
					typeof ruleValue === 'number' &&
					productValue < ruleValue
				);
			case ComparisonOperators.lte:
				return (
					typeof productValue === 'number' &&
					typeof ruleValue === 'number' &&
					productValue <= ruleValue
				);
			case ComparisonOperators.in:
				return Array.isArray(ruleValue) && ruleValue.includes(productValue as string | number);
			case ComparisonOperators.notIn:
				return Array.isArray(ruleValue) && !ruleValue.includes(productValue as string | number);
			default:
				return false;
		}
	}
}
