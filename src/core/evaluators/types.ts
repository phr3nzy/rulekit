import type { Entity, Rule } from '../models/types';

/**
 * Interface defining the contract for rule evaluation implementations.
 * Provides methods for evaluating entities against rules in various combinations.
 *
 * @interface RuleEvaluator
 */
export interface RuleEvaluator {
	/**
	 * Evaluates a single entity against a single rule.
	 * Core method for determining if an entity matches specific criteria.
	 */
	evaluateRule(entity: Entity, rule: Rule): boolean;

	/**
	 * Evaluates multiple entities against a single rule efficiently.
	 * Optimized for batch processing of entities.
	 */
	evaluateRuleBatch(entities: Entity[], rule: Rule): boolean[];

	/**
	 * Evaluates a single entity against multiple rules.
	 * Useful for checking if an entity matches any rule in a set.
	 */
	evaluateRules(entity: Entity, rules: Rule[]): boolean;

	/**
	 * Clears any internal state or caches.
	 */
	clear(): void;
}
