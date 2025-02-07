import type { Entity, Rule } from '../models/types';

/**
 * Interface defining the contract for rule evaluation implementations.
 * Provides methods for evaluating entities against rules in various combinations.
 *
 * @interface RuleEvaluator
 *
 * @remarks
 * This interface supports:
 * - Single entity against single rule evaluation
 * - Batch evaluation of multiple entities
 * - Multiple rule evaluation for single entity
 *
 * Implementations of this interface can provide different evaluation strategies:
 * - Basic evaluation (BaseRuleEvaluator)
 * - Cached evaluation (CachedRuleEvaluator)
 * - Custom evaluation strategies
 *
 * @example
 * ```typescript
 * class CustomEvaluator implements RuleEvaluator {
 *   async evaluateRule(entity: Entity, rule: Rule): Promise<boolean> {
 *     // Custom evaluation logic
 *   }
 *
 *   async evaluateRuleBatch(entities: Entity[], rule: Rule): Promise<boolean[]> {
 *     // Custom batch evaluation logic
 *   }
 *
 *   async evaluateRules(entity: Entity, rules: Rule[]): Promise<boolean> {
 *     // Custom multiple rule evaluation logic
 *   }
 * }
 * ```
 */
export interface RuleEvaluator {
	/**
	 * Evaluates a single entity against a single rule.
	 * Core method for determining if an entity matches specific criteria.
	 *
	 * @param {Entity} entity - The entity to evaluate
	 * @param {Rule} rule - The rule containing conditions to check
	 * @returns {Promise<boolean>} True if entity matches all rule conditions, false otherwise
	 *
	 * @remarks
	 * - Evaluates both direct entity properties and dynamic attributes
	 * - Handles nested AND/OR conditions in rules
	 * - Supports all comparison operators defined in ComparisonOperators
	 *
	 * @example
	 * ```typescript
	 * const entity: Entity = {
	 *   id: 'user-1',
	 *   name: 'John Doe',
	 *   attributes: {
	 *     role: 'admin',
	 *     age: 30
	 *   }
	 * };
	 *
	 * const rule: Rule = {
	 *   attributes: {
	 *     role: { eq: 'admin' },
	 *     age: { gte: 18 }
	 *   }
	 * };
	 *
	 * const matches = await evaluator.evaluateRule(entity, rule);
	 * // matches === true
	 * ```
	 */
	evaluateRule(entity: Entity, rule: Rule): Promise<boolean>;

	/**
	 * Evaluates multiple entities against a single rule efficiently.
	 * Optimized for batch processing of entities.
	 *
	 * @param {Entity[]} entities - Array of entities to evaluate
	 * @param {Rule} rule - The rule to check against all entities
	 * @returns {Promise<boolean[]>} Array of results corresponding to input entities
	 *
	 * @remarks
	 * - More efficient than evaluating entities individually
	 * - Maintains order of results matching input array
	 * - Can be optimized for parallel processing
	 *
	 * @example
	 * ```typescript
	 * const entities: Entity[] = [
	 *   { id: 'user-1', name: 'John', attributes: { role: 'admin' } },
	 *   { id: 'user-2', name: 'Jane', attributes: { role: 'user' } }
	 * ];
	 *
	 * const rule: Rule = {
	 *   attributes: {
	 *     role: { eq: 'admin' }
	 *   }
	 * };
	 *
	 * const results = await evaluator.evaluateRuleBatch(entities, rule);
	 * // results === [true, false]
	 * ```
	 */
	evaluateRuleBatch(entities: Entity[], rule: Rule): Promise<boolean[]>;

	/**
	 * Evaluates a single entity against multiple rules.
	 * Useful for checking if an entity matches any rule in a set.
	 *
	 * @param {Entity} entity - The entity to evaluate
	 * @param {Rule[]} rules - Array of rules to check
	 * @returns {Promise<boolean>} True if entity matches any rule, false otherwise
	 *
	 * @remarks
	 * - Implements OR logic across rules (matches if any rule matches)
	 * - Short-circuits on first matching rule
	 * - Each rule can contain complex AND/OR conditions
	 *
	 * @example
	 * ```typescript
	 * const entity: Entity = {
	 *   id: 'user-1',
	 *   name: 'John',
	 *   attributes: {
	 *     role: 'moderator',
	 *     age: 25
	 *   }
	 * };
	 *
	 * const rules: Rule[] = [
	 *   { attributes: { role: { eq: 'admin' } } },
	 *   { attributes: { role: { eq: 'moderator' } } }
	 * ];
	 *
	 * const matches = await evaluator.evaluateRules(entity, rules);
	 * // matches === true (matches second rule)
	 * ```
	 */
	evaluateRules(entity: Entity, rules: Rule[]): Promise<boolean>;
}
