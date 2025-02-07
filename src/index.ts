// Core types
export type { Entity } from './core/models/types';
export type {
	Rule,
	MatchingConfig,
	RuleSet,
	ComparisonOperator,
	RuleValue,
	BaseFilter,
} from './core/models/types';
export { ComparisonOperators } from './core/models/types';

// Attribute types and validation
export { AttributeType } from './core/attributes/types';
export type {
	AttributeTypeValue,
	ValidationRule,
	AttributeDefinition,
	AttributeRegistry,
	AttributeValue,
	DynamicAttributes,
} from './core/attributes/types';
export { ProductAttributeRegistry } from './core/attributes/registry';
export { validateAttribute, AttributeValidationError } from './core/attributes/validator';

// Validation
export {
	validateRule,
	validateRuleSet,
	validateMatchingConfig,
	RuleValidationError,
} from './core/models/validation';

// Interfaces
export type { RuleEvaluator } from './core/evaluators/types';

// Implementations
export { BaseRuleEvaluator } from './core/evaluators/base-rule-evaluator';
export { RuleEngine } from './core/services/rule-engine';

// UI Configuration
export type {
	UIRuleConfiguration,
	UIMatchingRule,
	UIFilter,
	UICondition,
	UIConditionTypeValue,
	UIComponentTypeValue,
} from './core/ui/types';
export { UIConditionType, UIComponentType, UIConfigurationError } from './core/ui/types';
export { convertUIConfigurationToRules, validateUIConfiguration } from './core/ui/converter';
