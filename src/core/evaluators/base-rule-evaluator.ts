import type { Entity, Rule, RuleValue, ComparisonOperator } from '../models/types';
import type { RuleEvaluator } from './types';
import { ComparisonOperators } from '../models/types';

/**
 * Base implementation of the RuleEvaluator interface providing core rule evaluation logic.
 * This class implements fundamental rule matching capabilities without caching or optimization.
 *
 * @class BaseRuleEvaluator
 * @implements {RuleEvaluator}
 *
 * @remarks
 * Features supported:
 * - Logical AND/OR operations
 * - Attribute-based matching
 * - Complex nested rules
 * - All comparison operators
 * - Batch processing
 *
 * @example
 * ```typescript
 * const evaluator = new BaseRuleEvaluator();
 *
 * const entity = {
 *   id: 'user-1',
 *   name: 'John',
 *   attributes: {
 *     role: 'admin',
 *     age: 30
 *   }
 * };
 *
 * const rule = {
 *   and: [
 *     { attributes: { role: { eq: 'admin' } } },
 *     { attributes: { age: { gte: 25 } } }
 *   ]
 * };
 *
 * const matches = await evaluator.evaluateRule(entity, rule);
 * ```
 */
export class BaseRuleEvaluator implements RuleEvaluator {
	/**
	 * Evaluates if a single entity matches the given rule.
	 * Handles complex rule structures including nested AND/OR conditions.
	 *
	 * @param {Entity} entity - The entity to evaluate
	 * @param {Rule} rule - The rule to evaluate against
	 * @returns {Promise<boolean>} True if entity matches rule conditions
	 *
	 * @remarks
	 * Evaluation process:
	 * 1. Checks for AND/OR conditions first
	 * 2. Processes attribute rules
	 * 3. Handles legacy direct attribute format
	 * 4. Returns false for unhandled cases
	 *
	 * @example
	 * ```typescript
	 * // Complex rule with nested conditions
	 * const rule = {
	 *   and: [
	 *     {
	 *       or: [
	 *         { attributes: { role: { eq: 'admin' } } },
	 *         { attributes: { role: { eq: 'moderator' } } }
	 *       ]
	 *     },
	 *     { attributes: { isActive: { eq: true } } }
	 *   ]
	 * };
	 *
	 * const matches = await evaluator.evaluateRule(entity, rule);
	 * ```
	 */
	async evaluateRule(entity: Entity, rule: Rule): Promise<boolean> {
		// Handle AND conditions
		if (rule.and) {
			return (await Promise.all(rule.and.map(subRule => this.evaluateRule(entity, subRule)))).every(
				Boolean,
			);
		}

		// Handle OR conditions
		if (rule.or) {
			return (await Promise.all(rule.or.map(subRule => this.evaluateRule(entity, subRule)))).some(
				Boolean,
			);
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
	 * Processes entities in parallel using Promise.all.
	 *
	 * @param {Entity[]} entities - Array of entities to evaluate
	 * @param {Rule} rule - The rule to check against all entities
	 * @returns {Promise<boolean[]>} Array of boolean results
	 *
	 * @remarks
	 * - Results maintain the same order as input entities
	 * - Uses Promise.all for concurrent processing
	 * - Each entity is evaluated independently
	 *
	 * @example
	 * ```typescript
	 * const entities = [
	 *   { id: 'user-1', attributes: { role: 'admin' } },
	 *   { id: 'user-2', attributes: { role: 'user' } }
	 * ];
	 *
	 * const rule = {
	 *   attributes: { role: { eq: 'admin' } }
	 * };
	 *
	 * const results = await evaluator.evaluateRuleBatch(entities, rule);
	 * // results = [true, false]
	 * ```
	 */
	async evaluateRuleBatch(entities: Entity[], rule: Rule): Promise<boolean[]> {
		return Promise.all(entities.map(entity => this.evaluateRule(entity, rule)));
	}

	/**
	 * Evaluates if an entity matches any rule from a set of rules.
	 * Implements OR logic across multiple rules.
	 *
	 * @param {Entity} entity - The entity to evaluate
	 * @param {Rule[]} rules - Array of rules to check
	 * @returns {Promise<boolean>} True if entity matches any rule
	 *
	 * @remarks
	 * - Uses Promise.all for concurrent rule evaluation
	 * - Short-circuits on first matching rule (via .some())
	 * - Each rule can contain complex conditions
	 *
	 * @example
	 * ```typescript
	 * const rules = [
	 *   { attributes: { role: { eq: 'admin' } } },
	 *   { attributes: { role: { eq: 'moderator' } } }
	 * ];
	 *
	 * const matches = await evaluator.evaluateRules(entity, rules);
	 * ```
	 */
	async evaluateRules(entity: Entity, rules: Rule[]): Promise<boolean> {
		return (await Promise.all(rules.map(rule => this.evaluateRule(entity, rule)))).some(Boolean);
	}

	/**
	 * Clears any internal caches or state.
	 * Base implementation is a no-op as it maintains no state.
	 *
	 * @returns {Promise<void>}
	 *
	 * @remarks
	 * - Implemented for interface compatibility
	 * - Used by derived classes with caching
	 * - Safe to call but has no effect in base implementation
	 */
	async clear(): Promise<void> {
		// No-op in base implementation
	}

	/**
	 * Internal method to evaluate a filter against a value.
	 * Handles all comparison operations defined in ComparisonOperators.
	 *
	 * @private
	 * @param {unknown} value - The value to check
	 * @param {Record<ComparisonOperator, RuleValue>} filter - The filter to apply
	 * @returns {boolean} True if value matches filter conditions
	 *
	 * @remarks
	 * - Handles undefined values
	 * - Validates operator types
	 * - Checks for invalid operators
	 * - Processes multiple conditions as AND
	 *
	 * @example
	 * ```typescript
	 * // Internal usage
	 * const result = this.evaluateFilter(30, { gte: 18, lte: 65 });
	 * ```
	 */
	private evaluateFilter(value: unknown, filter: Record<ComparisonOperator, RuleValue>): boolean {
		// If value is undefined, the filter should fail
		if (value === undefined) {
			return false;
		}

		// Check for Symbol keys
		if (Object.getOwnPropertySymbols(filter).length > 0) {
			return false;
		}

		// Check for invalid operators
		const hasInvalidOperator = Object.keys(filter).some(operator => {
			if (typeof operator !== 'string') {
				return true;
			}
			return !Object.values(ComparisonOperators).includes(operator as ComparisonOperator);
		});

		if (hasInvalidOperator) {
			return false;
		}

		return Object.entries(filter).every(([operator, targetValue]) => {
			const op = operator as ComparisonOperator;
			return this.evaluateOperator(value, op, targetValue);
		});
	}

	/**
	 * Internal method to evaluate a single comparison operator.
	 * Implements the logic for each supported comparison operator.
	 *
	 * @private
	 * @param {unknown} value - The value to compare
	 * @param {ComparisonOperator} operator - The comparison operator to use
	 * @param {RuleValue} targetValue - The value to compare against
	 * @returns {boolean} True if the comparison is satisfied
	 *
	 * @remarks
	 * Supported operators:
	 * - eq: Equal to (includes array membership)
	 * - ne: Not equal to
	 * - gt: Greater than (numbers only)
	 * - gte: Greater than or equal (numbers only)
	 * - lt: Less than (numbers only)
	 * - lte: Less than or equal (numbers only)
	 * - in: Value exists in array
	 * - notIn: Value does not exist in array
	 *
	 * @example
	 * ```typescript
	 * // Internal usage
	 * const result = this.evaluateOperator(25, 'gte', 18);
	 * ```
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
				return Array.isArray(targetValue)
					? targetValue.includes(value as string | number)
					: value === targetValue;
			case 'ne':
				return Array.isArray(targetValue)
					? !targetValue.includes(value as string | number)
					: value !== targetValue;
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
