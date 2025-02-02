import type { Product, Rule, CrossSellingConfig } from '../models/types';
import { CachedRuleEvaluator } from '../evaluators/cached-rule-evaluator';
import { BaseRuleEvaluator } from '../evaluators/base-rule-evaluator';
import { MemoryCache } from '../cache/memory-cache';
import { RuleEvaluator } from '../evaluators/types';
import { Cache } from '../cache/types';

interface RuleEngineConfig {
	/**
	 * Cache implementation to use
	 * @default MemoryCache
	 */
	cache?: Cache;

	/**
	 * Rule evaluator implementation to use
	 * @default CachedRuleEvaluator
	 */
	evaluator?: RuleEvaluator;

	/**
	 * Whether to enable caching
	 * @default true
	 */
	enableCaching?: boolean;

	/**
	 * Default TTL for cached items in seconds
	 * @default 3600 (1 hour)
	 */
	cacheTTLSeconds?: number;

	/**
	 * Maximum number of products to process in a single batch
	 * @default 1000
	 */
	maxBatchSize?: number;
}

/**
 * Main RuleEngine service for product recommendations
 */
export class RuleEngine {
	private readonly evaluator: RuleEvaluator;
	private readonly config: Required<RuleEngineConfig>;

	constructor(config?: Partial<RuleEngineConfig>) {
		this.config = {
			cache: new MemoryCache(),
			evaluator: undefined as unknown as RuleEvaluator,
			enableCaching: true,
			cacheTTLSeconds: 3600,
			maxBatchSize: 1000,
			...config,
		};

		// Initialize evaluator
		this.evaluator =
			this.config.evaluator ??
			(this.config.enableCaching
				? new CachedRuleEvaluator(this.config.cache, {
						ttlSeconds: this.config.cacheTTLSeconds,
					})
				: new BaseRuleEvaluator());
	}

	/**
	 * Finds products that match the source rules
	 */
	async findSourceProducts(products: Product[], rules: Rule[]): Promise<Product[]> {
		const results = await this.processBatch(products, rules);
		return products.filter((_, index) => results[index]);
	}

	/**
	 * Finds recommended products based on source products and recommendation rules
	 */
	async findRecommendedProducts(
		sourceProducts: Product[],
		recommendationRules: Rule[],
		allProducts: Product[],
	): Promise<Product[]> {
		// First, filter out source products from all products
		const candidateProducts = allProducts.filter(
			product => !sourceProducts.some(source => source.id === product.id),
		);

		// Then find products matching recommendation rules
		const results = await this.processBatch(candidateProducts, recommendationRules);
		return candidateProducts.filter((_, index) => results[index]);
	}

	/**
	 * Processes products in batches to avoid memory issues with large datasets
	 */
	private async processBatch(products: Product[], rules: Rule[]): Promise<boolean[]> {
		const results: boolean[] = [];
		const batches = Math.ceil(products.length / this.config.maxBatchSize);

		for (let i = 0; i < batches; i++) {
			const start = i * this.config.maxBatchSize;
			const end = Math.min(start + this.config.maxBatchSize, products.length);
			const batch = products.slice(start, end);

			const batchResults = await Promise.all(
				batch.map(product => this.evaluator.evaluateRules(product, rules)),
			);

			results.push(...batchResults);
		}

		return results;
	}

	/**
	 * Processes a cross-selling configuration
	 */
	async processConfig(
		config: CrossSellingConfig,
		products: Product[],
	): Promise<{ sourceProducts: Product[]; recommendedProducts: Product[] }> {
		if (!config.isActive) {
			return { sourceProducts: [], recommendedProducts: [] };
		}

		const sourceProducts = await this.findSourceProducts(products, config.ruleSet.sourceRules);
		const recommendedProducts = await this.findRecommendedProducts(
			sourceProducts,
			config.ruleSet.recommendationRules,
			products,
		);

		return { sourceProducts, recommendedProducts };
	}

	/**
	 * Clears the evaluator's cache
	 */
	async clearCache(): Promise<void> {
		await this.evaluator.clear();
	}
}
