// Core types
export type { Product } from './core/models/Product';
export type {
	Rule,
	CrossSellingConfig,
	CrossSellingRuleSet,
	ComparisonOperator,
	RuleValue,
	BaseFilter,
	ProductAttribute,
} from './core/models/Rule';
export { ComparisonOperators, ProductAttributes } from './core/models/Rule';

// Validation schemas
export {
	ruleSchema,
	ruleValueSchema,
	crossSellingRuleSetSchema,
	crossSellingConfigSchema,
} from './core/models/Rule';

// Interfaces
export type { ICache, CacheConfig } from './core/interfaces/ICache';
export type { IRuleEvaluator } from './core/interfaces/IRuleEvaluator';

// Implementations
export { MemoryCache } from './core/cache/MemoryCache';
export { BaseRuleEvaluator } from './core/evaluators/BaseRuleEvaluator';
export { CachedRuleEvaluator } from './core/evaluators/CachedRuleEvaluator';
export { RuleEngine } from './core/services/RuleEngine';
