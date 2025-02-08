/**
 * RuleKit v3 - Type-safe rule engine
 * @packageDocumentation
 */

export * from './types/schema';
export * from './engine/rule-engine';

// Re-export core types for backward compatibility
export {
	AttributeType,
	type AttributeTypeValue,
	type ValidationRule,
	type AttributeDefinition,
	type AttributeRegistry,
} from '../core/attributes/types';
