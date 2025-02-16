import {
	type DataAnalysis,
	type FieldAnalysis,
	type AnalyzerOptions,
	type NumericStatistics,
	type CategoryStatistics,
	DataType,
	type DataTypeValue,
	AnalysisError,
} from './types';
import {
	ComponentType,
	type Component,
	type ChoiceComponent,
	type RangeComponent,
	type InputComponent,
	type MultiComponent,
} from '../interface/components/types';

const DEFAULT_OPTIONS: Required<AnalyzerOptions> = {
	maxChoiceOptions: 20,
	includeDetailedStats: true,
	componentSuggestionRules: [],
};

/**
 * Analyzes data to generate appropriate interface components and statistics.
 */
export class DataAnalyzer {
	private options: Required<AnalyzerOptions>;

	constructor(options: AnalyzerOptions = {}) {
		this.options = { ...DEFAULT_OPTIONS, ...options };
	}

	/**
	 * Analyzes an array of data objects to generate field analyses and component suggestions.
	 */
	analyze(data: Array<Record<string, unknown>>): DataAnalysis {
		if (!Array.isArray(data) || data.length === 0) {
			throw new AnalysisError('Data must be a non-empty array of objects');
		}

		const analysis: DataAnalysis = {};
		const fields = this.extractFields(data);

		for (const field of fields) {
			const values = data.map(item => item[field]);
			const dataType = this.detectDataType(values);
			const statistics = this.calculateStatistics(values, dataType);
			const suggestedComponent = this.suggestComponent(field, statistics, dataType);

			analysis[field] = {
				fieldName: field,
				dataType,
				statistics,
				suggestedComponent,
			};
		}

		return analysis;
	}

	/**
	 * Extracts unique field names from the data.
	 */
	private extractFields(data: Array<Record<string, unknown>>): string[] {
		const fields = new Set<string>();
		data.forEach(item => {
			Object.keys(item).forEach(key => fields.add(key));
		});
		return Array.from(fields);
	}

	/**
	 * Detects the data type of a field based on its values.
	 */
	private detectDataType(values: unknown[]): DataTypeValue {
		const nonNullValues = values.filter(v => v != null);
		if (nonNullValues.length === 0) return DataType.STRING;

		// Check for arrays first
		if (nonNullValues.some(v => Array.isArray(v))) return DataType.STRING;

		const types = new Set(nonNullValues.map(v => typeof v));

		if (types.has('number')) return DataType.NUMBER;
		if (types.has('boolean')) return DataType.BOOLEAN;
		if (nonNullValues.every(v => !isNaN(Date.parse(String(v))))) return DataType.DATE;

		return DataType.STRING;
	}

	/**
	 * Calculates statistics for a field based on its values and data type.
	 */
	private calculateStatistics(values: unknown[], dataType: DataTypeValue) {
		const nonNullValues = values.filter(v => v != null);
		const statistics = {
			count: values.length,
			uniqueValues: new Set(values.map(v => (Array.isArray(v) ? JSON.stringify(v) : v))).size,
			nullCount: values.length - nonNullValues.length,
		};

		if (dataType === DataType.NUMBER) {
			const numbers = nonNullValues.map(v => Number(v));
			const numeric = this.calculateNumericStatistics(numbers);
			return { ...statistics, numeric };
		}

		if (dataType === DataType.STRING || dataType === DataType.BOOLEAN) {
			const categorical = this.calculateCategoryStatistics(nonNullValues);
			return { ...statistics, categorical };
		}

		return statistics;
	}

	/**
	 * Calculates numeric statistics for number fields.
	 */
	private calculateNumericStatistics(numbers: number[]): NumericStatistics {
		const sorted = [...numbers].sort((a, b) => a - b);
		const sum = numbers.reduce((a, b) => a + b, 0);
		const average = sum / numbers.length;

		// Calculate median properly for even and odd length arrays
		let median: number;
		const mid = Math.floor(sorted.length / 2);
		if (sorted.length % 2 === 0) {
			median = (sorted[mid - 1] + sorted[mid]) / 2;
		} else {
			median = sorted[mid];
		}

		// Calculate standard deviation using population formula
		const squaredDiffs = numbers.map(n => Math.pow(n - average, 2));
		const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (numbers.length - 1); // Use n-1 for sample standard deviation
		const standardDeviation = Math.sqrt(variance);

		return {
			min: Math.min(...numbers),
			max: Math.max(...numbers),
			average,
			median,
			standardDeviation,
		};
	}

	/**
	 * Calculates category statistics for string/boolean fields.
	 */
	private calculateCategoryStatistics(values: unknown[]): CategoryStatistics {
		const counts = new Map<string, number>();
		values.forEach(value => {
			const key = Array.isArray(value) ? JSON.stringify(value) : String(value);
			counts.set(key, (counts.get(key) || 0) + 1);
		});

		const categories = Array.from(counts.entries()).map(([value, count]) => ({
			value,
			count,
			percentage: (count / values.length) * 100,
		}));

		return { categories };
	}

