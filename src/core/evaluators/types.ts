import type { Entity, Rule } from '../models/types';

/**
 * Interface for rule evaluation implementations
 */
export interface RuleEvaluator {
	/**
	 * Evaluates a single entity against a rule
	 * @param entity The entity to evaluate
	 * @param rule The rule to evaluate against
	 * @returns Promise resolving to true if the entity matches the rule, false otherwise
	 */
	evaluateRule(entity: Entity, rule: Rule): Promise<boolean>;

	/**
	 * Evaluates multiple entities against a single rule
	 * @param entities Array of entities to evaluate
	 * @param rule The rule to evaluate against
	 * @returns Promise resolving to an array of boolean results matching the input entities array
	 */
	evaluateRuleBatch(entities: Entity[], rule: Rule): Promise<boolean[]>;

	/**
	 * Evaluates a single entity against multiple rules
	 * @param entity The entity to evaluate
	 * @param rules Array of rules to evaluate against
	 * @returns Promise resolving to true if the entity matches any of the rules, false otherwise
	 */
	evaluateRules(entity: Entity, rules: Rule[]): Promise<boolean>;
}
