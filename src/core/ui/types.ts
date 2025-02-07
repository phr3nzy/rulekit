/**
 * Defines the available condition types for UI rule configuration.
 * These types represent different ways to compare values in the UI.
 *
 * @remarks
 * - IS: Direct equality comparison
 * - IS_NOT: Negated equality comparison
 * - CONTAINS: Substring or element inclusion
 * - DOES_NOT_CONTAIN: Negated substring or element inclusion
 * - IN: Membership in a set of values
 *
 * @example
 * ```typescript
 * const condition = {
 *   condition: UIConditionType.CONTAINS,
 *   type: UIComponentType.TEXT
 * };
 * ```
 */
export const UIConditionType = {
	IS: 'Is',
	IS_NOT: 'IsNot',
	CONTAINS: 'Contains',
	DOES_NOT_CONTAIN: 'DoesNotContain',
	IN: 'In',
} as const;

export type UIConditionTypeValue = (typeof UIConditionType)[keyof typeof UIConditionType];

/**
 * Defines the available UI component types for rendering rule conditions.
 * Each type represents a different form input or selection component.
 *
 * @remarks
 * - SELECT: Single-select dropdown
 * - TEXT: Text input field
 * - OPTIONS: Radio button or checkbox group
 * - MULTISELECTOR: Multi-select dropdown or list
 *
 * @example
 * ```typescript
 * const component = {
 *   type: UIComponentType.SELECT,
 *   // Component-specific props
 * };
 * ```
 */
export const UIComponentType = {
	SELECT: 'select',
	TEXT: 'text',
	OPTIONS: 'options',
	MULTISELECTOR: 'MULTISELECTOR',
} as const;

export type UIComponentTypeValue = (typeof UIComponentType)[keyof typeof UIComponentType];

/**
 * Represents a single condition configuration for UI rendering.
 * Defines how a condition should be displayed and validated.
 *
 * @interface UICondition
 *
 * @property {UIConditionTypeValue} condition - Type of condition to apply
 * @property {number} [min] - Optional minimum value for numeric inputs
 * @property {number} [max] - Optional maximum value for numeric inputs
 * @property {UIComponentTypeValue} type - Primary component type for rendering
 * @property {UIComponentTypeValue} [component] - Optional override component type
 *
 * @example
 * ```typescript
 * const numericCondition: UICondition = {
 *   condition: UIConditionType.IS,
 *   min: 0,
 *   max: 100,
 *   type: UIComponentType.TEXT
 * };
 *
 * const selectCondition: UICondition = {
 *   condition: UIConditionType.IN,
 *   type: UIComponentType.SELECT
 * };
 * ```
 */
export type UICondition = {
	condition: UIConditionTypeValue;
	min?: number;
	max?: number;
	type: UIComponentTypeValue;
	component?: UIComponentTypeValue;
};

/**
 * Defines a named filter with associated conditions for UI rendering.
 * Groups related conditions under a single filter configuration.
 *
 * @interface UIFilter
 *
 * @property {string} name - Display name of the filter
 * @property {Record<string, unknown>} [meta] - Optional metadata for the filter
 * @property {UICondition[]} conditions - Array of conditions for this filter
 *
 * @example
 * ```typescript
 * const userFilter: UIFilter = {
 *   name: 'User Filter',
 *   meta: { category: 'user', priority: 1 },
 *   conditions: [
 *     {
 *       condition: UIConditionType.IS,
 *       type: UIComponentType.SELECT,
 *       // Additional condition props
 *     }
 *   ]
 * };
 * ```
 */
export type UIFilter = {
	name: string;
	meta?: Record<string, unknown>;
	conditions: UICondition[];
};

/**
 * Represents a rule for matching entities with specific conditions.
 * Used for both source and target entity matching.
 *
 * @interface UIMatchingRule
 *
 * @property {string} name - Display name of the rule
 * @property {UICondition[]} conditions - Conditions to evaluate
 * @property {string[]} [values] - Optional preset values for conditions
 *
 * @example
 * ```typescript
 * const adminRule: UIMatchingRule = {
 *   name: 'Admin Users',
 *   conditions: [
 *     {
 *       condition: UIConditionType.IS,
 *       type: UIComponentType.SELECT,
 *       // Additional condition props
 *     }
 *   ],
 *   values: ['admin', 'superadmin']
 * };
 * ```
 */
export type UIMatchingRule = {
	name: string;
	conditions: UICondition[];
	values?: string[];
};

/**
 * Defines the complete UI configuration structure for rule-based matching.
 * Contains all necessary configuration for rendering rule builders and filters.
 *
 * @interface UIRuleConfiguration
 *
 * @property {UIFilter[]} [filters] - Available filters for rule building
 * @property {UIMatchingRule[]} [matchingFrom] - Rules for source entity matching
 * @property {UIMatchingRule[]} [matchingTo] - Rules for target entity matching
 * @property {UIMatchingRule[]} [source] - Legacy property for source rules
 * @property {UIMatchingRule[]} [recommendations] - Legacy property for recommendations
 *
 * @remarks
 * The source and recommendations properties are maintained for backward compatibility.
 * New implementations should use matchingFrom and matchingTo.
 *
 * @example
 * ```typescript
 * const config: UIRuleConfiguration = {
 *   filters: [{
 *     name: 'Role Filter',
 *     conditions: [{
 *       condition: UIConditionType.IS,
 *       type: UIComponentType.SELECT
 *     }]
 *   }],
 *   matchingFrom: [{
 *     name: 'Admin Rule',
 *     conditions: [{
 *       condition: UIConditionType.IS,
 *       type: UIComponentType.SELECT
 *     }]
 *   }],
 *   matchingTo: [{
 *     name: 'Active Users',
 *     conditions: [{
 *       condition: UIConditionType.IS,
 *       type: UIComponentType.SELECT
 *     }]
 *   }]
 * };
 * ```
 */
export type UIRuleConfiguration = {
	filters?: UIFilter[];
	matchingFrom?: UIMatchingRule[];
	matchingTo?: UIMatchingRule[];
	// Backward compatibility
	source?: UIMatchingRule[];
	recommendations?: UIMatchingRule[];
};

/**
 * Custom error class for UI configuration validation failures.
 * Provides detailed error messages for configuration issues.
 *
 * @class UIConfigurationError
 * @extends Error
 *
 * @remarks
 * Used to identify and handle UI-specific configuration errors separately
 * from other error types in the system.
 *
 * @example
 * ```typescript
 * const config = {
 *   name: 'Test Config',
 *   isActive: true
 * };
 *
 * try {
 *   if (!config.isActive) {
 *     throw new UIConfigurationError('Config is not active');
 *   }
 * } catch (error) {
 *   if (error instanceof UIConfigurationError) {
 *     console.error(error.message);
 *   }
 * }
 * ```
 */
export class UIConfigurationError extends Error {
	constructor(message: string) {
		super(`UI Configuration Error: ${message}`);
		this.name = 'UIConfigurationError';
	}
}
