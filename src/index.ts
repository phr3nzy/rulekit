/**
 * @fileoverview Main entry point for the Flamingo rule engine library.
 * Exports all public types, interfaces, and implementations.
 *
 * @module flamingo
 */

/**
 * Core entity and rule types.
 * These types form the foundation of the rule engine's type system.
 *
 * @see {@link Entity} Base entity type that rules operate on
 * @see {@link Rule} Rule structure for defining conditions
 * @see {@link MatchingConfig} Configuration for rule-based matching
 */
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

/**
 * Attribute system types and validation.
 * Provides type-safe dynamic attributes with validation.
 *
 * @see {@link AttributeType} Available attribute types
 * @see {@link AttributeDefinition} Structure for defining attributes
 * @see {@link AttributeRegistry} Registry for managing attribute definitions
 * @see {@link validateAttribute} Function to validate attribute values
 */
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

/**
 * Rule validation utilities.
 * Functions for validating rule structures and configurations.
 *
 * @see {@link validateRule} Validates individual rules
 * @see {@link validateRuleSet} Validates complete rule sets
 * @see {@link validateMatchingConfig} Validates matching configurations
 * @see {@link RuleValidationError} Error type for validation failures
 */
export {
	validateRule,
	validateRuleSet,
	validateMatchingConfig,
	RuleValidationError,
} from './core/models/validation';

/**
 * Core interfaces for rule evaluation.
 * Defines the contract for rule evaluator implementations.
 *
 * @see {@link RuleEvaluator} Interface for implementing custom rule evaluators
 */
export type { RuleEvaluator } from './core/evaluators/types';

/**
 * Core implementations of the rule engine.
 * Provides ready-to-use evaluator and engine classes.
 *
 * @see {@link BaseRuleEvaluator} Basic rule evaluator implementation
 * @see {@link RuleEngine} Main rule engine service
 */
export { BaseRuleEvaluator } from './core/evaluators/base-rule-evaluator';
export { RuleEngine } from './core/services/rule-engine';

/**
 * UI configuration system.
 * Types and utilities for building user interfaces around the rule engine.
 *
 * @see {@link UIRuleConfiguration} Structure for UI-friendly rule configuration
 * @see {@link UIConditionType} Available condition types for UI
 * @see {@link UIComponentType} Available component types for UI
 * @see {@link convertUIConfigurationToRules} Converts UI config to internal rules
 * @see {@link validateUIConfiguration} Validates UI configurations
 */
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
