import type { Entity, Rule, MatchingConfig } from '../models/types';
import { BaseRuleEvaluator } from '../evaluators/base-rule-evaluator';
import { RuleEvaluator } from '../evaluators/types';

/**
 * Configuration interface for the RuleEngine service.
 */
interface RuleEngineConfig {
	evaluator?: RuleEvaluator;
	maxBatchSize?: number;
}

/**
 * Core service for evaluating and matching entities based on rule configurations.
 * Provides methods for finding matching entities based on complex rule sets.
 */
export class RuleEngine {
	private readonly evaluator: RuleEvaluator;
	private readonly config: Required<RuleEngineConfig>;

	constructor(config?: Partial<RuleEngineConfig>) {
		this.config = {
			evaluator: new BaseRuleEvaluator(),
			maxBatchSize: 1000,
			...config,
		};

		this.evaluator = this.config.evaluator;
	}

	/**
	 * Finds entities that satisfy all provided 'from' rules.
	 */
	findMatchingFrom(entities: Entity[], rules: Rule[]): Entity[] {
		const results = this.processBatch(entities, rules);
		return entities.filter((_, index) => results[index]);
	}

	/**
	 * Finds target entities that can be matched with source entities based on 'to' rules.
	 */
	findMatchingTo(fromEntities: Entity[], toRules: Rule[], allEntities: Entity[]): Entity[] {
		// First, filter out 'from' entities from all entities
		const candidateEntities = allEntities.filter(
			entity => !fromEntities.some(from => from.id === entity.id),
		);

		// Then find entities matching 'to' rules
		const results = this.processBatch(candidateEntities, toRules);
		return candidateEntities.filter((_, index) => results[index]);
	}

	/**
	 * Splits entities into optimal batch sizes based on complexity
	 */
	private getBatchSize(entities: Entity[], rules: Rule[]): number {
		// Start with configured max batch size
		const entityCount = entities.length;
		let batchSize = this.config.maxBatchSize;

		// Adjust based on rule complexity
		const ruleComplexity = rules.reduce((complexity, rule) => {
			// Count number of conditions in rule
			const countConditions = (r: Rule): number => {
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
	private processBatch(entities: Entity[], rules: Rule[]): boolean[] {
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
				const ruleResults = rules.map(rule => this.evaluator.evaluateRule(entity, rule));
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
	 * Processes a complete matching configuration to find both source and target entities.
	 */
	processConfig(
		config: MatchingConfig,
		entities: Entity[],
	): { fromEntities: Entity[]; toEntities: Entity[] } {
		if (!config.isActive) {
			return { fromEntities: [], toEntities: [] };
		}

		const fromEntities = this.findMatchingFrom(entities, config.ruleSet.fromRules);
		const toEntities = this.findMatchingTo(fromEntities, config.ruleSet.toRules, entities);

		return { fromEntities, toEntities };
	}
}
