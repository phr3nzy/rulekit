import { describe, it, expect } from 'vitest';
import { DataAnalyzer } from './analyzer';
import { ComponentType } from '../interface/components/types';
import { DataType } from './types';
import type { InputComponent } from '../interface/components/types';

describe('DataAnalyzer', () => {
	describe('analyze', () => {
		it('should analyze numeric data and suggest range component', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ price: 10 }, { price: 20 }, { price: 30 }, { price: 40 }, { price: 50 }];

			const analysis = analyzer.analyze(data);
			const priceAnalysis = analysis.price;

			expect(priceAnalysis.dataType).toBe(DataType.NUMBER);
			expect(priceAnalysis.statistics.numeric).toBeDefined();
			expect(priceAnalysis.statistics.numeric?.min).toBe(10);
			expect(priceAnalysis.statistics.numeric?.max).toBe(50);
			expect(priceAnalysis.statistics.numeric?.average).toBe(30);
			expect(priceAnalysis.suggestedComponent.type).toBe(ComponentType.RANGE);
		});

		it('should analyze categorical data and suggest choice component', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ category: 'Electronics' },
				{ category: 'Furniture' },
				{ category: 'Electronics' },
				{ category: 'Clothing' },
			];

			const analysis = analyzer.analyze(data);
			const categoryAnalysis = analysis.category;

			expect(categoryAnalysis.dataType).toBe(DataType.STRING);
			expect(categoryAnalysis.statistics.categorical).toBeDefined();
			expect(categoryAnalysis.statistics.categorical?.categories).toHaveLength(3);
			expect(categoryAnalysis.suggestedComponent.type).toBe(ComponentType.CHOICE);
		});

		it('should analyze array data and suggest multi component', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ tags: ['new', 'sale'] },
				{ tags: ['featured'] },
				{ tags: ['sale', 'premium'] },
			];

			const analysis = analyzer.analyze(data);
			const tagsAnalysis = analysis.tags;

			expect(tagsAnalysis.dataType).toBe(DataType.STRING);
			expect(tagsAnalysis.statistics.categorical).toBeDefined();
			expect(tagsAnalysis.suggestedComponent.type).toBe(ComponentType.MULTI);
		});

		it('should handle invalid JSON in array data', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ tags: ['new', 'sale'] },
				{ tags: 'invalid-json' }, // This will be stringified but won't parse as JSON array
				{ tags: ['sale', 'premium'] },
			];

			const analysis = analyzer.analyze(data);
			const tagsAnalysis = analysis.tags;

			expect(tagsAnalysis.dataType).toBe(DataType.STRING);
			expect(tagsAnalysis.statistics.categorical).toBeDefined();
			expect(tagsAnalysis.suggestedComponent.type).toBe(ComponentType.MULTI);
		});

		it('should analyze boolean data and suggest choice component', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ inStock: true }, { inStock: false }, { inStock: true }];

			const analysis = analyzer.analyze(data);
			const inStockAnalysis = analysis.inStock;

			expect(inStockAnalysis.dataType).toBe(DataType.BOOLEAN);
			expect(inStockAnalysis.statistics.categorical).toBeDefined();
			expect(inStockAnalysis.statistics.categorical?.categories).toHaveLength(2);
			expect(inStockAnalysis.suggestedComponent.type).toBe(ComponentType.CHOICE);
		});

		it('should analyze date data and suggest input component', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ createdAt: '2024-01-01' },
				{ createdAt: '2024-01-02' },
				{ createdAt: '2024-01-03' },
			];

			const analysis = analyzer.analyze(data);
			const createdAtAnalysis = analysis.createdAt;

			expect(createdAtAnalysis.dataType).toBe(DataType.DATE);
			expect(createdAtAnalysis.suggestedComponent.type).toBe(ComponentType.INPUT);
			expect((createdAtAnalysis.suggestedComponent as InputComponent).format).toBe('date');
		});

		it('should handle empty data array', () => {
			const analyzer = new DataAnalyzer();
			expect(() => analyzer.analyze([])).toThrow('Data must be a non-empty array of objects');
		});

		it('should handle null values in data', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ value: 10 }, { value: null }, { value: 30 }];

			const analysis = analyzer.analyze(data);
			const valueAnalysis = analysis.value;

			expect(valueAnalysis.statistics.nullCount).toBe(1);
			expect(valueAnalysis.statistics.count).toBe(3);
		});

		it('should handle all null values in data', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ value: null }, { value: null }, { value: null }];

			const analysis = analyzer.analyze(data);
			const valueAnalysis = analysis.value;

			expect(valueAnalysis.dataType).toBe(DataType.STRING);
			expect(valueAnalysis.statistics.nullCount).toBe(3);
			expect(valueAnalysis.statistics.count).toBe(3);
		});

		it('should use custom component suggestion rules', () => {
			const analyzer = new DataAnalyzer({
				componentSuggestionRules: [
					{
						condition: analysis => analysis.fieldName === 'price',
						suggest: analysis =>
							({
								type: ComponentType.INPUT,
								identifier: analysis.fieldName,
								value: '',
								format: 'number',
							}) as InputComponent,
					},
				],
			});

			const data = [{ price: 10 }, { price: 20 }];

			const analysis = analyzer.analyze(data);
			expect(analysis.price.suggestedComponent.type).toBe(ComponentType.INPUT);
			expect((analysis.price.suggestedComponent as InputComponent).format).toBe('number');
		});

		it('should handle string fields with too many unique values', () => {
			const analyzer = new DataAnalyzer({ maxChoiceOptions: 2 });
			const data = [{ category: 'A' }, { category: 'B' }, { category: 'C' }];

			const analysis = analyzer.analyze(data);
			const categoryAnalysis = analysis.category;

			expect(categoryAnalysis.suggestedComponent.type).toBe(ComponentType.INPUT);
			expect((categoryAnalysis.suggestedComponent as InputComponent).format).toBe('text');
		});

		it('should calculate correct statistics for numeric data', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ value: 2 },
				{ value: 4 },
				{ value: 4 },
				{ value: 4 },
				{ value: 5 },
				{ value: 5 },
				{ value: 7 },
				{ value: 9 },
			];

			const analysis = analyzer.analyze(data);
			const stats = analysis.value.statistics.numeric!;

			expect(stats.min).toBe(2);
			expect(stats.max).toBe(9);
			expect(stats.average).toBe(5);
			expect(stats.median).toBe(4.5); // For even-length arrays, median is average of middle two values
			expect(stats.standardDeviation).toBeCloseTo(2.138, 3);
		});

		it('should calculate correct statistics for categorical data', () => {
			const analyzer = new DataAnalyzer();
			const data = [
				{ category: 'A' },
				{ category: 'B' },
				{ category: 'A' },
				{ category: 'A' },
				{ category: 'C' },
			];

			const analysis = analyzer.analyze(data);
			const stats = analysis.category.statistics.categorical!;

			const categoryA = stats.categories.find(c => c.value === 'A')!;
			expect(categoryA.count).toBe(3);
			expect(categoryA.percentage).toBe(60);

			const categoryB = stats.categories.find(c => c.value === 'B')!;
			expect(categoryB.count).toBe(1);
			expect(categoryB.percentage).toBe(20);
		});

		it('should throw error for missing numeric statistics', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ value: 'not-a-number' }];

			expect(() => {
				const analysis = analyzer.analyze(data);
				// Force type to NUMBER to trigger error
				(analysis.value as any).dataType = DataType.NUMBER;
				analyzer['suggestNumericComponent']('value', analysis.value.statistics);
			}).toThrow('Missing numeric statistics for numeric field');
		});

		it('should throw error for missing categorical statistics', () => {
			const analyzer = new DataAnalyzer();
			const data = [{ value: 'string' }];

			expect(() => {
				const analysis = analyzer.analyze(data);
				// Remove categorical statistics to trigger error
				delete (analysis.value.statistics as any).categorical;
				analyzer['suggestStringComponent']('value', analysis.value.statistics);
			}).toThrow('Missing categorical statistics for string field');
		});
	});
});
