import type { Entity, Rule, MatchingConfig } from '../models/types';
import { BaseRuleEvaluator } from '../evaluators/base-rule-evaluator';
import { RuleEvaluator } from '../evaluators/types';

/**
 * Configuration interface for the RuleEngine service.
 * Defines optional settings to customize the engine's behavior.
 *
 * @interface RuleEngineConfig
 *
 * @property {RuleEvaluator} [evaluator] - Custom rule evaluator implementation.
 * Allows injection of different evaluation strategies.
 * Defaults to BaseRuleEvaluator if not provided.
 *
 * @property {number} [maxBatchSize] - Maximum number of entities to process in a single batch.
 * Used to prevent memory issues with large datasets.
 * Defaults to 1000 if not specified.
 *
 * @example
 * ```typescript
 * const config: RuleEngineConfig = {
 *   evaluator: new CachedRuleEvaluator(),
 *   maxBatchSize: 500
 * };
 * const engine = new RuleEngine(config);
 * ```
 */
interface RuleEngineConfig {
	evaluator?: RuleEvaluator;
	maxBatchSize?: number;
}

/**
 * Core service for evaluating and matching entities based on rule configurations.
 * Provides methods for finding matching entities based on complex rule sets.
 *
 * @class RuleEngine
 *
 * @remarks
 * The RuleEngine handles:
 * - Batch processing of entities to prevent memory issues
 * - Evaluation of complex rule hierarchies
 * - Bidirectional entity matching (from/to relationships)
 * - Configuration-based rule processing
 *
 * @example
 * ```typescript
 * const engine = new RuleEngine();
 *
 * // Find matching entities
 * const matches = await engine.findMatchingFrom(entities, rules);
 *
 * // Process a complete matching configuration
 * const result = await engine.processConfig(config, entities);
 * ```
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
	 * All rules must evaluate to true for an entity to be considered a match.
	 *
	 * @param {Entity[]} entities - Array of entities to evaluate
	 * @param {Rule[]} rules - Array of rules to apply
	 * @returns {Promise<Entity[]>} Array of matching entities
	 *
	 * @example
	 * ```typescript
	 * const rules = [{
	 *   attributes: {
	 *     role: { eq: 'admin' },
	 *     age: { gte: 18 }
	 *   }
	 * }];
	 *
	 * const matches = await engine.findMatchingFrom(users, rules);
	 * ```
	 */
	async findMatchingFrom(entities: Entity[], rules: Rule[]): Promise<Entity[]> {
		const results = await this.processBatch(entities, rules);
		return entities.filter((_, index) => results[index]);
	}

	/**
	 * Finds target entities that can be matched with source entities based on 'to' rules.
	 * Excludes source entities from the potential matches and evaluates remaining entities.
	 *
	 * @param {Entity[]} fromEntities - Array of source entities
	 * @param {Rule[]} toRules - Rules to apply to potential target entities
	 * @param {Entity[]} allEntities - Complete set of entities to search within
	 * @returns {Promise<Entity[]>} Array of matching target entities
	 *
	 * @example
	 * ```typescript
	 * const toRules = [{
	 *   attributes: {
	 *     status: { eq: 'active' },
	 *     type: { in: ['project', 'task'] }
	 *   }
	 * }];
	 *
	 * const targets = await engine.findMatchingTo(sourceUsers, toRules, allEntities);
	 * ```
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
	 * Internal method to process entities in batches for efficient memory usage.
	 * Splits large entity arrays into smaller chunks for processing.
	 *
	 * @private
	 * @param {Entity[]} entities - Array of entities to process
	 * @param {Rule[]} rules - Rules to apply to each entity
	 * @returns {Promise<boolean[]>} Array of boolean results indicating matches
	 *
	 * @remarks
	 * - Uses maxBatchSize from config to determine batch size
	 * - Processes each batch concurrently using Promise.all
	 * - Evaluates each entity against all rules (AND condition)
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
	 * Processes a complete matching configuration to find both source and target entities.
	 * Evaluates the entire ruleset and returns matching entity pairs.
	 *
	 * @param {MatchingConfig} config - Configuration containing rules and metadata
	 * @param {Entity[]} entities - Array of entities to evaluate
	 * @returns {Promise<{ fromEntities: Entity[]; toEntities: Entity[] }>} Matching entity pairs
	 *
	 * @remarks
	 * - Checks if configuration is active before processing
	 * - Returns empty arrays if configuration is inactive
	 * - Processes 'from' rules first, then 'to' rules
	 *
	 * @example
	 * ```typescript
	 * const config: MatchingConfig = {
	 *   id: 'config-1',
	 *   name: 'User-Project Matching',
	 *   isActive: true,
	 *   ruleSet: {
	 *     fromRules: [{ attributes: { role: { eq: 'manager' } } }],
	 *     toRules: [{ attributes: { status: { eq: 'active' } } }]
	 *   },
	 *   createdAt: new Date(),
	 *   updatedAt: new Date()
	 * };
	 *
	 * const { fromEntities, toEntities } = await engine.processConfig(config, entities);
	 * ```
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
