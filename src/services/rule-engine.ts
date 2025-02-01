import jsonLogic, { RulesLogic } from 'json-logic-js';
import { Rule, CrossSellingRuleSet } from '../types/rules';
import { ICache, InMemoryCache, CacheConfig } from '../types/cache';
import { createHash } from 'crypto';

export type Product = {
	id: string;
	name: string;
	price: number;
	category: string;
	brand: string;
	[key: string]: unknown;
};

// Helper function to generate cache keys
function generateCacheKey(prefix: string, data: unknown): string {
	const hash = createHash('sha256');
	hash.update(JSON.stringify(data));
	return `${prefix}:${hash.digest('hex')}`;
}

export class RuleEngine {
	private cache: ICache;
	private config: Required<CacheConfig>;

	constructor(config: CacheConfig = {}) {
		this.config = {
			cache: config.cache ?? new InMemoryCache(),
			defaultTTL: config.defaultTTL,
			enableRuleCache: config.enableRuleCache ?? true,
			enableIndexCache: config.enableIndexCache ?? true,
			enableEvaluationCache: config.enableEvaluationCache ?? false,
		};
		this.cache = this.config.cache;
	}

	/**
	 * Clear all caches
	 */
	public async clearCaches(): Promise<void> {
		await this.cache.clear();
	}

	/**
	 * Convert our rule format to json-logic format with caching
	 */
	private async convertRuleToJsonLogic(rule: Rule): Promise<RulesLogic> {
		if (this.config.enableRuleCache) {
			const cacheKey = generateCacheKey('rule', rule);
			const cached = await this.cache.get<RulesLogic>(cacheKey);
			if (cached) return cached;
		}

		const conditions: RulesLogic[] = [];

		// Handle direct attribute comparisons
		for (const [attr, filter] of Object.entries(rule)) {
			if (attr === 'and' || attr === 'or') continue;

			for (const [op, value] of Object.entries(filter)) {
				const varRef = { var: attr };

				switch (op) {
					case 'eq':
						conditions.push({ '==': [varRef, value] });
						break;
					case 'ne':
						conditions.push({ '!=': [varRef, value] });
						break;
					case 'gt':
						conditions.push({ '>': [varRef, value] });
						break;
					case 'gte':
						conditions.push({ '>=': [varRef, value] });
						break;
					case 'lt':
						conditions.push({ '<': [varRef, value] });
						break;
					case 'lte':
						conditions.push({ '<=': [varRef, value] });
						break;
					case 'in':
						conditions.push({ in: [varRef, value] });
						break;
					case 'notIn':
						conditions.push({ '!': { in: [varRef, value] } });
						break;
				}
			}
		}

		let result: RulesLogic;

		// Handle AND/OR combinations
		if (rule.and) {
			result = { and: await Promise.all(rule.and.map(r => this.convertRuleToJsonLogic(r))) };
		} else if (rule.or) {
			result = { or: await Promise.all(rule.or.map(r => this.convertRuleToJsonLogic(r))) };
		} else if (conditions.length > 1) {
			result = { and: conditions };
		} else {
			// Handle three cases:
			// 1. Empty rule object {} -> match everything (true)
			// 2. Rule with empty conditions [{}] -> match nothing (false)
			// 3. Single condition -> use that condition
			result = conditions[0] || false;
		}

		if (this.config.enableRuleCache) {
			const cacheKey = generateCacheKey('rule', rule);
			await this.cache.set(cacheKey, result, this.config.defaultTTL);
		}

		return result;
	}

	/**
	 * Build an index for a specific attribute with caching
	 */
	private async buildIndex(
		products: Product[],
		attribute: keyof Product,
	): Promise<Map<any, Set<Product>>> {
		if (this.config.enableIndexCache) {
			const cacheKey = generateCacheKey('index', { products: products.map(p => p.id), attribute });
			const cached = await this.cache.get<[string, Product[]][]>(cacheKey);
			if (cached) {
				const index = new Map<any, Set<Product>>();
				for (const [key, products] of cached) {
					index.set(key, new Set(products));
				}
				return index;
			}
		}

		const index = new Map<any, Set<Product>>();
		for (const product of products) {
			const value = product[attribute];
			if (!index.has(value)) {
				index.set(value, new Set());
			}
			index.get(value)!.add(product);
		}

		if (this.config.enableIndexCache) {
			const cacheKey = generateCacheKey('index', { products: products.map(p => p.id), attribute });
			const serialized = Array.from(index.entries()).map(([key, products]) => [
				key,
				Array.from(products),
			]);
			await this.cache.set(cacheKey, serialized, this.config.defaultTTL);
		}

		return index;
	}

