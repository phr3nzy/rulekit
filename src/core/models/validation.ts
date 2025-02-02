import type {
	Rule,
	RuleValue,
	ComparisonOperator,
	CrossSellingRuleSet,
	CrossSellingConfig,
} from './types';
import { ComparisonOperators } from './types';

export class RuleValidationError extends Error {
	constructor(message: string) {
		super(`Rule validation failed: ${message}`);
		this.name = 'RuleValidationError';
	}
}

function isValidRuleValue(value: unknown): value is RuleValue {
	if (value === undefined || value === null) return false;

	if (Array.isArray(value)) {
		return value.every(item => typeof item === 'string' || typeof item === 'number');
	}

	return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean';
}

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

export function validateCrossSellingRuleSet(
	ruleSet: unknown,
): asserts ruleSet is CrossSellingRuleSet {
	if (typeof ruleSet !== 'object' || ruleSet === null) {
		throw new RuleValidationError('Rule set must be an object');
	}

	const { sourceRules, recommendationRules } = ruleSet as Record<string, unknown>;

	if (!Array.isArray(sourceRules) || sourceRules.length === 0) {
		throw new RuleValidationError('Source rules must be a non-empty array');
	}

	if (!Array.isArray(recommendationRules) || recommendationRules.length === 0) {
		throw new RuleValidationError('Recommendation rules must be a non-empty array');
	}

	sourceRules.forEach(rule => validateRule(rule));
	recommendationRules.forEach(rule => validateRule(rule));
}

export function validateCrossSellingConfig(config: unknown): asserts config is CrossSellingConfig {
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

	validateCrossSellingRuleSet(ruleSet);

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
