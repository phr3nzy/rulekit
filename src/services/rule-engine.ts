import jsonLogic, { RulesLogic } from 'json-logic-js';
import { Rule, CrossSellingRuleSet } from '../types/rules';

export type Product = {
	id: string;
	name: string;
	price: number;
	category: string;
	brand: string;
	[key: string]: unknown;
};

// Convert our rule format to json-logic format
function convertRuleToJsonLogic(rule: Rule): RulesLogic {
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

	// Handle AND/OR combinations
	if (rule.and) {
		return { and: rule.and.map(convertRuleToJsonLogic) };
	}
	if (rule.or) {
		return { or: rule.or.map(convertRuleToJsonLogic) };
	}

	// If we have multiple conditions for a single rule, AND them together
	if (conditions.length > 1) {
		return { and: conditions };
	}

	// Return the single condition if we have one, otherwise return true
	return conditions[0] || true;
}

export class RuleEngine {
	/**
	 * Evaluate if a product matches a set of rules
	 */
	private evaluateRules(product: Product, rules: Rule[]): boolean {
		return rules.some(rule => {
			const jsonLogicRule = convertRuleToJsonLogic(rule);
			return jsonLogic.apply(jsonLogicRule, product);
		});
	}

	/**
	 * Find products that match the source rules
	 */
	findSourceProducts(products: Product[], rules: Rule[]): Product[] {
		return products.filter(product => this.evaluateRules(product, rules));
	}

	/**
	 * Find recommended products for a given source product
	 */
	findRecommendedProducts(
		sourceProduct: Product,
		availableProducts: Product[],
		recommendationRules: Rule[],
	): Product[] {
		// Filter out the source product from recommendations
		const potentialRecommendations = availableProducts.filter(p => p.id !== sourceProduct.id);

		return potentialRecommendations.filter(product =>
			this.evaluateRules(product, recommendationRules),
		);
	}

	/**
	 * Get cross-selling recommendations for a product
	 */
	getRecommendations(
		product: Product,
		availableProducts: Product[],
		ruleSet: CrossSellingRuleSet,
	): Product[] {
		// First, check if the product matches the source rules
		const isSourceProduct = this.evaluateRules(product, ruleSet.sourceRules);

		if (!isSourceProduct) {
			return []; // Product doesn't match source rules, no recommendations
		}

		// Find recommendations based on the rules
		return this.findRecommendedProducts(product, availableProducts, ruleSet.recommendationRules);
	}

	/**
	 * Get cross-selling recommendations for multiple products
	 */
	getBulkRecommendations(
		products: Product[],
		availableProducts: Product[],
		ruleSet: CrossSellingRuleSet,
	): Map<string, Product[]> {
		const recommendations = new Map<string, Product[]>();

		// Find source products
		const sourceProducts = this.findSourceProducts(products, ruleSet.sourceRules);

		// Get recommendations for each source product
		for (const sourceProduct of sourceProducts) {
			const productRecommendations = this.findRecommendedProducts(
				sourceProduct,
				availableProducts,
				ruleSet.recommendationRules,
			);
			recommendations.set(sourceProduct.id, productRecommendations);
		}

		return recommendations;
	}
}
