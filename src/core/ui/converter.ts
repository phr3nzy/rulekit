import type { Rule, BaseFilter, ComparisonOperator } from '../models/types';
import { ComparisonOperators } from '../models/types';
import {
	UIConditionType,
	type UIRuleConfiguration,
	type UICondition,
	type UIFilter,
	type UIMatchingRule,
	UIConfigurationError,
	UIComponentType,
} from './types';

/**
 * Maps UI condition types to internal comparison operators based on condition type and values.
 * Handles special cases for numeric comparisons and different UI component types.
 *
 * @param {UICondition} condition - The UI condition to map
 * @returns {ComparisonOperator} The corresponding internal comparison operator
 *
 * @remarks
 * Special cases:
 * - TEXT components with max value use 'lte' operator
 * - TEXT components with min value use 'gte' operator
 * - Other conditions use a predefined operator mapping
 *
 * @example
 * ```typescript
 * const condition: UICondition = {
 *   type: UIComponentType.TEXT,
 *   max: 100,
 *   condition: UIConditionType.IS
 * };
 * const operator = getOperator(condition); // Returns 'lte'
 * ```
 */
function getOperator(condition: UICondition): ComparisonOperator {
	// Use lte for price comparisons with max value
	if (condition.type === UIComponentType.TEXT && condition.max !== undefined) {
		return ComparisonOperators.lte;
	}

	// Use gte for price comparisons with min value
	if (condition.type === UIComponentType.TEXT && condition.min !== undefined) {
		return ComparisonOperators.gte;
	}

	// Default operator mapping
	const operatorMap: Record<string, ComparisonOperator> = {
		[UIConditionType.IS]: ComparisonOperators.eq,
		[UIConditionType.IS_NOT]: ComparisonOperators.ne,
		[UIConditionType.CONTAINS]: ComparisonOperators.in,
		[UIConditionType.DOES_NOT_CONTAIN]: ComparisonOperators.notIn,
		[UIConditionType.IN]: ComparisonOperators.in,
	};

	return operatorMap[condition.condition];
}

/**
 * Converts a UI condition and its value to an internal base filter format.
 * Handles type conversions and special cases for different value types.
 *
 * @param {UICondition} condition - The UI condition to convert
 * @param {unknown} value - The value to apply in the filter
 * @returns {BaseFilter} The converted filter
 * @throws {UIConfigurationError} If condition type is unknown
 *
 * @remarks
 * - Automatically converts single values to arrays
 * - Handles numeric string conversion for price comparisons
 * - Special handling for numeric comparison operators
 *
 * @example
 * ```typescript
 * const condition: UICondition = {
 *   type: UIComponentType.TEXT,
 *   condition: UIConditionType.IS,
 *   max: 100
 * };
 * const filter = convertConditionToFilter(condition, 50);
 * // Returns: { lte: 50 }
 * ```
 */
function convertConditionToFilter(condition: UICondition, value: unknown): BaseFilter {
	const operator = getOperator(condition);
	if (!operator) {
		throw new UIConfigurationError(`Unknown condition type: ${condition.condition}`);
	}

	// Handle array values and convert numeric strings
	if (!Array.isArray(value)) {
		value = [value];
	}

	// Convert numeric strings to numbers for price comparisons
	if (condition.type === UIComponentType.TEXT && Array.isArray(value)) {
		const isPrice = condition.max !== undefined || condition.min !== undefined;
		if (isPrice && value[0] !== null) {
			const num = Number(value[0]);
			if (!isNaN(num)) {
				value = [num];
			}
		}
	}

	// For numeric operators, use the first value directly instead of an array
	if (
		(operator === ComparisonOperators.gt ||
			operator === ComparisonOperators.gte ||
			operator === ComparisonOperators.lt ||
			operator === ComparisonOperators.lte) &&
		Array.isArray(value) &&
		value.length === 1
	) {
		return {
			[operator]: value[0],
		};
	}

	return {
		[operator]: value,
	};
}

/**
 * Converts an array of UI filters to internal rule format.
 * Each filter's conditions are combined into a rule structure.
 *
 * @param {UIFilter[]} filters - Array of UI filters to convert
 * @returns {Rule[]} Array of converted internal rules
 *
 * @remarks
 * - Multiple conditions within a filter are combined with AND logic
 * - Each condition creates a rule with attributes matching the filter name
 * - Handles both single and multiple condition cases
 *
 * @example
 * ```typescript
 * const filters: UIFilter[] = [{
 *   name: 'price',
 *   conditions: [{
 *     type: UIComponentType.TEXT,
 *     condition: UIConditionType.IS,
 *     max: 100
 *   }]
 * }];
 * const rules = convertFiltersToRules(filters);
 * ```
 */
function convertFiltersToRules(filters: UIFilter[]): Rule[] {
	return filters.map(filter => {
		const rules: Rule[] = filter.conditions.map(condition => ({
			attributes: {
				[filter.name]: convertConditionToFilter(condition, condition.max ?? condition.min ?? null),
			},
		}));

		// If multiple conditions, combine with AND
		return rules.length > 1 ? { and: rules } : rules[0];
	});
}

