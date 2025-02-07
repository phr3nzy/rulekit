import type { Rule, RuleValue, ComparisonOperator, RuleSet, MatchingConfig } from './types';
import { ComparisonOperators } from './types';

/**
 * Custom error class for rule validation failures.
 * Provides specific error messages for validation issues.
 *
 * @class RuleValidationError
 * @extends Error
 *
 * @example
 * ```typescript
 * throw new RuleValidationError('Invalid operator type');
 * // Error: "Rule validation failed: Invalid operator type"
 * ```
 */
export class RuleValidationError extends Error {
	constructor(message: string) {
		super(`Rule validation failed: ${message}`);
		this.name = 'RuleValidationError';
	}
}

/**
 * Type guard to validate rule values.
 * Ensures values match the expected RuleValue type.
 *
 * @param {unknown} value - Value to validate
 * @returns {boolean} True if value is a valid rule value
 *
 * @remarks
 * Valid rule values are:
 * - Strings
 * - Numbers
 * - Booleans
 * - Arrays of strings or numbers
 *
 * @example
 * ```typescript
 * isValidRuleValue('admin') // true
 * isValidRuleValue(123) // true
 * isValidRuleValue(['a', 'b']) // true
 * isValidRuleValue({ key: 'value' }) // false
 * ```
 */
