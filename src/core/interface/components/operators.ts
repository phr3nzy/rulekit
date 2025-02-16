import { ComparisonOperators, type BaseFilter } from '../../models/types';

/**
 * Extended comparison operators for interface components.
 * These operators are only used within the interface components and converters,
 * and do not affect the core ComparisonOperators.
 */
export const InterfaceOperators = {
	...ComparisonOperators,
	between: 'between',
	exists: 'exists',
} as const;

export type InterfaceOperator = keyof typeof InterfaceOperators;

/**
 * Extended filter type for interface components that includes additional operators
 */
export type InterfaceFilter = BaseFilter & {
	between?: [number, number];
	exists?: boolean;
};

// Re-export core operators for convenience
export { ComparisonOperators } from '../../models/types';
