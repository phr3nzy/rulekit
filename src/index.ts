/**
 * RuleKit - A powerful and flexible toolkit for building rule-based matching and filtering systems
 * @packageDocumentation
 */

// Legacy v2 exports (for backward compatibility)
export * from './core/models/types';
export * from './core/models/validation';
export * from './core/attributes/types';
export * from './core/attributes/registry';
export * from './core/attributes/validator';
export * from './core/evaluators/types';
export * from './core/evaluators/base-rule-evaluator';
export * from './core/services/rule-engine';
export * from './core/ui/types';
export * from './core/ui/converter';
export * from './core/ui/example';

// v3 exports (new type-safe API)
export * as v3 from './v3';

// Export v3 as the default export for new users
import * as v3Export from './v3';
export default {
	v3: v3Export,
};
