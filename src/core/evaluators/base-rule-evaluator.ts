import type { Product, Rule, RuleValue, ComparisonOperator } from '../models/types';
import type { RuleEvaluator } from './types';
import { ComparisonOperators } from '../models/types';

/**
 * Base implementation of RuleEvaluator interface
 */
export class BaseRuleEvaluator implements RuleEvaluator {
	/**
	 * Evaluates a single product against a rule
	 */
	async evaluateRule(product: Product, rule: Rule): Promise<boolean> {
		// Handle AND conditions
		if (rule.and) {
			return (
				await Promise.all(rule.and.map(subRule => this.evaluateRule(product, subRule)))
			).every(Boolean);
		}

		// Handle OR conditions
		if (rule.or) {
			return (await Promise.all(rule.or.map(subRule => this.evaluateRule(product, subRule)))).some(
				Boolean,
			);
		}

		// Handle attributes
		if (rule.attributes) {
			return Object.entries(rule.attributes).every(([attrKey, attrValue]) => {
				const productValue = product.attributes[attrKey];
				return this.evaluateFilter(
					productValue,
					attrValue as Record<ComparisonOperator, RuleValue>,
				);
			});
		}

		// Handle direct attribute rules (legacy format)
		const attributeEntries = Object.entries(rule).filter(([key]) => key !== 'and' && key !== 'or');
		if (attributeEntries.length > 0) {
			return attributeEntries.every(([attrKey, attrValue]) => {
				const productValue = product.attributes[attrKey];
				return this.evaluateFilter(
					productValue,
					attrValue as Record<ComparisonOperator, RuleValue>,
				);
			});
		}

		// Return false for unhandled cases
		return false;
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
	 * Evaluates a filter against a value
	 */
	private evaluateFilter(value: unknown, filter: Record<ComparisonOperator, RuleValue>): boolean {
		// If value is undefined, the filter should fail
		if (value === undefined) {
			return false;
		}

		return Object.entries(filter).every(([operator, targetValue]) => {
			const op = operator as ComparisonOperator;
			if (!Object.values(ComparisonOperators).includes(op)) {
				return false;
			}

			return this.evaluateOperator(value, op, targetValue);
		});
	}

	/**
	 * Evaluates a single operator
	 */
	private evaluateOperator(
		value: unknown,
		operator: ComparisonOperator,
		targetValue: RuleValue,
	): boolean {
		// Handle type mismatches for numeric comparisons
		if (['gt', 'gte', 'lt', 'lte'].includes(operator)) {
			if (typeof value !== 'number' || typeof targetValue !== 'number') {
				return false;
			}
		}

		switch (operator) {
			case 'eq':
				return value === targetValue;
			case 'ne':
				return value !== targetValue;
			case 'gt':
				return (value as number) > (targetValue as number);
			case 'gte':
				return (value as number) >= (targetValue as number);
			case 'lt':
				return (value as number) < (targetValue as number);
			case 'lte':
				return (value as number) <= (targetValue as number);
			case 'in':
				return Array.isArray(targetValue) && targetValue.includes(value as string | number);
			case 'notIn':
				return Array.isArray(targetValue) && !targetValue.includes(value as string | number);
			default:
				return false;
		}
	}
}
