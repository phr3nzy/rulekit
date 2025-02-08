# RuleKit - High-Performance Entity Rule Engine

A powerful, type-safe, and flexible rule engine for entity matching and filtering in TypeScript/JavaScript applications.

[![CI](https://github.com/phr3nzy/rulekit/actions/workflows/ci.yml/badge.svg)](https://github.com/phr3nzy/rulekit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/phr3nzy/rulekit/branch/main/graph/badge.svg)](https://codecov.io/gh/phr3nzy/rulekit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@phr3nzy/rulekit)](https://www.npmjs.com/package/@phr3nzy/rulekit)

## 🌟 Features

- **High Performance**: Optimized synchronous operations with 54,000+ ops/sec for real-world scenarios
- **Type-Safe Rule Definitions**: Full TypeScript support with strict type checking
- **Dynamic Attribute Handling**: Support for entities with dynamic, user-defined attributes
- **Flexible Rule Composition**: Combine rules using AND/OR conditions with unlimited nesting
- **Comprehensive Validation**: Built-in validation for rules and configurations
- **Bidirectional Matching**: Built-in support for matching entities in both directions
- **Production Ready**: Thoroughly tested with 100% code coverage and comprehensive benchmarks

## 📦 Installation

```bash
# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit

# Using pnpm (recommended)
pnpm add @phr3nzy/rulekit
```

## 🚀 Quick Start

```typescript
import { RuleEngine, AttributeRegistry } from '@phr3nzy/rulekit';

// 1. Create an attribute registry for validation
const registry = new AttributeRegistry();

// 2. Register entity attributes with validation rules
registry.registerAttribute({
	name: 'price',
	type: 'number',
	validation: {
		required: true,
		min: 0,
	},
});

registry.registerAttribute({
	name: 'category',
	type: 'string',
	validation: {
		required: true,
	},
});

// 3. Create and validate entities
const entity = {
	id: '1',
	name: 'Gaming Laptop',
	attributes: {
		price: 1299.99,
		category: 'Electronics',
		__validated: true,
	},
};

// Validate product attributes
registry.validateAttributes(entity.attributes);

const entities = [entity];

// 4. Create a rule engine instance
const engine = new RuleEngine({
	maxBatchSize: 1000,
});

// 5. Define matching configuration
const config = {
	id: 'gaming-accessories',
	name: 'Gaming Accessories Matching',
	description: 'Match gaming laptops with compatible accessories',
	ruleSet: {
		fromRules: [
			{
				and: [
					{ attributes: { category: { eq: 'Electronics' } } },
					{ attributes: { price: { gte: 1000 } } },
				],
			},
		],
		toRules: [
			{
				and: [
					{ attributes: { category: { eq: 'Accessories' } } },
					{ attributes: { price: { lt: 200 } } },
				],
			},
		],
	},
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// 6. Process matching (now synchronous!)
const { fromEntities, toEntities } = engine.processConfig(config, entities);
```

## 🎯 Key Benefits

1. **Blazing Fast Performance**

   - 54,000+ operations per second for real-world scenarios
   - Optimized synchronous operations
   - Smart batch processing
   - Efficient rule evaluation

2. **Flexible Entity Attributes**

   - Define any attribute for your entities
   - Strong type validation
   - Custom validation rules
   - Runtime type checking

3. **Powerful Rule Engine**

   - Simple and intuitive rule syntax
   - Combine multiple conditions
   - Support for all common operators:
     - Equality: `eq`, `ne`
     - Numeric: `gt`, `gte`, `lt`, `lte`
     - Arrays: `in`, `notIn`

4. **Developer Experience**
   - Full TypeScript support
   - Comprehensive error messages
   - Extensive documentation
   - 100% test coverage

## 📖 Detailed Usage

### Defining Entity Attributes

```typescript
const registry = new ProductAttributeRegistry();

// Simple attribute
registry.registerAttribute({
	name: 'price',
	type: 'number',
	validation: {
		required: true,
		min: 0,
	},
});

// String attribute with validation
registry.registerAttribute({
	name: 'sku',
	type: 'string',
	validation: {
		required: true,
		pattern: /^[A-Z]{2}-\d{6}$/,
	},
});

// Custom validation
registry.registerAttribute({
	name: 'discount',
	type: 'number',
	validation: {
		custom: (value, attributes) => {
			if (value > attributes.price) {
				throw new Error('Discount cannot be greater than price');
			}
			return true;
		},
	},
});
```

### Creating Rules

```typescript
// Simple rule
const simpleRule = {
	price: { gt: 1000 },
	category: { eq: 'Electronics' },
};

// AND condition
const andRule = {
	and: [
		{ price: { gt: 1000 } },
		{ category: { eq: 'Electronics' } },
		{ brand: { in: ['Apple', 'Samsung'] } },
	],
};

// OR condition
const orRule = {
	or: [{ category: { eq: 'Electronics' } }, { price: { lt: 50 } }],
};

// Complex nested rule
const complexRule = {
	or: [
		{
			and: [
				{ category: { eq: 'Electronics' } },
				{ price: { gt: 1000 } },
				{ brand: { in: ['Apple', 'Samsung'] } },
			],
		},
		{
			and: [
				{ category: { eq: 'Accessories' } },
				{ price: { lt: 100 } },
				{ brand: { notIn: ['Generic'] } },
			],
		},
	],
};
```

### Using the Rule Engine

```typescript
const engine = new RuleEngine({
	maxBatchSize: 1000,
});

// Find matching "from" entities (synchronous)
const fromEntities = engine.findMatchingFrom(entities, rules);

// Find matching "to" entities (synchronous)
const toEntities = engine.findMatchingTo(fromEntities, toRules, allEntities);

// Process a complete matching configuration (synchronous)
const results = engine.processConfig(config, entities);
```

## 🔧 Configuration Options

### Rule Engine Options

```typescript
/**
 * Configuration options for the RuleEngine
 */
interface RuleEngineConfig {
	/**
	 * Custom rule evaluator implementation
	 * @default BaseRuleEvaluator
	 */
	evaluator?: RuleEvaluator;

	/**
	 * Maximum number of entities to process in a single batch
	 * @default 1000
	 */
	maxBatchSize?: number;
}
```

### Attribute Types

```typescript
/**
 * Definition for an entity attribute
 */
interface AttributeDefinition {
	/**
	 * Name of the attribute
	 */
	name: string;

	/**
	 * Type of the attribute
	 */
	type: 'string' | 'number' | 'boolean';

	/**
	 * Validation rules for the attribute
	 */
	validation: {
		/**
		 * Whether the attribute is required
		 */
		required?: boolean;

		/**
		 * Minimum value (for numbers)
		 */
		min?: number;

		/**
		 * Maximum value (for numbers)
		 */
		max?: number;

		/**
		 * Pattern to match (for strings)
		 */
		pattern?: RegExp;

		/**
		 * Custom validation function
		 */
		custom?: (value: unknown, attributes: Record<string, unknown>) => boolean;
	};
}
```

## ⚡ Performance

RuleKit v2.0+ delivers exceptional performance through synchronous operations:

- Real-world entity matching (100 entities): 54,102 ops/sec
- Complex nested rules (1000 entities): 2,276 ops/sec
- Large dataset processing (10000 entities): 247 ops/sec
- Matching with multiple entities: 2,392 ops/sec

These benchmarks were conducted on:

- Node.js v20.x
- Intel Core i9 processor
- 32GB RAM
- Ubuntu Linux

## ⚠️ Important Notes

### Attribute Validation

The `AttributeRegistry` and `RuleEngine` are separate components that work together:

1. The registry provides attribute validation but does not automatically integrate with the rule engine
2. You must validate entity attributes before using them with the rule engine
3. Ensure that rules only reference attributes that are registered
4. Consider validating entities before adding them to your entity pool

Best practices:

```typescript
/**
 * Example of proper entity validation workflow
 */

// 1. Always validate entities before using them
const entity = {
	id: '1',
	name: 'Entity',
	attributes: {
		price: 100,
		category: 'Electronics',
	},
};

// Validate before use
registry.validateAttributes(entity.attributes);

// 2. Validate your rule attributes match registered ones
const rule = {
	attributes: {
		price: { gt: 50 }, // ✅ 'price' is registered
		unknown: { eq: true }, // ❌ 'unknown' is not registered
	},
};

// 3. Consider wrapping entity creation with validation
function createEntity(data: Partial<Entity>): Entity {
	registry.validateAttributes(data.attributes);
	return data as Entity;
}
```

## 🤝 Contributing

We welcome contributions to RuleKit! Our development process is designed for quality and efficiency:

1. **Automated CI/CD**

   - Comprehensive test suite with 100% coverage requirement
   - Automated performance benchmarking
   - Code quality checks and linting
   - Codecov integration for coverage tracking

2. **Development Workflow**

   - Fork the repository
   - Create a feature branch
   - Add tests for new features
   - Ensure all tests pass locally
   - Submit a pull request

3. **Pull Request Process**
   - Automated CI checks run on every PR
   - Coverage must be maintained or improved
   - Performance benchmarks must not regress
   - Code review by maintainers

See our [Contributing Guide](CONTRIBUTING.md) for detailed instructions.

## 📄 License

RuleKit is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

- Built with TypeScript and modern JavaScript features
- Thoroughly tested with Vitest
- Optimized for high-performance applications
- Community-driven improvements and feedback
