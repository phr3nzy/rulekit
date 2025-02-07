import { RuleEngine } from '../services/rule-engine';
import { UIConditionType, UIComponentType } from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

// Example entities
const entities = [
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

// Example UI configuration using new generic property names
const uiConfig = {
	matchingFrom: [
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
	matchingTo: [
		{
			name: 'category',
			conditions: [
				{
					condition: UIConditionType.IS,
					type: UIComponentType.SELECT,
				},
			],
			values: ['Indoor furniture'],
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
			values: ['500000'],
		},
	],
};

async function runExample() {
	try {
		// Validate the UI configuration
		validateUIConfiguration(uiConfig);

		// Convert UI configuration to internal rules
		const { fromRules, toRules } = convertUIConfigurationToRules(uiConfig);

		// Initialize rule engine with default configuration
		const ruleEngine = new RuleEngine();

		// Process the configuration
		const result = await ruleEngine.processConfig(
			{
				id: 'example',
				name: 'Example Rule Matching',
				ruleSet: {
					fromRules,
					toRules,
				},
				isActive: true,
				createdAt: new Date(),
				updatedAt: new Date(),
			},
			entities,
		);

		console.log('Matching From:', result.fromEntities);
		console.log('Matching To:', result.toEntities);

		return result;
	} catch (error) {
		console.error('Error processing rules:', error);
		throw error;
	}
}

runExample().catch(console.error);

export { runExample, uiConfig };
