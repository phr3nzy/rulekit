/**
 * Core interface component types for RuleKit.
 * These types are interface-agnostic and can be used across different rendering contexts.
 */

/**
 * Available component types that can be rendered in any interface.
 */
export const ComponentType = {
	INPUT: 'input',
	CHOICE: 'choice',
	MULTI: 'multi',
	RANGE: 'range',
} as const;

export type ComponentTypeValue = (typeof ComponentType)[keyof typeof ComponentType];

/**
 * Base constraints that can be applied to any component.
 */
export type ComponentConstraints = {
	required?: boolean;
	min?: number;
	max?: number;
	pattern?: string;
	step?: number;
};

/**
 * Base component interface that all specific components extend.
 */
export type BaseComponent<T = unknown> = {
	type: ComponentTypeValue;
	value: T;
	identifier: string;
	constraints?: ComponentConstraints;
	metadata?: Record<string, unknown>;
};

/**
 * Component for selecting from predefined options.
 */
export type ChoiceComponent = BaseComponent<string> & {
	type: typeof ComponentType.CHOICE;
	options: Array<{
		identifier: string;
		value: string;
		metadata?: {
			count?: number;
			percentage?: number;
		};
	}>;
};

/**
 * Component for free-form input with optional format constraints.
 */
export type InputComponent = BaseComponent<string> & {
	type: typeof ComponentType.INPUT;
	format?: 'text' | 'number' | 'date';
};

/**
 * Component for selecting multiple values from predefined options.
 */
export type MultiComponent = BaseComponent<string[]> & {
	type: typeof ComponentType.MULTI;
	options: Array<{
		identifier: string;
		value: string;
		metadata?: {
			count?: number;
			percentage?: number;
		};
	}>;
};

/**
 * Component for selecting a value within a numeric range.
 */
export type RangeComponent = BaseComponent<number> & {
	type: typeof ComponentType.RANGE;
	constraints: {
		min: number;
		max: number;
		step?: number;
	};
};

/**
 * Union type of all available component types.
 */
export type Component = ChoiceComponent | InputComponent | MultiComponent | RangeComponent;

/**
 * Error thrown when component validation fails.
 */
export class ComponentError extends Error {
	constructor(message: string) {
		super(`Component Error: ${message}`);
		this.name = 'ComponentError';
	}
}
