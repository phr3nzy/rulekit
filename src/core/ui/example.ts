import { RuleEngine } from '../services/rule-engine';
import { UIConditionType, UIComponentType } from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

// Example products
const products = [
	{
		id: '1',
		name: 'Outdoor Chair',
		attributes: {
			category: 'Outdoor furniture',
			price: 1200000,
			__validated: true,
		},
	},
	{
		id: '2',
		name: 'Indoor Chair',
		attributes: {
			category: 'Indoor furniture',
			price: 400000,
			__validated: true,
		},
	},
];

// Example UI configuration (matching the UI shown in screenshots)
const uiConfig = {
	source: [
		{
			name: 'category',
			conditions: [
				{
					condition: UIConditionType.IS,
					type: UIComponentType.SELECT,
				},
			],
			values: ['Outdoor furniture'],
		},
		{
			name: 'price',
			conditions: [
				{
					condition: UIConditionType.IS,
					type: UIComponentType.TEXT,
					max: 1500000,
				},
			],
			values: ['1500000'],
		},
	],
	recommendations: [
		{
			name: 'category',
			conditions: [
				{
					condition: UIConditionType.IS,
					type: UIComponentType.SELECT,
				},
			],
			value: ['Indoor furniture'],
		},
		{
			name: 'price',
			conditions: [
				{
					condition: UIConditionType.IS,
					type: UIComponentType.TEXT,
					max: 500000,
				},
			],
			value: ['500000'],
		},
	],
};

async function runExample() {
	try {
		// Validate the UI configuration
		validateUIConfiguration(uiConfig);

		// Convert UI configuration to internal rules
		const { sourceRules, recommendationRules } = convertUIConfigurationToRules(uiConfig);

		// Initialize rule engine
		const ruleEngine = new RuleEngine({ cache: undefined, enableCaching: false });

		// Process the configuration
		const result = await ruleEngine.processConfig(
			{
				id: 'example',
				name: 'Example Cross-Sell',
				ruleSet: {
					sourceRules,
					recommendationRules,
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			products,
		);

		console.log('Source Products:', result.sourceProducts);
		console.log('Recommended Products:', result.recommendedProducts);

		return result;
	} catch (error) {
		console.error('Error processing rules:', error);
		throw error;
	}
}

runExample().catch(console.error);

export { runExample, uiConfig };
