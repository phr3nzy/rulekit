import type { Entity, Rule, RuleValue, ComparisonOperator } from '../models/types';
import type { RuleEvaluator } from './types';
import { ComparisonOperators } from '../models/types';

/**
 * Base implementation of the RuleEvaluator interface providing core rule evaluation logic.
 * This class implements fundamental rule matching capabilities without caching or optimization.
 *
 * @class BaseRuleEvaluator
 * @implements {RuleEvaluator}
 */
export class BaseRuleEvaluator implements RuleEvaluator {
	// Set of valid operators for O(1) lookup
	private static readonly validOperators = new Set(Object.values(ComparisonOperators));

	/**
	 * Evaluates if a single entity matches the given rule.
	 * Handles complex rule structures including nested AND/OR conditions.
	 */
	evaluateRule(entity: Entity, rule: Rule): boolean {
		// Handle AND conditions
		if (rule.and) {
			return rule.and.every(subRule => this.evaluateRule(entity, subRule));
		}

		// Handle OR conditions
		if (rule.or) {
			return rule.or.some(subRule => this.evaluateRule(entity, subRule));
		}

		// Handle attributes
		if (rule.attributes) {
			return Object.entries(rule.attributes).every(([attrKey, attrValue]) => {
				const entityValue = entity.attributes[attrKey];
				return this.evaluateFilter(entityValue, attrValue as Record<ComparisonOperator, RuleValue>);
			});
		}

		// Handle direct attribute rules (legacy format)
		const attributeEntries = Object.entries(rule).filter(([key]) => key !== 'and' && key !== 'or');
		if (attributeEntries.length > 0) {
			return attributeEntries.every(([attrKey, attrValue]) => {
				const entityValue = entity.attributes[attrKey];
				return this.evaluateFilter(entityValue, attrValue as Record<ComparisonOperator, RuleValue>);
			});
		}

		// Return false for unhandled cases
		return false;
	}

	/**
	 * Efficiently evaluates multiple entities against a single rule.
	 */
	evaluateRuleBatch(entities: Entity[], rule: Rule): boolean[] {
		return entities.map(entity => this.evaluateRule(entity, rule));
	}

	/**
	 * Evaluates if an entity matches any rule from a set of rules.
	 */
	evaluateRules(entity: Entity, rules: Rule[]): boolean {
		return rules.some(rule => this.evaluateRule(entity, rule));
	}

	/**
	 * Clears any internal caches or state.
	 * Base implementation is a no-op as it maintains no state.
	 */
	clear(): void {
		// No-op in base implementation
	}

	/**
	 * Internal method to evaluate a filter against a value.
	 */
	private evaluateFilter(value: unknown, filter: Record<ComparisonOperator, RuleValue>): boolean {
		// Early return for undefined values
		if (value === undefined) return false;

		// Get entries once and cache
		const entries = Object.entries(filter);

		// Check for Symbol keys
		if (Object.getOwnPropertySymbols(filter).length > 0) {
			return false;
		}

		// Fast path for single operator (common case)
		if (entries.length === 1) {
			const [operator, targetValue] = entries[0];
			// Quick validation using Set
			if (!BaseRuleEvaluator.validOperators.has(operator as ComparisonOperator)) {
				return false;
			}
			return this.evaluateOperator(value, operator as ComparisonOperator, targetValue);
		}

		// Multiple operators - validate and evaluate all
		return entries.every(([operator, targetValue]) => {
			if (!BaseRuleEvaluator.validOperators.has(operator as ComparisonOperator)) {
				return false;
			}
			return this.evaluateOperator(value, operator as ComparisonOperator, targetValue);
		});
	}

	/**
	 * Internal method to evaluate a single comparison operator.
	 */
	private evaluateOperator(
		value: unknown,
		operator: ComparisonOperator,
		targetValue: RuleValue,
	): boolean {
		// Fast path for equality checks (most common)
		if (operator === 'eq') {
			return Array.isArray(targetValue)
				? new Set(targetValue).has(value as string | number)
				: value === targetValue;
		}

		// Fast path for numeric comparisons
		if (typeof value === 'number' && typeof targetValue === 'number') {
			switch (operator) {
				case 'gt':
					return value > targetValue;
				case 'gte':
					return value >= targetValue;
				case 'lt':
					return value < targetValue;
				case 'lte':
					return value <= targetValue;
			}
		}

		// Handle array operations with Set for O(1) lookup
		if (Array.isArray(targetValue)) {
			const set = new Set(targetValue);
			switch (operator) {
				case 'ne':
					return !set.has(value as string | number);
				case 'in':
					return set.has(value as string | number);
				case 'notIn':
					return !set.has(value as string | number);
			}
		}

		// Handle remaining non-array operations
		switch (operator) {
			case 'ne':
				return value !== targetValue;
			default:
				return false;
		}
	}
}
