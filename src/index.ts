/**
 * RuleKit - A powerful and flexible toolkit for building rule-based matching and filtering systems
 * @packageDocumentation
 */

// Main exports (v3 type-safe API)
export * from './v3';

// Legacy v2 exports (for backward compatibility)
import * as v2Types from './core/models/types';
import * as v2Validation from './core/models/validation';
import * as v2AttributeTypes from './core/attributes/types';
import * as v2AttributeRegistry from './core/attributes/registry';
import * as v2AttributeValidator from './core/attributes/validator';
import * as v2EvaluatorTypes from './core/evaluators/types';
import * as v2RuleEvaluator from './core/evaluators/base-rule-evaluator';
import * as v2RuleEngine from './core/services/rule-engine';
import * as v2UiTypes from './core/ui/types';
import * as v2UiConverter from './core/ui/converter';
import * as v2UiExample from './core/ui/example';

// Export v2 as a namespace for legacy users
export const v2 = {
	...v2Types,
	validation: v2Validation,
	attributeTypes: v2AttributeTypes,
	attributeRegistry: v2AttributeRegistry,
	attributeValidator: v2AttributeValidator,
	evaluatorTypes: v2EvaluatorTypes,
	ruleEvaluator: v2RuleEvaluator,
	ruleEngine: v2RuleEngine,
	uiTypes: v2UiTypes,
	uiConverter: v2UiConverter,
	uiExample: v2UiExample,
};
