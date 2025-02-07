/**
 * Example implementation demonstrating the usage of the rule engine with UI configuration.
 * Shows how to set up entities, configure rules, and process matches.
 *
 * @module example
 */

import { RuleEngine } from '../services/rule-engine';
import { UIConditionType, UIComponentType } from './types';
import { convertUIConfigurationToRules, validateUIConfiguration } from './converter';

/**
 * Sample entities representing furniture items with different attributes.
 * Demonstrates the structure required for rule matching.
 *
 * @example
 * Each entity must have:
 * - Unique id
 * - Display name
 * - Validated attributes
 */
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

/**
 * Example UI configuration demonstrating rule setup for furniture matching.
 * Shows how to configure both 'from' and 'to' matching rules.
 *
 * @remarks
 * This configuration demonstrates:
 * - Category-based matching using SELECT components
 * - Price-based matching using TEXT components with max values
 * - Multiple conditions per rule set
 * - Different matching criteria for source and target entities
 *
 * @example
 * The rules will match:
 * - From: Outdoor furniture with price <= 1,500,000
 * - To: Indoor furniture with price <= 500,000
 */
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

/**
 * Executes the example rule matching process.
 * Demonstrates the complete workflow from validation to result processing.
 *
 * @returns {Promise<{ fromEntities: Entity[]; toEntities: Entity[] }>} Matching results
 * @throws {UIConfigurationError} If configuration validation fails
 * @throws {Error} If rule processing fails
 *
 * @remarks
 * The function demonstrates:
 * 1. Configuration validation
 * 2. UI to internal rule conversion
 * 3. Rule engine initialization
 * 4. Rule processing
 * 5. Error handling
 *
 * @example
 * ```typescript
 * try {
 *   const result = await runExample();
 *   console.log('Matching entities:', result);
 * } catch (error) {
 *   console.error('Example failed:', error);
 * }
 * ```
 */
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

/**
 * Exports the example implementation for testing and demonstration.
 *
 * @exports
 * @property {Function} runExample - Function to execute the example
 * @property {UIRuleConfiguration} uiConfig - Sample UI configuration
 */
export { runExample, uiConfig };
