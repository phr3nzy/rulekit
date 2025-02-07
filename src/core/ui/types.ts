/**
 * UI-specific condition types
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
 * UI component types for rendering
 */
export const UIComponentType = {
	SELECT: 'select',
	TEXT: 'text',
	OPTIONS: 'options',
	MULTISELECTOR: 'MULTISELECTOR',
} as const;

export type UIComponentTypeValue = (typeof UIComponentType)[keyof typeof UIComponentType];

/**
 * Base condition structure for UI
 */
export type UICondition = {
	condition: UIConditionTypeValue;
	min?: number;
	max?: number;
	type: UIComponentTypeValue;
	component?: UIComponentTypeValue;
};

/**
 * Filter configuration for UI
 */
export type UIFilter = {
	name: string;
	meta?: Record<string, unknown>;
	conditions: UICondition[];
};

/**
 * Generic matching rule type
 */
export type UIMatchingRule = {
	name: string;
	conditions: UICondition[];
	values?: string[];
};

/**
 * Complete UI configuration format
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
 * Error thrown when UI configuration validation fails
 */
export class UIConfigurationError extends Error {
	constructor(message: string) {
		super(`UI Configuration Error: ${message}`);
		this.name = 'UIConfigurationError';
	}
}