	/**
	 * Fast lookup for simple equality rules using indexes
	 */
	private async findProductsBySimpleRule(
		products: Product[],
		rule: Rule,
	): Promise<Product[] | null> {
		// Only optimize simple equality rules
		const entries = Object.entries(rule);
		if (entries.length !== 1) return null;

		const [attr, filter] = entries[0];
		if (typeof filter !== 'object' || filter === null) return null;

		const filterEntries = Object.entries(filter);
		if (filterEntries.length !== 1) return null;

		const [op, value] = filterEntries[0];
		if (op !== 'eq') return null;

		// Special handling for null/undefined values
		if (value === null) {
			return products.filter(p => p[attr] === null || p[attr] === undefined);
		}

		// Use index for lookup
		const index = await this.buildIndex(products, attr as keyof Product);
		return Array.from(index.get(value) || []);
	}

	/**
	 * Evaluate if a product matches a set of rules with caching
	 */
	private async evaluateRules(product: Product, rules: Rule[]): Promise<boolean> {
		if (this.config.enableEvaluationCache) {
			const cacheKey = generateCacheKey('eval', {
				productId: product.id,
				rules,
			});
			const cached = await this.cache.get<boolean>(cacheKey);
			if (cached !== null) return cached;
		}

		// Evaluate each rule and combine with OR
		const result = await Promise.all(
			rules.map(async rule => {
				const jsonLogicRule = await this.convertRuleToJsonLogic(rule);
				return jsonLogic.apply(jsonLogicRule, product);
			}),
		).then(results => results.some(Boolean));

		if (this.config.enableEvaluationCache) {
			const cacheKey = generateCacheKey('eval', {
				productId: product.id,
				rules,
			});
			await this.cache.set(cacheKey, result, this.config.defaultTTL);
		}

		return result;
	}

	/**
	 * Evaluate multiple products against a rule in batch with caching
	 */
	private async evaluateRulesBatch(products: Product[], rule: Rule): Promise<boolean[]> {
		const jsonLogicRule = await this.convertRuleToJsonLogic(rule);

		// Split products into chunks for parallel processing
		const chunkSize = 1000;
		const chunks: Product[][] = [];
		for (let i = 0; i < products.length; i += chunkSize) {
			chunks.push(products.slice(i, i + chunkSize));
		}

		// Process chunks in parallel
		const results = await Promise.all(
			chunks.map(async chunk => {
				if (this.config.enableEvaluationCache) {
					const cachedResults = await Promise.all(
						chunk.map(async product => {
							const cacheKey = generateCacheKey('eval', {
								productId: product.id,
								rule,
							});
							return this.cache.get<boolean>(cacheKey);
						}),
					);

					const evaluations = chunk.map((product, i) => {
						if (cachedResults[i] !== null) return cachedResults[i]!;
						const result = jsonLogic.apply(jsonLogicRule, product);
						const cacheKey = generateCacheKey('eval', {
							productId: product.id,
							rule,
						});
						this.cache.set(cacheKey, result, this.config.defaultTTL);
						return result;
					});

					return evaluations;
				}

				return chunk.map(product => jsonLogic.apply(jsonLogicRule, product));
			}),
		);

		return results.flat();
	}

