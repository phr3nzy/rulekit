/**
 * @file Enhanced rule engine with generic type support
 * Provides type-safe rule evaluation and matching
 */

import type { AttributeSchema, Entity, Rule } from '../types/schema';
import { isValidSchemaObject } from '../types/schema';

/**
 * Configuration interface for the RuleEngine
 */
interface RuleEngineConfig {
	maxBatchSize?: number;
}

/**
 * Enhanced rule engine with generic type support
 */
export class RuleEngine<TSchema extends AttributeSchema> {
	private readonly config: Required<RuleEngineConfig>;

	constructor(
		private readonly schema: TSchema,
		config?: Partial<RuleEngineConfig>,
	) {
		this.config = {
			maxBatchSize: 1000,
			...config,
		};
	}

	/**
	 * Evaluates a single rule against an entity's attributes (assumes pre-validation)
	 */
	private evaluateRule(attributes: Entity<TSchema>['attributes'], rule: Rule<TSchema>): boolean {
		// Handle AND conditions
		if (rule.and?.length) {
			// Recursively evaluate AND sub-rules
			return rule.and.every(subRule => this.evaluateRule(attributes, subRule));
		}

		// Handle OR conditions
		if (rule.or?.length) {
			// Recursively evaluate OR sub-rules
			return rule.or.some(subRule => this.evaluateRule(attributes, subRule));
		}

		// Handle attribute conditions
		if (rule.attributes) {
			// Check if all attribute conditions within the rule match
			return Object.entries(rule.attributes).every(([key, conditions]) => {
				const value = attributes[key]; // Get the entity's attribute value
				// Check if all comparison operators for this attribute match
				return Object.entries(conditions).every(([op, expected]) => {
					switch (op) {
						case 'eq':
							return value === expected;
						case 'ne':
							return value !== expected;
						case 'gt':
							return typeof value === 'number' && value > (expected as number);
						case 'gte':
							return typeof value === 'number' && value >= (expected as number);
						case 'lt':
							return typeof value === 'number' && value < (expected as number);
						case 'lte':
							return typeof value === 'number' && value <= (expected as number);
						case 'in':
							// Check if entity value (or any element if it's an array) is in the expected array
							return (
								Array.isArray(expected) &&
								(Array.isArray(value)
									? value.some(v => expected.includes(v))
									: expected.includes(value))
							);
						case 'notIn':
							// Check if entity value (or all elements if it's an array) is not in the expected array
							return (
								Array.isArray(expected) &&
								(Array.isArray(value)
									? !value.some(v => expected.includes(v)) // If entity value is array, none should be in expected
									: !expected.includes(value)) // If entity value is single, it shouldn't be in expected
							);
						default:
							// Unknown operator fails the check
							return false;
					}
				});
			});
		}

		// An empty rule (no 'and', 'or', or 'attributes') matches everything
		return true;
	}

	/**
	 * Splits entities into optimal batch sizes based on complexity heuristic
	 */
	private getBatchSize(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): number {
		const entityCount = entities.length;
		let batchSize = this.config.maxBatchSize;

		// Simple rule complexity calculation (count conditions)
		const ruleComplexity = rules.reduce((complexity, rule) => {
			const countConditions = (r: Rule<TSchema>): number => {
				let count = 0;
				if (r.and) count += r.and.reduce((sum, subRule) => sum + countConditions(subRule), 0);
				if (r.or) count += r.or.reduce((sum, subRule) => sum + countConditions(subRule), 0);
				if (r.attributes) count += Object.keys(r.attributes).length;
				return count || 1; // Treat empty rule as complexity 1
			};
			return complexity + countConditions(rule);
		}, 0);

		// Reduce batch size heuristically for complex rules
		if (ruleComplexity > 20) {
			batchSize = Math.max(1, Math.floor(batchSize / 4)); // Ensure minimum size of 1
		} else if (ruleComplexity > 10) {
			batchSize = Math.max(1, Math.floor(batchSize / 2)); // Ensure minimum size of 1
		}

		return Math.min(entityCount, batchSize); // Cannot exceed total entity count
	}

	/**
	 * Processes entities in optimally-sized batches, applying rules with validation and short-circuiting
	 */
	private processBatch(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): boolean[] {
		if (rules.length === 0) {
			// If there are no rules, all entities match by default
			return new Array(entities.length).fill(true);
		}

		const batchSize = this.getBatchSize(entities, rules);
		const results = new Array(entities.length).fill(false); // Initialize results to false
		const batches = Math.ceil(entities.length / batchSize);

		for (let i = 0; i < batches; i++) {
			const start = i * batchSize;
			const end = Math.min(start + batchSize, entities.length);
			const batchEntities = entities.slice(start, end);

			batchEntities.forEach((entity, batchIndex) => {
				const overallIndex = start + batchIndex;

				// Optimization 1: Validate entity against schema ONCE before evaluating rules
				if (!isValidSchemaObject(entity.attributes, this.schema)) {
					// results[overallIndex] is already false, so just continue
					return;
				}

				// Optimization 2: Evaluate rules with short-circuiting
				let allRulesPass = true; // Assume true until a rule fails
				for (const rule of rules) {
					// Pass the validated attributes to evaluateRule
					if (!this.evaluateRule(entity.attributes, rule)) {
						allRulesPass = false;
						break; // Short-circuit: No need to check further rules for this entity
					}
				}
				results[overallIndex] = allRulesPass;
			});
		}

		return results;
	}

	/**
	 * Finds entities that satisfy all provided 'from' rules
	 */
	findMatchingFrom(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): Entity<TSchema>[] {
		// Get the boolean results from batch processing
		const matchResults = this.processBatch(entities, rules);
		// Filter the original entities based on the results
		return entities.filter((_, index) => matchResults[index]);
	}

	/**
	 * Finds target entities that can be matched with source entities based on 'to' rules
	 */
	findMatchingTo(
		fromEntities: Entity<TSchema>[],
		toRules: Rule<TSchema>[],
		allEntities: Entity<TSchema>[],
	): Entity<TSchema>[] {
		// Create a Set of 'from' entity IDs for efficient lookup
		const fromEntityIds = new Set(fromEntities.map(e => e.id));

		// Filter 'allEntities' to get candidates (those not in 'fromEntities')
		const candidateEntities = allEntities.filter(entity => !fromEntityIds.has(entity.id));

		// Process the candidate entities against the 'toRules'
		const matchResults = this.processBatch(candidateEntities, toRules);

		// Filter the candidate entities based on the results
		return candidateEntities.filter((_, index) => matchResults[index]);
	}
}
