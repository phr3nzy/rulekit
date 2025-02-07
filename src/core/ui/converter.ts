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
 * Maps UI condition types to internal comparison operators
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
 * Converts a UI condition to an internal base filter
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
 * Converts UI filters to internal rules
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
 * Converts UI matching rules to internal rules
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
 * Converts a UI configuration to internal rules
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
 * Validates a UI configuration
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
