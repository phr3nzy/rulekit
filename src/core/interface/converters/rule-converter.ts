import type {
	Component,
	ChoiceComponent,
	RangeComponent,
	MultiComponent,
	InputComponent,
} from '../components/types';
import type { Rule, BaseFilter } from '../../models/types';
import { ComponentType } from '../components/types';
import { InterfaceOperators } from '../components/operators';

/**
 * Error thrown when rule conversion fails
 */
export class RuleConversionError extends Error {
	constructor(message: string) {
		super(`Rule Conversion Error: ${message}`);
		this.name = 'RuleConversionError';
	}
}

/**
 * Converts interface-agnostic components to RuleKit rule format
 */
export class RuleConverter {
	/**
	 * Convert a component's value to a rule filter
	 */
	convertComponentToFilter(component: Component): BaseFilter {
		switch (component.type) {
			case ComponentType.RANGE:
				return this.convertRangeComponent(component as RangeComponent);
			case ComponentType.CHOICE:
				return this.convertChoiceComponent(component as ChoiceComponent);
			case ComponentType.MULTI:
				return this.convertMultiComponent(component);
			case ComponentType.INPUT:
				return this.convertInputComponent(component as InputComponent);
			default:
				throw new RuleConversionError(
					`Unsupported component type: ${(component as Component).type}`,
				);
		}
	}

	/**
	 * Convert a range component to a filter
	 */
	private convertRangeComponent(component: RangeComponent): BaseFilter {
		const { value, constraints } = component;

		// If no value is set, use the between operator with min/max constraints
		if (value === 0 || !value) {
			return {
				[InterfaceOperators.between]: [constraints.min, constraints.max],
			} as BaseFilter;
		}

		return {
			[InterfaceOperators.eq]: value,
		} as BaseFilter;
	}

	/**
	 * Convert a choice component to a filter
	 */
	private convertChoiceComponent(component: ChoiceComponent): BaseFilter {
		const { value } = component;

		if (!value) {
			return {
				[InterfaceOperators.in]: component.options.map(opt => opt.value),
			} as BaseFilter;
		}

		return {
			[InterfaceOperators.eq]: value,
		} as BaseFilter;
	}

	/**
	 * Convert a multi-select component to a filter
	 */
	private convertMultiComponent(component: Component): BaseFilter {
		const multiComponent = component as MultiComponent;

		// Validate that the component has an array value
		if (!Array.isArray(multiComponent.value)) {
			throw new RuleConversionError('Invalid component type for multi conversion');
		}

		return {
			[InterfaceOperators.in]: multiComponent.value,
		} as BaseFilter;
	}

	/**
	 * Convert an input component to a filter
	 */
	private convertInputComponent(component: InputComponent): BaseFilter {
		if (!component.value) {
			return {
				[InterfaceOperators.exists]: true,
			} as BaseFilter;
		}

		return {
			[InterfaceOperators.eq]: component.value,
		} as BaseFilter;
	}

	/**
	 * Convert a set of components to a complete rule
	 */
	convertComponentsToRule(components: Array<{ field: string; component: Component }>): Rule {
		const rules: Rule[] = components.map(({ field, component }) => ({
			attributes: {
				[field]: this.convertComponentToFilter(component),
			},
		}));

		// If multiple components, combine with AND
		return rules.length > 1 ? { and: rules } : rules[0];
	}
}
