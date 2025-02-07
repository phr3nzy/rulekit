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
 * Source configuration for UI
 */
export type UISource = {
	name: string;
	conditions: UICondition[];
	values?: string[];
};

/**
 * Recommendation configuration for UI
 */
export type UIRecommendation = {
	name: string;
	conditions: UICondition[];
	value: string[];
};

/**
 * Complete UI configuration format
 */
export type UIRuleConfiguration = {
	filters?: UIFilter[];
	source?: UISource[];
	recommendations?: UIRecommendation[];
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
