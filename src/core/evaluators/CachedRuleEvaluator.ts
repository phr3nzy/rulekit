import type { Product } from '../models/Product';
import type { Rule } from '../models/Rule';
import type { ICache } from '../interfaces/ICache';
import { BaseRuleEvaluator } from './BaseRuleEvaluator';

/**
 * Cached implementation of RuleEvaluator
 */
export class CachedRuleEvaluator extends BaseRuleEvaluator {
	private readonly cache: ICache;
	private readonly keyPrefix: string;
	private readonly ttlSeconds?: number;

	constructor(cache: ICache, options?: { keyPrefix?: string; ttlSeconds?: number }) {
		super();
		this.cache = cache;
		this.keyPrefix = options?.keyPrefix ?? 'rule_eval:';
		this.ttlSeconds = options?.ttlSeconds;
	}

	/**
	 * Evaluates a single product against a rule with caching
	 */
	async evaluateRule(product: Product, rule: Rule): Promise<boolean> {
		const cacheKey = this.getCacheKey(product, rule);
		const cachedResult = await this.cache.get<boolean>(cacheKey);

		if (cachedResult !== null) {
			return cachedResult;
		}

		const result = await super.evaluateRule(product, rule);
		await this.cache.set(cacheKey, result, this.ttlSeconds);

		return result;
	}

	/**
	 * Evaluates multiple products against a single rule with caching
	 */
	async evaluateRuleBatch(products: Product[], rule: Rule): Promise<boolean[]> {
		const results: boolean[] = [];
		const uncachedProducts: Product[] = [];
		const uncachedIndices: number[] = [];

		// Try to get cached results first
		await Promise.all(
			products.map(async (product, index) => {
				const cacheKey = this.getCacheKey(product, rule);
				const cachedResult = await this.cache.get<boolean>(cacheKey);

				if (cachedResult !== null) {
					results[index] = cachedResult;
				} else {
					uncachedProducts.push(product);
					uncachedIndices.push(index);
				}
			}),
		);

		// Evaluate uncached products
		if (uncachedProducts.length > 0) {
			const uncachedResults = await super.evaluateRuleBatch(uncachedProducts, rule);

			// Cache results and fill in the gaps
			await Promise.all(
				uncachedProducts.map(async (product, index) => {
					const result = uncachedResults[index];
					const cacheKey = this.getCacheKey(product, rule);
					await this.cache.set(cacheKey, result, this.ttlSeconds);
					results[uncachedIndices[index]] = result;
				}),
			);
		}

		return results;
	}

	/**
	 * Evaluates a single product against multiple rules with caching
	 */
	async evaluateRules(product: Product, rules: Rule[]): Promise<boolean> {
		const results = await Promise.all(rules.map(rule => this.evaluateRule(product, rule)));
		return results.some(Boolean);
	}

	/**
	 * Clears the cache
	 */
	async clear(): Promise<void> {
		await this.cache.clear();
	}

	/**
	 * Generates a cache key for a product-rule pair
	 */
	private getCacheKey(product: Product, rule: Rule): string {
		// Use a combination of product ID and stringified rule as the cache key
		return `${this.keyPrefix}${product.id}:${JSON.stringify(rule)}`;
	}
}
