import type { DynamicAttributes } from '../attributes/types';

/**
 * Represents a base entity that can be used with the rule engine.
 * Entities are the core objects that rules are evaluated against.
 *
 * @example
 * ```typescript
 * const user: Entity = {
 *   id: 'user-123',
 *   name: 'John Doe',
 *   attributes: {
 *     age: 25,
 *     role: 'admin'
 *   }
 * };
 * ```
 */
export type Entity = {
	/**
	 * Unique identifier for the entity
	 */
	id: string;

	/**
	 * Display name of the entity
	 */
	name: string;

	/**
	 * Dynamic attributes that have been validated against their definitions
	 */
	attributes: DynamicAttributes;
};

/**
 * Defines the available comparison operators for rule conditions.
 * These operators are used to compare values in rule definitions.
 *
 * @remarks
 * - eq: Equal to
 * - ne: Not equal to
 * - gt: Greater than
 * - gte: Greater than or equal to
 * - lt: Less than
 * - lte: Less than or equal to
 * - in: Value exists in array
 * - notIn: Value does not exist in array
 *
 * @example
 * ```typescript
 * const rule = {
 *   age: { [ComparisonOperators.gte]: 18 }
 * };
 * ```
 */
export const ComparisonOperators = {
	eq: 'eq',
	ne: 'ne',
	gt: 'gt',
	gte: 'gte',
	lt: 'lt',
	lte: 'lte',
	in: 'in',
	notIn: 'notIn',
} as const;

/**
 * Union type of all available comparison operators.
 * Extracted from the keys of ComparisonOperators constant.
 *
 * @see {@link ComparisonOperators} for the full list of operators
 */
export type ComparisonOperator = keyof typeof ComparisonOperators;

/**
 * Represents the valid types that can be used as values in rule conditions.
 *
 * @remarks
 * - string: For text comparisons
 * - number: For numeric comparisons
 * - boolean: For true/false conditions
 * - Array<string | number>: For 'in' and 'notIn' operators
 *
 * @example
 * ```typescript
 * const stringValue: RuleValue = 'admin';
 * const numberValue: RuleValue = 25;
 * const boolValue: RuleValue = true;
 * const arrayValue: RuleValue = ['user', 'admin'];
 * ```
 */
export type RuleValue = string | number | boolean | Array<string | number>;

/**
 * Defines the structure of a filter that can be applied using comparison operators.
 * Each key in the filter must be a valid comparison operator.
 *
 * @example
 * ```typescript
 * const ageFilter: BaseFilter = {
 *   gte: 18,
 *   lte: 65
 * };
 *
 * const roleFilter: BaseFilter = {
 *   in: ['admin', 'moderator']
 * };
 * ```
 */
export type BaseFilter = {
	[K in ComparisonOperator]?: RuleValue;
};

/**
 * Represents a single rule or a group of rules that can be combined using logical operators.
 * Rules can be nested using 'and' and 'or' operators for complex conditions.
 *
 * @remarks
 * - and: Array of rules that must all evaluate to true
 * - or: Array of rules where at least one must evaluate to true
 * - attributes: Object containing attribute-specific filters
 *
 * @example
 * ```typescript
 * const rule: Rule = {
 *   and: [
 *     { age: { gte: 18 } },
 *     {
 *       or: [
 *         { role: { eq: 'admin' } },
 *         { permissions: { in: ['manage_users'] } }
 *       ]
 *     }
 *   ]
 * };
 * ```
 */
export type Rule = {
	[key: string]: BaseFilter | Rule[] | { [key: string]: BaseFilter } | undefined;
	and?: Rule[];
	or?: Rule[];
	attributes?: { [key: string]: BaseFilter };
};

/**
 * Defines a set of rules for matching entities in a from/to relationship.
 * Used to determine if entities can be connected or related to each other.
 *
 * @remarks
 * - fromRules: Rules that must be satisfied by the source entity
 * - toRules: Rules that must be satisfied by the target entity
 *
 * @example
 * ```typescript
 * const ruleSet: RuleSet = {
 *   fromRules: [{ role: { eq: 'admin' } }],
 *   toRules: [{ status: { eq: 'active' } }]
 * };
 * ```
 */
export type RuleSet = {
	fromRules: Rule[];
	toRules: Rule[];
};

/**
 * Configuration object for defining a complete rule-based matching setup.
 * Contains metadata about the matching configuration along with its rules.
 *
 * @remarks
 * - id: Unique identifier for the configuration
 * - name: Display name for the configuration
 * - description: Optional detailed description
 * - ruleSet: The actual rules for matching
 * - isActive: Whether this configuration is currently active
 * - createdAt: Timestamp of creation
 * - updatedAt: Timestamp of last update
 *
 * @example
 * ```typescript
 * const config: MatchingConfig = {
 *   id: 'config-123',
 *   name: 'Admin User Matching',
 *   description: 'Rules for admin user relationships',
 *   ruleSet: {
 *     fromRules: [...],
 *     toRules: [...]
 *   },
 *   isActive: true,
 *   createdAt: new Date(),
 *   updatedAt: new Date()
 * };
 * ```
 */
export type MatchingConfig = {
	id: string;
	name: string;
	description?: string;
	ruleSet: RuleSet;
	isActive: boolean;
	createdAt: Date;
	updatedAt: Date;
};