function isValidRuleValue(value: unknown): value is RuleValue {
	if (value === undefined || value === null) return false;

	if (Array.isArray(value)) {
		return value.every(item => typeof item === 'string' || typeof item === 'number');
	}

	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

/**
 * Validates an operator and its associated value.
 * Ensures operator-value combinations are valid.
 *
 * @param {ComparisonOperator} operator - The operator to validate
 * @param {unknown} value - The value to validate against the operator
 * @throws {RuleValidationError} If validation fails
 *
 * @remarks
 * Validation rules:
 * - Numeric operators (gt, gte, lt, lte) require number values
 * - Array operators (in, notIn) require array values
 * - All values must be valid rule values
 *
 * @example
 * ```typescript
 * validateOperator('gt', 100) // valid
 * validateOperator('in', ['admin', 'user']) // valid
 * validateOperator('gt', 'string') // throws error
 * ```
 */
function validateOperator(operator: ComparisonOperator, value: unknown): void {
	if (!isValidRuleValue(value)) {
		throw new RuleValidationError(`Invalid value type for operator "${operator}"`);
	}

	// Validate numeric operators
	if (['gt', 'gte', 'lt', 'lte'].includes(operator)) {
		if (typeof value !== 'number') {
			throw new RuleValidationError(`Operator "${operator}" requires a numeric value`);
		}
	}

	// Validate array operators
	if (['in', 'notIn'].includes(operator)) {
		if (!Array.isArray(value)) {
			throw new RuleValidationError(`Operator "${operator}" requires an array value`);
		}
	}
}

/**
 * Validates a filter object containing operators and values.
 * Ensures all operators and their values are valid.
 *
 * @param {Record<string, unknown>} filter - The filter to validate
 * @throws {RuleValidationError} If validation fails
 *
 * @remarks
 * - Must contain at least one operator
 * - All operators must be valid ComparisonOperators
 * - All values must be valid for their operators
 *
 * @example
 * ```typescript
 * validateFilter({ eq: 'admin' }) // valid
 * validateFilter({ gt: 100, lte: 200 }) // valid
 * validateFilter({}) // throws error
 * ```
 */
function validateFilter(filter: Record<string, unknown>): void {
	const operators = Object.keys(filter) as ComparisonOperator[];

	if (operators.length === 0) {
		throw new RuleValidationError('Filter must contain at least one operator');
	}

	for (const operator of operators) {
		if (!Object.values(ComparisonOperators).includes(operator)) {
			throw new RuleValidationError(`Invalid operator "${operator}"`);
		}

		validateOperator(operator, filter[operator]);
	}
}

/**
 * Type assertion function to validate a rule structure.
 * Ensures the rule matches the Rule type definition.
 *
 * @param {unknown} rule - The rule to validate
 * @throws {RuleValidationError} If validation fails
 *
 * @remarks
 * Validates:
 * - Rule structure (must be an object)
 * - AND/OR conditions (must be arrays)
 * - Nested rules (recursive validation)
 * - Filters (operator/value validation)
 *
 * @example
 * ```typescript
 * validateRule({
 *   and: [
 *     { role: { eq: 'admin' } },
 *     { status: { in: ['active', 'pending'] } }
 *   ]
 * }) // valid
 * ```
 */
export function validateRule(rule: unknown): asserts rule is Rule {
	if (typeof rule !== 'object' || rule === null) {
		throw new RuleValidationError('Rule must be an object');
	}

	const ruleObj = rule as Record<string, unknown>;

	// Validate AND conditions
	if ('and' in ruleObj) {
		if (!Array.isArray(ruleObj.and)) {
			throw new RuleValidationError('AND conditions must be an array');
		}
		ruleObj.and.forEach(subRule => validateRule(subRule));
	}

	// Validate OR conditions
	if ('or' in ruleObj) {
		if (!Array.isArray(ruleObj.or)) {
			throw new RuleValidationError('OR conditions must be an array');
		}
		ruleObj.or.forEach(subRule => validateRule(subRule));
	}

	// Validate filters
	const filters = Object.entries(ruleObj).filter(([key]) => !['and', 'or'].includes(key));
	filters.forEach(([, filter]) => {
		if (typeof filter !== 'object' || filter === null) {
			throw new RuleValidationError('Filter must be an object');
		}
		validateFilter(filter as Record<string, unknown>);
	});
}

/**
 * Type assertion function to validate a rule set structure.
 * Ensures the rule set contains valid from/to rules.
 *
 * @param {unknown} ruleSet - The rule set to validate
 * @throws {RuleValidationError} If validation fails
 *
 * @remarks
 * Validates:
 * - Rule set structure (must be an object)
 * - From rules (must be non-empty array)
 * - To rules (must be non-empty array)
 * - All rules in both arrays
 *
 * @example
 * ```typescript
 * validateRuleSet({
 *   fromRules: [{ role: { eq: 'admin' } }],
 *   toRules: [{ status: { eq: 'active' } }]
 * }) // valid
 * ```
 */
export function validateRuleSet(ruleSet: unknown): asserts ruleSet is RuleSet {
	if (typeof ruleSet !== 'object' || ruleSet === null) {
		throw new RuleValidationError('Rule set must be an object');
	}

	const { fromRules, toRules } = ruleSet as Record<string, unknown>;

	if (!Array.isArray(fromRules) || fromRules.length === 0) {
		throw new RuleValidationError('From rules must be a non-empty array');
	}

	if (!Array.isArray(toRules) || toRules.length === 0) {
		throw new RuleValidationError('To rules must be a non-empty array');
	}

	fromRules.forEach(rule => validateRule(rule));
	toRules.forEach(rule => validateRule(rule));
}

/**
 * Type assertion function to validate a matching configuration.
 * Ensures the configuration contains all required fields with valid values.
 *
 * @param {unknown} config - The configuration to validate
 * @throws {RuleValidationError} If validation fails
 *
 * @remarks
 * Validates:
 * - Configuration structure (must be an object)
 * - Required fields (id, name, ruleSet, isActive, dates)
 * - Optional fields (description)
 * - Field types and constraints
 * - Rule set validity
 *
 * @example
 * ```typescript
 * validateMatchingConfig({
 *   id: 'config-1',
 *   name: 'Admin Rules',
 *   ruleSet: {
 *     fromRules: [{ role: { eq: 'admin' } }],
 *     toRules: [{ status: { eq: 'active' } }]
 *   },
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * }) // valid
 * ```
 */
export function validateMatchingConfig(config: unknown): asserts config is MatchingConfig {
	if (typeof config !== 'object' || config === null) {
		throw new RuleValidationError('Config must be an object');
	}

	const { id, name, description, ruleSet, isActive, createdAt, updatedAt } = config as Record<
		string,
		unknown
	>;

	if (typeof id !== 'string' || id.length === 0) {
		throw new RuleValidationError('Config must have a non-empty string id');
	}

	if (typeof name !== 'string' || name.length === 0) {
		throw new RuleValidationError('Config must have a non-empty string name');
	}

	if (description !== undefined && (typeof description !== 'string' || description.length === 0)) {
		throw new RuleValidationError('Description must be a non-empty string if provided');
	}

	validateRuleSet(ruleSet);

	if (typeof isActive !== 'boolean') {
		throw new RuleValidationError('isActive must be a boolean');
	}

	if (!(createdAt instanceof Date)) {
		throw new RuleValidationError('createdAt must be a Date');
	}

	if (!(updatedAt instanceof Date)) {
		throw new RuleValidationError('updatedAt must be a Date');
	}
}
