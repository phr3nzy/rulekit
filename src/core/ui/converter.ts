import type { Rule, BaseFilter, ComparisonOperator } from '../models/types';
import { ComparisonOperators } from '../models/types';
import {
	UIConditionType,
	type UIRuleConfiguration,
	type UICondition,
	type UIFilter,
	type UISource,
	type UIRecommendation,
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

	// For eq/ne/gt/gte/lt/lte operators, use the first value directly instead of an array
	if (
		(operator === ComparisonOperators.eq ||
			operator === ComparisonOperators.ne ||
			operator === ComparisonOperators.gt ||
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
 * Converts UI source configuration to internal rules
 */
function convertSourceToRules(sources: UISource[]): Rule[] {
	return sources.map(source => {
		const rules: Rule[] = source.conditions.map(condition => ({
			attributes: {
				[source.name]: convertConditionToFilter(condition, source.values ?? null),
			},
		}));

		// If multiple conditions, combine with AND
		return rules.length > 1 ? { and: rules } : rules[0];
	});
}

/**
 * Converts UI recommendations to internal rules
 */
function convertRecommendationsToRules(recommendations: UIRecommendation[]): Rule[] {
	return recommendations.map(recommendation => {
		const rules: Rule[] = recommendation.conditions.map(condition => ({
			attributes: {
				[recommendation.name]: convertConditionToFilter(condition, recommendation.value ?? null),
			},
		}));

		// If multiple conditions, combine with AND
		return rules.length > 1 ? { and: rules } : rules[0];
	});
}

/**
 * Converts a UI configuration to internal rules
 */
export function convertUIConfigurationToRules(config: UIRuleConfiguration): {
	sourceRules: Rule[];
	recommendationRules: Rule[];
} {
	const sourceRules: Rule[] = [];
	const recommendationRules: Rule[] = [];

	// Convert filters if present
	if (config.filters?.length) {
		sourceRules.push(...convertFiltersToRules(config.filters));
	}

	// Convert source rules if present
	if (config.source?.length) {
		sourceRules.push(...convertSourceToRules(config.source));
	}

	// Convert recommendation rules if present
	if (config.recommendations?.length) {
		recommendationRules.push(...convertRecommendationsToRules(config.recommendations));
	}

	return {
		sourceRules,
		recommendationRules,
	};
}

/**
 * Validates a UI configuration
 */
export function validateUIConfiguration(config: UIRuleConfiguration): void {
	// Ensure at least one rule type is present
	if (!config.filters?.length && !config.source?.length && !config.recommendations?.length) {
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

	// Validate source rules if present
	config.source?.forEach(source => {
		if (!source.name) {
			throw new UIConfigurationError('Source must have a name');
		}
		if (!source.conditions?.length) {
			throw new UIConfigurationError(`Source "${source.name}" must have at least one condition`);
		}
	});

	// Validate recommendation rules if present
	config.recommendations?.forEach(recommendation => {
		if (!recommendation.name) {
			throw new UIConfigurationError('Recommendation must have a name');
		}
		if (!recommendation.conditions?.length) {
			throw new UIConfigurationError(
				`Recommendation "${recommendation.name}" must have at least one condition`,
			);
		}
		if (!recommendation.value?.length) {
			throw new UIConfigurationError(
				`Recommendation "${recommendation.name}" must have at least one value`,
			);
		}
	});
}
