import { describe, it, expect } from 'vitest';
import { ComparisonOperators } from '../models/types';
import { UIConditionType, UIComponentType } from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

describe('UI Configuration Converter', () => {
	describe('convertUIConfigurationToRules', () => {
		it('should convert filters to source rules', () => {
			const config = {
				filters: [
					{
						name: 'category',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
								min: 0,
								max: 1,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.sourceRules).toHaveLength(1);
			expect(result.sourceRules[0]).toEqual({
				attributes: {
					category: {
						[ComparisonOperators.eq]: 1,
					},
				},
			});
		});

		it('should convert source configuration to source rules', () => {
			const config = {
				source: [
					{
						name: 'Product',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: ['Product 1'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.sourceRules).toHaveLength(1);
			expect(result.sourceRules[0]).toEqual({
				attributes: {
					Product: {
						[ComparisonOperators.eq]: ['Product 1'],
					},
				},
			});
		});

		it('should convert recommendations to recommendation rules', () => {
			const config = {
				recommendations: [
					{
						name: 'Category',
						conditions: [
							{
								condition: UIConditionType.IN,
								type: UIComponentType.MULTISELECTOR,
								min: 1,
								max: -1,
							},
						],
						value: ['Category 1', 'Category 2'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.recommendationRules).toHaveLength(1);
			expect(result.recommendationRules[0]).toEqual({
				attributes: {
					Category: {
						[ComparisonOperators.in]: ['Category 1', 'Category 2'],
					},
				},
			});
		});

		it('should combine multiple conditions with AND', () => {
			const config = {
				filters: [
					{
						name: 'price',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.TEXT,
								min: 0,
							},
							{
								condition: UIConditionType.IS_NOT,
								type: UIComponentType.TEXT,
								max: 100,
							},
						],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.sourceRules).toHaveLength(1);
			expect(result.sourceRules[0]).toHaveProperty('and');
			expect(result.sourceRules[0].and).toHaveLength(2);
		});
	});

	describe('validateUIConfiguration', () => {
		it('should throw error if no rules are provided', () => {
			expect(() => validateUIConfiguration({})).toThrow(
				'Configuration must contain at least one rule type',
			);
		});

		it('should throw error if filter has no name', () => {
			const config = {
				filters: [
					{
						name: '',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow('Filter must have a name');
		});

		it('should throw error if filter has no conditions', () => {
			const config = {
				filters: [
					{
						name: 'test',
						conditions: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'Filter "test" must have at least one condition',
			);
		});

		it('should throw error if recommendation has no value', () => {
			const config = {
				recommendations: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						value: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'Recommendation "test" must have at least one value',
			);
		});
	});
});
