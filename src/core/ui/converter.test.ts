import { describe, it, expect } from 'vitest';
import { ComparisonOperators } from '../models/types';
import { UIConditionType, UIComponentType } from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

describe('UI Configuration Converter', () => {
	describe('convertUIConfigurationToRules', () => {
		it('should convert filters to from rules', () => {
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

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					category: {
						[ComparisonOperators.eq]: [1],
					},
				},
			});
		});

		it('should convert matchingFrom configuration to from rules', () => {
			const config = {
				matchingFrom: [
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

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toEqual({
				attributes: {
					Product: {
						[ComparisonOperators.eq]: ['Product 1'],
					},
				},
			});
		});

		it('should convert matchingTo configuration to to rules', () => {
			const config = {
				matchingTo: [
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
						values: ['Category 1', 'Category 2'],
					},
				],
			};

			const result = convertUIConfigurationToRules(config);

			expect(result.toRules).toHaveLength(1);
			expect(result.toRules[0]).toEqual({
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

			expect(result.fromRules).toHaveLength(1);
			expect(result.fromRules[0]).toHaveProperty('and');
			expect(result.fromRules[0].and).toHaveLength(2);
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

		it('should throw error if matchingTo has no values', () => {
			const config = {
				matchingTo: [
					{
						name: 'test',
						conditions: [
							{
								condition: UIConditionType.IS,
								type: UIComponentType.SELECT,
							},
						],
						values: [],
					},
				],
			};

			expect(() => validateUIConfiguration(config)).toThrow(
				'To "test" must have at least one value',
			);
		});
	});
});
