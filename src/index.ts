// Core exports
export type {
	Entity,
	Rule,
	RuleSet,
	MatchingConfig,
	ComparisonOperator,
	RuleValue,
	BaseFilter,
} from './core/models/types';
export { ComparisonOperators } from './core/models/types';
export * from './core/models/validation';
export { RuleEngine } from './core/services/rule-engine';
export * from './core/attributes/types';
export * from './core/attributes/registry';
export * from './core/attributes/validator';
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

// Legacy UI exports (deprecated)
/** @deprecated Use interface-agnostic components instead */
export * from './core/ui/types';
/** @deprecated Use interface-agnostic components instead */
export * from './core/ui/converter';

// V3 exports
export * from './v3';

// Legacy v2 namespace export
import * as validation from './core/models/validation';
import { RuleEngine as Engine } from './core/services/rule-engine';
import { ComparisonOperators as CoreOperators } from './core/models/types';

export const v2 = {
	ruleEngine: Engine,
	validation,
	ComparisonOperators: CoreOperators,
};
