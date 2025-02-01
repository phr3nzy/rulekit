import type { Product } from '../models/Product';
import type { Rule } from '../models/Rule';

/**
 * Interface for rule evaluation implementations
 */
export interface IRuleEvaluator {
	/**
	 * Evaluates a single product against a rule
	 * @param product The product to evaluate
	 * @param rule The rule to evaluate against
	 * @returns Promise resolving to true if the product matches the rule, false otherwise
	 */
	evaluateRule(product: Product, rule: Rule): Promise<boolean>;

	/**
	 * Evaluates multiple products against a single rule
	 * @param products Array of products to evaluate
	 * @param rule The rule to evaluate against
	 * @returns Promise resolving to an array of boolean results matching the input products array
	 */
	evaluateRuleBatch(products: Product[], rule: Rule): Promise<boolean[]>;

	/**
	 * Evaluates a single product against multiple rules
	 * @param product The product to evaluate
	 * @param rules Array of rules to evaluate against
	 * @returns Promise resolving to true if the product matches any of the rules, false otherwise
	 */
	evaluateRules(product: Product, rules: Rule[]): Promise<boolean>;

	/**
	 * Clears any internal caches or state
	 */
	clear(): Promise<void>;
}
