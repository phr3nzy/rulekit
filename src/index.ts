/**
 * RuleKit - A type-safe rule engine for entity matching and filtering
 * @packageDocumentation
 */

// Core type exports
export type {
	Entity,
	Rule,
	RuleSet,
	MatchingConfig,
	ComparisonOperator,
	RuleValue,
	BaseFilter,
} from './core/models/types';

// Core functionality exports
export { ComparisonOperators } from './core/models/types';
export * from './core/models/validation';
export { RuleEngine } from './core/services/rule-engine';

// Attribute system exports
export * from './core/attributes/types';
export * from './core/attributes/registry';
export * from './core/attributes/validator';

// Rule evaluation exports
export * from './core/evaluators/types';
export * from './core/evaluators/base-rule-evaluator';

// Interface-agnostic components exports
export * from './core/interface/components/types';
export { InterfaceOperators } from './core/interface/components/operators';
export * from './core/interface/adapters/types';
export * from './core/interface/converters/rule-converter';

// Data analysis exports
export * from './core/analysis/types';
export * from './core/analysis/analyzer';

/**
 * @deprecated Use interface-agnostic components instead
 * These exports will be removed in the next major version
 */
export * from './core/ui/types';
export * from './core/ui/converter';

// V3 exports (latest version)
export * from './v3';

// Legacy v2 namespace export
export { v2 } from './v2';
