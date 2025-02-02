// Core types
export type { Product } from './core/models/types';
export type {
	Rule,
	CrossSellingConfig,
	CrossSellingRuleSet,
	ComparisonOperator,
	RuleValue,
	BaseFilter,
} from './core/models/types';
export { ComparisonOperators } from './core/models/types';

// Validation
export {
	validateRule,
	validateCrossSellingRuleSet,
	validateCrossSellingConfig,
	RuleValidationError,
} from './core/models/validation';

// Interfaces
export type { CacheConfig } from './core/cache/types';
export type { RuleEvaluator } from './core/evaluators/types';

// Implementations
export { MemoryCache } from './core/cache/memory-cache';
export { BaseRuleEvaluator } from './core/evaluators/base-rule-evaluator';
export { CachedRuleEvaluator } from './core/evaluators/cached-rule-evaluator';
export { RuleEngine } from './core/services/rule-engine';
