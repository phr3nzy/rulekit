/**
 * Defines the available condition types for UI rule configuration.
 * These types represent different ways to compare values in the UI.
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
 */
export type UICondition = {
	condition: UIConditionTypeValue;
	min?: number | string | null;
	max?: number | string | null;
	type: UIComponentTypeValue;
	component?: UIComponentTypeValue;
};

/**
 * Defines a named filter with associated conditions for UI rendering.
 */
export type UIFilter = {
	name: string;
	meta?: Record<string, unknown>;
	conditions: UICondition[];
};

/**
 * Represents a rule for matching entities with specific conditions.
 */
export type UIMatchingRule = {
	name: string;
	conditions: UICondition[];
	values?: string[];
};

/**
 * Defines the complete UI configuration structure for rule-based matching.
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
 */
export class UIConfigurationError extends Error {
	constructor(message: string) {
		super(`UI Configuration Error: ${message}`);
		this.name = 'UIConfigurationError';
	}
}
