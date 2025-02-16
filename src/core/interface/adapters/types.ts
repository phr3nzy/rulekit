import type { Component } from '../components/types';

/**
 * Base interface for all component adapters.
 * Adapters are responsible for converting our interface-agnostic components
 * into interface-specific implementations.
 */
export interface ComponentAdapter<T = unknown> {
	/**
	 * Convert a component to its interface-specific representation
	 */
	adapt(component: Component): T;

	/**
	 * Extract a value from an interface-specific representation
	 */
	extractValue(adapted: T): unknown;

	/**
	 * Validate a value against a component's constraints
	 */
	validate(value: unknown, component: Component): boolean;
}

/**
 * Error thrown when component adaptation fails
 */
export class AdapterError extends Error {
	constructor(message: string) {
		super(`Adapter Error: ${message}`);
		this.name = 'AdapterError';
	}
}

/**
 * Base class for implementing component adapters
 */
export abstract class BaseComponentAdapter<T = unknown> implements ComponentAdapter<T> {
	/**
	 * Convert a component to its interface-specific representation
	 */
	abstract adapt(component: Component): T;

	/**
	 * Extract a value from an interface-specific representation
	 */
	abstract extractValue(adapted: T): unknown;

	/**
	 * Default validation implementation that can be extended
	 */
	validate(value: unknown, component: Component): boolean {
		if (component.constraints?.required && value == null) {
			return false;
		}

		if (typeof value === 'number' && component.constraints) {
			const { min, max } = component.constraints;
			if (min != null && value < min) return false;
			if (max != null && value > max) return false;
		}

		if (typeof value === 'string' && component.constraints?.pattern) {
			const regex = new RegExp(component.constraints.pattern);
			return regex.test(value);
		}

		return true;
	}

	/**
	 * Helper method to ensure a component is of a specific type
	 */
	protected ensureType<T extends Component>(
		component: Component,
		type: T['type'],
		methodName: string,
	): asserts component is T {
		if (component.type !== type) {
			throw new AdapterError(
				`${methodName} can only be used with ${type} components, but received ${component.type}`,
			);
		}
	}
}