/**
 * Converts UI matching rules to internal rule format.
 * Handles both single and multiple condition cases within each rule.
 *
 * @param {UIMatchingRule[]} rules - Array of UI matching rules to convert
 * @returns {Rule[]} Array of converted internal rules
 *
 * @remarks
 * - Multiple conditions within a rule are combined with AND logic
 * - Each condition creates a rule with attributes matching the rule name
 * - Uses rule values if provided
 *
 * @example
 * ```typescript
 * const matchingRules: UIMatchingRule[] = [{
 *   name: 'role',
 *   conditions: [{
 *     type: UIComponentType.SELECT,
 *     condition: UIConditionType.IS
 *   }],
 *   values: ['admin']
 * }];
 * const rules = convertMatchingRulesToRules(matchingRules);
 * ```
 */
function convertMatchingRulesToRules(rules: UIMatchingRule[]): Rule[] {
	return rules.map(rule => {
		const ruleConditions: Rule[] = rule.conditions.map(condition => ({
			attributes: {
				[rule.name]: convertConditionToFilter(condition, rule.values ?? null),
			},
		}));

		// If multiple conditions, combine with AND
		return ruleConditions.length > 1 ? { and: ruleConditions } : ruleConditions[0];
	});
}

/**
 * Converts a complete UI configuration to internal rule format.
 * Processes all rule types and combines them into from/to rule sets.
 *
 * @param {UIRuleConfiguration} config - The UI configuration to convert
 * @returns {{ fromRules: Rule[]; toRules: Rule[] }} Converted rule sets
 *
 * @remarks
 * Processes multiple rule types:
 * - Filters (added to fromRules)
 * - Matching From rules
 * - Matching To rules
 * - Legacy source rules (added to fromRules)
 * - Legacy recommendation rules (added to toRules)
 *
 * @example
 * ```typescript
 * const config: UIRuleConfiguration = {
 *   filters: [{
 *     name: 'price',
 *     conditions: [{ type: UIComponentType.TEXT, condition: UIConditionType.IS, max: 100 }]
 *   }],
 *   matchingFrom: [{
 *     name: 'role',
 *     conditions: [{ type: UIComponentType.SELECT, condition: UIConditionType.IS }],
 *     values: ['admin']
 *   }]
 * };
 * const { fromRules, toRules } = convertUIConfigurationToRules(config);
 * ```
 */
export function convertUIConfigurationToRules(config: UIRuleConfiguration): {
	fromRules: Rule[];
	toRules: Rule[];
} {
	const fromRules: Rule[] = [];
	const toRules: Rule[] = [];

	// Convert filters if present
	if (config.filters?.length) {
		fromRules.push(...convertFiltersToRules(config.filters));
	}

	// Convert matching rules
	if (config.matchingFrom?.length) {
		fromRules.push(...convertMatchingRulesToRules(config.matchingFrom));
	}
	if (config.matchingTo?.length) {
		toRules.push(...convertMatchingRulesToRules(config.matchingTo));
	}

	// Support backward compatibility
	if (config.source?.length) {
		fromRules.push(...convertMatchingRulesToRules(config.source));
	}
	if (config.recommendations?.length) {
		toRules.push(...convertMatchingRulesToRules(config.recommendations));
	}

	return {
		fromRules,
		toRules,
	};
}

/**
 * Validates a UI configuration for correctness and completeness.
 * Checks all required fields and relationships between rules.
 *
 * @param {UIRuleConfiguration} config - The configuration to validate
 * @throws {UIConfigurationError} If validation fails
 *
 * @remarks
 * Validates:
 * - Presence of at least one rule type
 * - Filter names and conditions
 * - Matching rule names, conditions, and values
 * - Legacy rule formats
 *
 * @example
 * ```typescript
 * const config: UIRuleConfiguration = {
 *   filters: [{
 *     name: 'price',
 *     conditions: [{ type: UIComponentType.TEXT, condition: UIConditionType.IS, max: 100 }]
 *   }]
 * };
 *
 * try {
 *   validateUIConfiguration(config);
 *   console.debug('Configuration is valid');
 * } catch (error) {
 *   if (error instanceof UIConfigurationError) {
 *     console.error('Invalid configuration:', error.message);
 *   }
 * }
 * ```
 */
export function validateUIConfiguration(config: UIRuleConfiguration): void {
	// Ensure at least one rule type is present
	if (
		!config.filters?.length &&
		!config.matchingFrom?.length &&
		!config.matchingTo?.length &&
		!config.source?.length &&
		!config.recommendations?.length
	) {
		throw new UIConfigurationError('Configuration must contain at least one rule type');
	}

	// Validate filters if present
	config.filters?.forEach(filter => {
		if (!filter.name) {
			throw new UIConfigurationError('Filter must have a name');
		}
		if (!filter.conditions?.length) {
			throw new UIConfigurationError(`Filter "${filter.name}" must have at least one condition`);
		}
	});

	// Validate matching rules
	const validateMatchingRules = (rules: UIMatchingRule[], type: string) => {
		rules.forEach(rule => {
			if (!rule.name) {
				throw new UIConfigurationError(`${type} must have a name`);
			}
			if (!rule.conditions?.length) {
				throw new UIConfigurationError(`${type} "${rule.name}" must have at least one condition`);
			}
			if (!rule.values?.length) {
				throw new UIConfigurationError(`${type} "${rule.name}" must have at least one value`);
			}
		});
	};

	// Validate all rule types
	if (config.matchingFrom?.length) {
		validateMatchingRules(config.matchingFrom, 'From');
	}
	if (config.matchingTo?.length) {
		validateMatchingRules(config.matchingTo, 'To');
	}
	if (config.source?.length) {
		validateMatchingRules(config.source, 'From');
	}
	if (config.recommendations?.length) {
		validateMatchingRules(config.recommendations, 'To');
	}
}
