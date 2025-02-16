import { describe, it, expect, beforeEach } from 'vitest';
import { RuleConverter, RuleConversionError } from './rule-converter';
import { ComponentType } from '../components/types';
import { ComparisonOperators } from '../../models/types';
import type { Component, MultiComponent } from '../components/types';

describe('RuleConverter', () => {
	let converter: RuleConverter;

	beforeEach(() => {
		converter = new RuleConverter();
	});

	describe('convertComponentToFilter', () => {
		it('should convert a range component with value', () => {
			const component: Component = {
				type: ComponentType.RANGE,
				identifier: 'price',
				value: 100,
				constraints: {
					min: 0,
					max: 1000,
					step: 1,
				},
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				[ComparisonOperators.eq]: 100,
			});
		});

		it('should convert a range component without value', () => {
			const component: Component = {
				type: ComponentType.RANGE,
				identifier: 'price',
				value: 0,
				constraints: {
					min: 0,
					max: 1000,
					step: 1,
				},
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				between: [0, 1000],
			});
		});

		it('should convert a choice component with value', () => {
			const component: Component = {
				type: ComponentType.CHOICE,
				identifier: 'category',
				value: 'electronics',
				options: [
					{ identifier: 'electronics', value: 'electronics' },
					{ identifier: 'furniture', value: 'furniture' },
				],
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				[ComparisonOperators.eq]: 'electronics',
			});
		});

		it('should convert a choice component without value', () => {
			const component: Component = {
				type: ComponentType.CHOICE,
				identifier: 'category',
				value: '',
				options: [
					{ identifier: 'electronics', value: 'electronics' },
					{ identifier: 'furniture', value: 'furniture' },
				],
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				[ComparisonOperators.in]: ['electronics', 'furniture'],
			});
		});

		it('should convert a multi component', () => {
			const component: Component = {
				type: ComponentType.MULTI,
				identifier: 'tags',
				value: ['new', 'sale'],
				options: [
					{ identifier: 'new', value: 'new' },
					{ identifier: 'sale', value: 'sale' },
					{ identifier: 'featured', value: 'featured' },
				],
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				[ComparisonOperators.in]: ['new', 'sale'],
			});
		});

		it('should convert an input component with value', () => {
			const component: Component = {
				type: ComponentType.INPUT,
				identifier: 'search',
				value: 'test',
				format: 'text',
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				[ComparisonOperators.eq]: 'test',
			});
		});

		it('should convert an input component without value', () => {
			const component: Component = {
				type: ComponentType.INPUT,
				identifier: 'search',
				value: '',
				format: 'text',
			};

			const filter = converter.convertComponentToFilter(component);
			expect(filter).toEqual({
				exists: true,
			});
		});

		it('should throw error for unsupported component type', () => {
			const component = {
				type: 'UNKNOWN' as (typeof ComponentType)[keyof typeof ComponentType],
				identifier: 'test',
				value: '',
			};

			expect(() => converter.convertComponentToFilter(component as Component)).toThrow(
				'Rule Conversion Error: Unsupported component type: UNKNOWN',
			);
		});

		it('should throw error for invalid multi component type', () => {
			// Create a multi component without array value
			const invalidComponent: MultiComponent = {
				type: ComponentType.MULTI,
				identifier: 'tags',
				value: undefined as unknown as string[], // Force invalid value type
				options: [
					{ identifier: 'new', value: 'new' },
					{ identifier: 'sale', value: 'sale' },
				],
			};

			expect(() => converter.convertComponentToFilter(invalidComponent)).toThrow(
				'Rule Conversion Error: Invalid component type for multi conversion',
			);
		});
	});

	describe('convertComponentsToRule', () => {
		it('should convert a single component to a rule', () => {
			const components = [
				{
					field: 'price',
					component: {
						type: ComponentType.RANGE,
						identifier: 'price',
						value: 100,
						constraints: {
							min: 0,
							max: 1000,
							step: 1,
						},
					},
				},
			];

			const rule = converter.convertComponentsToRule(components);
			expect(rule).toEqual({
				attributes: {
					price: {
						[ComparisonOperators.eq]: 100,
					},
				},
			});
		});

		it('should combine multiple components with AND', () => {
			const components = [
				{
					field: 'price',
					component: {
						type: ComponentType.RANGE,
						identifier: 'price',
						value: 100,
						constraints: {
							min: 0,
							max: 1000,
							step: 1,
						},
					},
				},
				{
					field: 'category',
					component: {
						type: ComponentType.CHOICE,
						identifier: 'category',
						value: 'electronics',
						options: [
							{ identifier: 'electronics', value: 'electronics' },
							{ identifier: 'furniture', value: 'furniture' },
						],
					},
				},
			];

			const rule = converter.convertComponentsToRule(components);
			expect(rule).toEqual({
				and: [
					{
						attributes: {
							price: {
								[ComparisonOperators.eq]: 100,
							},
						},
					},
					{
						attributes: {
							category: {
								[ComparisonOperators.eq]: 'electronics',
							},
						},
					},
				],
			});
		});
	});

	describe('RuleConversionError', () => {
		it('should create error with correct message and name', () => {
			const error = new RuleConversionError('Test error');
			expect(error.message).toBe('Rule Conversion Error: Test error');
			expect(error.name).toBe('RuleConversionError');
		});
	});
});
