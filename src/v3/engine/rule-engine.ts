/**
 * @file Enhanced rule engine with generic type support
 * Provides type-safe rule evaluation and matching
 */

import type { AttributeSchema, TypedEntity, TypedRule } from '../types/schema';
import { isValidSchemaObject } from '../types/schema';

/**
 * Configuration interface for the TypedRuleEngine
 */
interface TypedRuleEngineConfig {
	maxBatchSize?: number;
}

/**
 * Enhanced rule engine with generic type support
 */
export class TypedRuleEngine<TSchema extends AttributeSchema> {
	private readonly config: Required<TypedRuleEngineConfig>;

	constructor(
		private readonly schema: TSchema,
		config?: Partial<TypedRuleEngineConfig>,
	) {
		this.config = {
			maxBatchSize: 1000,
			...config,
		};
	}

	/**
	 * Evaluates a single rule against an entity
	 */
	private evaluateRule(entity: TypedEntity<TSchema>, rule: TypedRule<TSchema>): boolean {
		// Validate entity against schema
		if (!isValidSchemaObject(entity.attributes, this.schema)) {
			console.log('Schema validation failed for entity:', entity);
			return false;
		}

		// Handle AND conditions
		if (rule.and?.length) {
			console.log('Evaluating AND conditions for entity:', entity.id);
			const result = rule.and.every(subRule => this.evaluateRule(entity, subRule));
			console.log('AND result:', result);
			return result;
		}

		// Handle OR conditions
		if (rule.or?.length) {
			console.log('Evaluating OR conditions for entity:', entity.id);
			const result = rule.or.some(subRule => this.evaluateRule(entity, subRule));
			console.log('OR result:', result);
			return result;
		}

		// Handle attribute conditions
		if (rule.attributes) {
			console.log('Evaluating attributes for entity:', entity.id);
			return Object.entries(rule.attributes).every(([key, conditions]) => {
				const value = entity.attributes[key];
				console.log('Checking attribute:', key, 'value:', value, 'conditions:', conditions);
				return Object.entries(conditions).every(([op, expected]) => {
					let result: boolean;
					switch (op) {
						case 'eq':
							result = value === expected;
							break;
						case 'ne':
							result = value !== expected;
							break;
						case 'gt':
							result = typeof value === 'number' && value > (expected as number);
							break;
						case 'gte':
							result = typeof value === 'number' && value >= (expected as number);
							break;
						case 'lt':
							result = typeof value === 'number' && value < (expected as number);
							break;
						case 'lte':
							result = typeof value === 'number' && value <= (expected as number);
							break;
						case 'in':
							result =
								Array.isArray(expected) &&
								(Array.isArray(value)
									? value.some(v => expected.includes(v))
									: expected.includes(value));
							break;
						case 'notIn':
							result =
								Array.isArray(expected) &&
								(Array.isArray(value)
									? !value.some(v => expected.includes(v))
									: !expected.includes(value));
							break;
						default:
							result = false;
					}
					console.log('Operator:', op, 'Expected:', expected, 'Result:', result);
					return result;
				});
			});
		}

		// Empty rule matches everything
		console.log('Empty rule for entity:', entity.id);
		return true;
	}

	/**
	 * Splits entities into optimal batch sizes based on complexity
	 */
	private getBatchSize(entities: TypedEntity<TSchema>[], rules: TypedRule<TSchema>[]): number {
		// Start with configured max batch size
		const entityCount = entities.length;
		let batchSize = this.config.maxBatchSize;

		// Adjust based on rule complexity
		const ruleComplexity = rules.reduce((complexity, rule) => {
			// Count number of conditions in rule
			const countConditions = (r: TypedRule<TSchema>): number => {
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
	private processBatch(entities: TypedEntity<TSchema>[], rules: TypedRule<TSchema>[]): boolean[] {
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
				// Entity matches if any rule matches
				return ruleResults.some(Boolean);
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
	findMatchingFrom(
		entities: TypedEntity<TSchema>[],
		rules: TypedRule<TSchema>[],
	): TypedEntity<TSchema>[] {
		// Handle empty rule sets
		if (!rules.length) {
			return [];
		}

		const results = this.processBatch(entities, rules);
		return entities.filter((_, index) => results[index]);
	}

	/**
	 * Finds target entities that can be matched with source entities based on 'to' rules
	 */
	findMatchingTo(
		fromEntities: TypedEntity<TSchema>[],
		toRules: TypedRule<TSchema>[],
		allEntities: TypedEntity<TSchema>[],
	): TypedEntity<TSchema>[] {
		// First, filter out 'from' entities from all entities
		const candidateEntities = allEntities.filter(
			entity => !fromEntities.some(from => from.id === entity.id),
		);

		// Then find entities matching 'to' rules
		const results = this.processBatch(candidateEntities, toRules);
		return candidateEntities.filter((_, index) => results[index]);
	}
}