	/**
	 * Find products that match the source rules
	 */
	async findSourceProducts(products: Product[], rules: Rule[]): Promise<Product[]> {
		if (products.length === 0) return [];
		if (rules.length === 0) return products; // Empty rules array matches all products

		// Try fast path for simple rules
		if (rules.length === 1) {
			const fastResult = await this.findProductsBySimpleRule(products, rules[0]);
			if (fastResult !== null) {
				return fastResult;
			}

			// Fall back to batch processing for other single rules
			const results = await this.evaluateRulesBatch(products, rules[0]);
			return products.filter((_, index) => results[index]);
		}

		// For multiple rules, process in parallel chunks
		const chunkSize = 1000;
		const chunks: Product[][] = [];
		for (let i = 0; i < products.length; i += chunkSize) {
			chunks.push(products.slice(i, i + chunkSize));
		}

		const results = await Promise.all(
			chunks.map(async (chunk: Product[]) => {
				const matches: Product[] = [];
				for (const product of chunk) {
					if (await this.evaluateRules(product, rules)) {
						matches.push(product);
					}
				}
				return matches;
			}),
		);

		return results.flat();
	}

	/**
	 * Find recommended products for a given source product
	 */
	async findRecommendedProducts(
		sourceProduct: Product,
		availableProducts: Product[],
		recommendationRules: Rule[],
	): Promise<Product[]> {
		if (recommendationRules.length === 0) return [];
		if (availableProducts.length === 0) return [];

		// Filter out the source product from recommendations first
		const potentialRecommendations = availableProducts.filter(p => p.id !== sourceProduct.id);

		// For single rule optimization
		if (recommendationRules.length === 1) {
			const results = await this.evaluateRulesBatch(
				potentialRecommendations,
				recommendationRules[0],
			);
			return potentialRecommendations.filter((_, index) => results[index]);
		}

		// For multiple rules, evaluate each rule separately and combine results
		const ruleResults = await Promise.all(
			recommendationRules.map(rule => this.evaluateRulesBatch(potentialRecommendations, rule)),
		);

		// Combine results with OR logic
		const combinedResults = potentialRecommendations.map((_, index) =>
			ruleResults.some(ruleResult => ruleResult[index]),
		);

		return potentialRecommendations.filter((_, index) => combinedResults[index]);
	}

	/**
	 * Get cross-selling recommendations for a product
	 */
	async getRecommendations(
		product: Product,
		availableProducts: Product[],
		ruleSet: CrossSellingRuleSet,
	): Promise<Product[]> {
		if (ruleSet.sourceRules.length === 0 || ruleSet.recommendationRules.length === 0) return [];
		if (availableProducts.length === 0) return [];

		// First, check if the product matches the source rules
		const isSourceProduct = await this.evaluateRules(product, ruleSet.sourceRules);

		if (!isSourceProduct) {
			return []; // Product doesn't match source rules, no recommendations
		}

		// Find recommendations based on the rules
		return this.findRecommendedProducts(product, availableProducts, ruleSet.recommendationRules);
	}

	/**
	 * Get cross-selling recommendations for multiple products
	 */
	async getBulkRecommendations(
		products: Product[],
		availableProducts: Product[],
		ruleSet: CrossSellingRuleSet,
	): Promise<Map<string, Product[]>> {
		if (ruleSet.sourceRules.length === 0 || ruleSet.recommendationRules.length === 0) {
			return new Map();
		}
		if (products.length === 0) {
			return new Map();
		}

		const recommendations = new Map<string, Product[]>();

		// Find source products using batch processing
		const sourceProducts = await this.findSourceProducts(products, ruleSet.sourceRules);

		// If we have no available products, return empty arrays for each source product
		if (availableProducts.length === 0) {
			for (const sourceProduct of sourceProducts) {
				recommendations.set(sourceProduct.id, []);
			}
			return recommendations;
		}

		// Pre-filter available products to exclude source products
		const sourceProductIds = new Set(sourceProducts.map(p => p.id));
		const filteredAvailableProducts = availableProducts.filter(p => !sourceProductIds.has(p.id));

		// Process recommendations in parallel
		const results = await Promise.all(
			sourceProducts.map(async sourceProduct => {
				const productRecommendations = await this.findRecommendedProducts(
					sourceProduct,
					filteredAvailableProducts,
					ruleSet.recommendationRules,
				);
				return [sourceProduct.id, productRecommendations] as const;
			}),
		);

		// Build the final map
		for (const [id, recs] of results) {
			recommendations.set(id, recs);
		}

		return recommendations;
	}
}
