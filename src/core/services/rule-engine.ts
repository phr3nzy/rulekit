import type { Entity, Rule, MatchingConfig } from '../models/types';
import { BaseRuleEvaluator } from '../evaluators/base-rule-evaluator';
import { RuleEvaluator } from '../evaluators/types';

interface RuleEngineConfig {
	/**
	 * Rule evaluator implementation to use
	 * @default BaseRuleEvaluator
	 */
	evaluator?: RuleEvaluator;

	/**
	 * Maximum number of entities to process in a single batch
	 * @default 1000
	 */
	maxBatchSize?: number;
}

/**
 * Main RuleEngine service for rule-based matching
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
	 * Finds entities that match the 'from' rules
	 */
	async findMatchingFrom(entities: Entity[], rules: Rule[]): Promise<Entity[]> {
		const results = await this.processBatch(entities, rules);
		return entities.filter((_, index) => results[index]);
	}

	/**
	 * Finds matching 'to' entities based on 'from' entities and 'to' rules
	 */
	async findMatchingTo(
		fromEntities: Entity[],
		toRules: Rule[],
		allEntities: Entity[],
	): Promise<Entity[]> {
		// First, filter out 'from' entities from all entities
		const candidateEntities = allEntities.filter(
			entity => !fromEntities.some(from => from.id === entity.id),
		);

		// Then find entities matching 'to' rules
		const results = await this.processBatch(candidateEntities, toRules);
		return candidateEntities.filter((_, index) => results[index]);
	}

	/**
	 * Processes entities in batches to avoid memory issues with large datasets
	 */
	private async processBatch(entities: Entity[], rules: Rule[]): Promise<boolean[]> {
		const results: boolean[] = [];
		const batches = Math.ceil(entities.length / this.config.maxBatchSize);

		for (let i = 0; i < batches; i++) {
			const start = i * this.config.maxBatchSize;
			const end = Math.min(start + this.config.maxBatchSize, entities.length);
			const batch = entities.slice(start, end);

			// Evaluate each entity against all rules
			const batchResults = await Promise.all(
				batch.map(async entity => {
					// Each rule in the array must match (AND condition)
					const ruleResults = await Promise.all(
						rules.map(rule => this.evaluator.evaluateRule(entity, rule)),
					);
					return ruleResults.every(Boolean);
				}),
			);

			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Processes a matching configuration
	 */
	async processConfig(
		config: MatchingConfig,
		entities: Entity[],
	): Promise<{ fromEntities: Entity[]; toEntities: Entity[] }> {
		if (!config.isActive) {
			return { fromEntities: [], toEntities: [] };
		}

		const fromEntities = await this.findMatchingFrom(entities, config.ruleSet.fromRules);
		const toEntities = await this.findMatchingTo(fromEntities, config.ruleSet.toRules, entities);

		return { fromEntities, toEntities };
	}
}
