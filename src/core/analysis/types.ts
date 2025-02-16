/**
 * Types for the data analysis system that helps generate appropriate components
 * based on input data characteristics.
 */

import type { Component } from '../interface/components/types';

/**
 * Supported data types for analysis
 */
export const DataType = {
	NUMBER: 'number',
	STRING: 'string',
	BOOLEAN: 'boolean',
	DATE: 'date',
} as const;

export type DataTypeValue = (typeof DataType)[keyof typeof DataType];

/**
 * Statistical information about numeric data
 */
export type NumericStatistics = {
	min: number;
	max: number;
	average: number;
	median: number;
	standardDeviation: number;
};

/**
 * Statistical information about categorical data
 */
export type CategoryStatistics = {
	categories: Array<{
		value: string;
		count: number;
		percentage: number;
	}>;
};

/**
 * Combined statistics for a field
 */
export type FieldStatistics = {
	count: number;
	uniqueValues: number;
	nullCount: number;
	numeric?: NumericStatistics;
	categorical?: CategoryStatistics;
};

/**
 * Complete analysis for a single field
 */
export type FieldAnalysis = {
	fieldName: string;
	dataType: DataTypeValue;
	statistics: FieldStatistics;
	suggestedComponent: Component;
};

/**
 * Analysis results for all fields in a dataset
 */
export type DataAnalysis = Record<string, FieldAnalysis>;

/**
 * Configuration options for the analyzer
 */
export type AnalyzerOptions = {
	/**
	 * Maximum number of unique values before suggesting a range/input
	 * instead of a choice component
	 */
	maxChoiceOptions?: number;
	/**
	 * Whether to include detailed statistics in the metadata
	 */
	includeDetailedStats?: boolean;
	/**
	 * Custom rules for suggesting components
	 */
	componentSuggestionRules?: Array<{
		condition: (analysis: FieldAnalysis) => boolean;
		suggest: (analysis: FieldAnalysis) => Component;
	}>;
};

/**
 * Error thrown when data analysis fails
 */
export class AnalysisError extends Error {
	constructor(message: string) {
		super(`Analysis Error: ${message}`);
		this.name = 'AnalysisError';
	}
}
