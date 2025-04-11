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
	 * Evaluates a single rule against an entity
	 */
	private evaluateRule(entity: Entity<TSchema>, rule: Rule<TSchema>): boolean {
		// Validate entity against schema
		if (!isValidSchemaObject(entity.attributes, this.schema)) {
			return false;
		}

		// Handle AND conditions
		if (rule.and?.length) {
			return rule.and.every(subRule => this.evaluateRule(entity, subRule));
		}

		// Handle OR conditions
		if (rule.or?.length) {
			return rule.or.some(subRule => this.evaluateRule(entity, subRule));
		}

		// Handle attribute conditions
		if (rule.attributes) {
			return Object.entries(rule.attributes).every(([key, conditions]) => {
				const value = entity.attributes[key];
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
							return (
								Array.isArray(expected) &&
								(Array.isArray(value)
									? value.some(v => expected.includes(v))
									: expected.includes(value))
							);
						case 'notIn':
							return (
								Array.isArray(expected) &&
								(Array.isArray(value)
									? !value.some(v => expected.includes(v))
									: !expected.includes(value))
							);
						default:
							return false;
					}
				});
			});
		}

		// Empty rule matches everything
		return true;
	}

	/**
	 * Splits entities into optimal batch sizes based on complexity
	 */
	private getBatchSize(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): number {
		// Start with configured max batch size
		const entityCount = entities.length;
		let batchSize = this.config.maxBatchSize;

		// Adjust based on rule complexity
		const ruleComplexity = rules.reduce((complexity, rule) => {
			// Count number of conditions in rule
			const countConditions = (r: Rule<TSchema>): number => {
				let count = 0;
				if (r.and) count += r.and.reduce((sum, subRule) => sum + countConditions(subRule), 0);
				if (r.or) count += r.or.reduce((sum, subRule) => sum + countConditions(subRule), 0);
				if (r.attributes) count += Object.keys(r.attributes).length;
				return count || 1;
			};
			return complexity + countConditions(rule);
		}, 0);

		// Reduce batch size for complex rules
		if (ruleComplexity > 10) batchSize = Math.floor(batchSize / 2);
		if (ruleComplexity > 20) batchSize = Math.floor(batchSize / 4);

		// Ensure minimum batch size
		return Math.min(entityCount, batchSize);
	}

	/**
	 * Processes entities in optimally-sized batches
	 */
	private processBatch(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): boolean[] {
		const batchSize = this.getBatchSize(entities, rules);
		const results = new Array(entities.length);
		const batches = Math.ceil(entities.length / batchSize);

		// Process all batches
		for (let i = 0; i < batches; i++) {
			const start = i * batchSize;
			const end = Math.min(start + batchSize, entities.length);
			const batch = entities.slice(start, end);

			// Process each entity in the batch
			const batchResults = batch.map(entity => {
				// Evaluate all rules for each entity
				const ruleResults = rules.map(rule => this.evaluateRule(entity, rule));
				return ruleResults.every(Boolean);
			});

			// Store batch results in the correct positions
			batchResults.forEach((result, batchIndex) => {
				results[start + batchIndex] = result;
			});
		}

		return results;
	}

	/**
	 * Finds entities that satisfy all provided 'from' rules
	 */
	findMatchingFrom(entities: Entity<TSchema>[], rules: Rule<TSchema>[]): Entity<TSchema>[] {
		const results = this.processBatch(entities, rules);
		return entities.filter((_, index) => results[index]);
	}

	/**
	 * Finds target entities that can be matched with source entities based on 'to' rules
	 */
	findMatchingTo(
		fromEntities: Entity<TSchema>[],
		toRules: Rule<TSchema>[],
		allEntities: Entity<TSchema>[],
	): Entity<TSchema>[] {
		// First, filter out 'from' entities from all entities
		const candidateEntities = allEntities.filter(
			entity => !fromEntities.some(from => from.id === entity.id),
		);

		// Then find entities matching 'to' rules
		const results = this.processBatch(candidateEntities, toRules);
		return candidateEntities.filter((_, index) => results[index]);
	}
}
