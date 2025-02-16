import { RuleEngine } from '../../src';
import { DataAnalyzer } from '../../src/core/analysis/analyzer';
import { RuleConverter } from '../../src/core/interface/converters/rule-converter';
import { ComponentType } from '../../src/core/interface/components/types';
import type { Entity } from '../../src/core/models/types';
import type { Component } from '../../src/core/interface/components/types';

// Use Record<string, unknown> to make it compatible with DynamicAttributes
type ProductAttributes = {
	category: string;
	price: number;
	tags: string[];
	inStock: boolean;
	rating: number;
	releaseDate: string;
	__validated: boolean;
};

// Sample product data
const products: Entity[] = [
	{
		id: '1',
		name: 'Laptop',
		attributes: {
			category: 'electronics',
			price: 999,
			tags: ['new', 'featured'],
			inStock: true,
			rating: 4.5,
			releaseDate: '2024-01-15',
			__validated: true,
		},
	},
	{
		id: '2',
		name: 'Office Chair',
		attributes: {
			category: 'furniture',
			price: 299,
			tags: ['sale'],
			inStock: true,
			rating: 4.0,
			releaseDate: '2023-12-01',
			__validated: true,
		},
	},
	{
		id: '3',
		name: 'Smartphone',
		attributes: {
			category: 'electronics',
			price: 699,
			tags: ['new', 'premium'],
			inStock: false,
			rating: 4.8,
			releaseDate: '2024-02-01',
			__validated: true,
		},
	},
];

// Step 1: Analyze data to get smart component suggestions
const analyzer = new DataAnalyzer();
const analysis = analyzer.analyze(products.map(p => p.attributes));

console.log('\n=== Data Analysis Results ===');
Object.entries(analysis).forEach(([field, fieldAnalysis]) => {
	console.log(`\nField: ${field}`);
	console.log('Data Type:', fieldAnalysis.dataType);
	console.log('Suggested Component:', fieldAnalysis.suggestedComponent.type);

	if (fieldAnalysis.statistics.numeric) {
		console.log('Numeric Statistics:', {
			min: fieldAnalysis.statistics.numeric.min,
			max: fieldAnalysis.statistics.numeric.max,
			average: fieldAnalysis.statistics.numeric.average,
			median: fieldAnalysis.statistics.numeric.median,
		});
	}

	if (fieldAnalysis.statistics.categorical) {
		console.log(
			'Categories:',
			fieldAnalysis.statistics.categorical.categories.map(c => ({
				value: c.value,
				count: c.count,
				percentage: c.percentage,
			})),
		);
	}
});

// Step 2: Use the suggested components to create a filtering interface
const allComponents = [
	{
		field: 'price',
		component: analysis['price']?.suggestedComponent, // Range component
	},
	{
		field: 'category',
		component: analysis['category']?.suggestedComponent, // Choice component
	},
	{
		field: 'tags',
		component: analysis['tags']?.suggestedComponent, // Multi component
	},
	{
		field: 'inStock',
		component: analysis['inStock']?.suggestedComponent, // Choice component
	},
];

// Filter out any undefined components and ensure type safety
const components: Array<{ field: string; component: Component }> = allComponents.filter(
	(c): c is { field: string; component: Component } => c.component !== undefined,
);

// Step 3: Convert components to rules
const converter = new RuleConverter();
const rule = converter.convertComponentsToRule(components);

// Step 4: Find matching products
const engine = new RuleEngine();
const matches = engine.findMatchingFrom(products, [rule]);

console.log('\n=== Matching Products ===');
matches.forEach(match => {
	const attrs = match.attributes as ProductAttributes;
	console.log(`- ${match.name} (${attrs.category})`);
	console.log('  Price:', attrs.price);
	console.log('  Tags:', attrs.tags.join(', '));
	console.log('  In Stock:', attrs.inStock);
	console.log();
});

// Example of customizing component suggestions
const analyzerWithCustomRules = new DataAnalyzer({
	maxChoiceOptions: 5, // Suggest input component if more than 5 options
	componentSuggestionRules: [
		{
			// Always use input component for price
			condition: analysis => analysis.fieldName === 'price',
			suggest: analysis => ({
				type: ComponentType.INPUT,
				identifier: analysis.fieldName,
				value: '',
				format: 'number',
			}),
		},
		{
			// Use multi component for any array data
			condition: analysis => Array.isArray(analysis.statistics.categorical?.categories[0]?.value),
			suggest: analysis => ({
				type: ComponentType.MULTI,
				identifier: analysis.fieldName,
				value: [],
				options: analysis.statistics.categorical!.categories.map(c => ({
					identifier: c.value,
					value: c.value,
				})),
			}),
		},
	],
});

const customAnalysis = analyzerWithCustomRules.analyze(products.map(p => p.attributes));
console.log('\n=== Custom Analysis Results ===');
Object.entries(customAnalysis).forEach(([field, fieldAnalysis]) => {
	console.log(`\nField: ${field}`);
	console.log('Suggested Component:', fieldAnalysis.suggestedComponent.type);
});