	/**
	 * Suggests an appropriate component based on field analysis.
	 */
	private suggestComponent(
		fieldName: string,
		statistics: FieldAnalysis['statistics'],
		dataType: DataTypeValue,
	): Component {
		// Check custom rules first
		for (const rule of this.options.componentSuggestionRules) {
			if (rule.condition({ fieldName, dataType, statistics } as FieldAnalysis)) {
				return rule.suggest({ fieldName, dataType, statistics } as FieldAnalysis);
			}
		}

		// Check for array values
		const hasArrays = statistics.categorical?.categories.some(cat => cat.value.startsWith('['));
		if (hasArrays) {
			return this.suggestMultiComponent(fieldName, statistics);
		}

		// Default component suggestions based on data type and statistics
		switch (dataType) {
			case DataType.NUMBER:
				return this.suggestNumericComponent(fieldName, statistics);
			case DataType.BOOLEAN:
				return this.suggestBooleanComponent(fieldName, statistics);
			case DataType.DATE:
				return this.suggestDateComponent(fieldName);
			default:
				return this.suggestStringComponent(fieldName, statistics);
		}
	}

	/**
	 * Suggests a component for numeric fields.
	 */
	private suggestNumericComponent(
		fieldName: string,
		statistics: FieldAnalysis['statistics'],
	): RangeComponent {
		if (!statistics.numeric) {
			throw new AnalysisError('Missing numeric statistics for numeric field');
		}

		return {
			type: ComponentType.RANGE,
			identifier: fieldName,
			value: 0,
			constraints: {
				min: statistics.numeric.min,
				max: statistics.numeric.max,
				step: this.calculateStep(statistics.numeric),
			},
			metadata: this.options.includeDetailedStats ? { statistics: statistics.numeric } : undefined,
		};
	}

	/**
	 * Suggests a component for boolean fields.
	 */
	private suggestBooleanComponent(
		fieldName: string,
		statistics: FieldAnalysis['statistics'],
	): ChoiceComponent {
		return {
			type: ComponentType.CHOICE,
			identifier: fieldName,
			value: '',
			options: [
				{ identifier: 'true', value: 'True' },
				{ identifier: 'false', value: 'False' },
			],
			metadata: this.options.includeDetailedStats
				? { statistics: statistics.categorical }
				: undefined,
		};
	}

	/**
	 * Suggests a component for date fields.
	 */
	private suggestDateComponent(fieldName: string): InputComponent {
		return {
			type: ComponentType.INPUT,
			identifier: fieldName,
			value: '',
			format: 'date',
		};
	}

	/**
	 * Suggests a component for string fields.
	 */
	private suggestStringComponent(
		fieldName: string,
		statistics: FieldAnalysis['statistics'],
	): ChoiceComponent | InputComponent {
		if (statistics.uniqueValues > this.options.maxChoiceOptions) {
			return {
				type: ComponentType.INPUT,
				identifier: fieldName,
				value: '',
				format: 'text',
			};
		}

		if (!statistics.categorical) {
			throw new AnalysisError('Missing categorical statistics for string field');
		}

		return {
			type: ComponentType.CHOICE,
			identifier: fieldName,
			value: '',
			options: statistics.categorical.categories.map(cat => ({
				identifier: cat.value,
				value: cat.value,
				metadata: {
					count: cat.count,
					percentage: cat.percentage,
				},
			})),
			metadata: this.options.includeDetailedStats
				? { statistics: statistics.categorical }
				: undefined,
		};
	}

	/**
	 * Suggests a component for array fields.
	 */
	private suggestMultiComponent(
		fieldName: string,
		statistics: FieldAnalysis['statistics'],
	): MultiComponent {
		if (!statistics.categorical) {
			throw new AnalysisError('Missing categorical statistics for array field');
		}

		// Extract unique values from array strings
		const allValues = new Set<string>();
		statistics.categorical.categories.forEach(cat => {
			try {
				const values = JSON.parse(cat.value);
				if (Array.isArray(values)) {
					values.forEach(v => allValues.add(String(v)));
				}
			} catch {
				// Skip invalid JSON
			}
		});

		return {
			type: ComponentType.MULTI,
			identifier: fieldName,
			value: [],
			options: Array.from(allValues).map(value => ({
				identifier: value,
				value,
			})),
			metadata: this.options.includeDetailedStats
				? { statistics: statistics.categorical }
				: undefined,
		};
	}

	/**
	 * Calculates an appropriate step value for range components.
	 */
	private calculateStep(stats: NumericStatistics): number {
		const range = stats.max - stats.min;
		const magnitude = Math.floor(Math.log10(range));
		return Math.pow(10, magnitude - 1);
	}
}
