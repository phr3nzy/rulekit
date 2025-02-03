# RuleKit - Dynamic Product Rule Engine

A powerful, type-safe, and flexible rule engine for product filtering and cross-selling recommendations in TypeScript/JavaScript applications.

[![CI](https://github.com/phr3nzy/rulekit/actions/workflows/ci.yml/badge.svg)](https://github.com/phr3nzy/rulekit/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/phr3nzy/rulekit/branch/main/graph/badge.svg)](https://codecov.io/gh/phr3nzy/rulekit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![npm](https://img.shields.io/npm/v/@phr3nzy/rulekit)](https://www.npmjs.com/package/@phr3nzy/rulekit)

## 🌟 Features

- **Type-Safe Rule Definitions**: Full TypeScript support with strict type checking
- **Dynamic Attribute Handling**: Support for products with dynamic, user-defined attributes
- **Flexible Rule Composition**: Combine rules using AND/OR conditions with unlimited nesting
- **Comprehensive Validation**: Built-in validation for rules and configurations
- **Cross-Selling Support**: Built-in support for product recommendations and cross-selling
- **Memory Efficient**: Optional TTL and max items for cache management
- **Thoroughly Tested**: Comprehensive test suite with high code coverage

## 📦 Installation

```bash
# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit

# Using pnpm
pnpm add @phr3nzy/rulekit
```

## 🚀 Quick Start

```typescript
import { RuleEngine, ProductAttributeRegistry } from '@phr3nzy/rulekit';

// 1. Create an attribute registry
const registry = new ProductAttributeRegistry();

// 2. Register product attributes with validation
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

// 3. Create products with validated attributes
const products = [
	{
		id: '1',
		name: 'Gaming Laptop',
		attributes: {
			price: 1299.99,
			category: 'Electronics',
		},
	},
	// ... more products
];

// 4. Create a rule engine instance with configuration
const engine = new RuleEngine({
	enableCaching: true,
	cacheTTLSeconds: 3600, // 1 hour
	maxBatchSize: 1000,
});

// 5. Define cross-selling configuration
const config = {
	id: 'gaming-accessories',
	name: 'Gaming Accessories Cross-Sell',
	description: 'Recommend gaming accessories for gaming laptops',
	ruleSet: {
		sourceRules: [
			{
				and: [{ category: { eq: 'Electronics' } }, { price: { gte: 1000 } }],
			},
		],
		recommendationRules: [
			{
				and: [{ category: { eq: 'Accessories' } }, { price: { lt: 200 } }],
			},
		],
	},
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// 6. Process recommendations
const { sourceProducts, recommendedProducts } = await engine.processConfig(products, config);
```

## 🎯 Key Benefits

1. **Flexible Product Attributes**

   - Define any attribute for your products
   - Strong type validation
   - Custom validation rules
   - Runtime type checking

2. **Powerful Rule Engine**

   - Simple and intuitive rule syntax
   - Combine multiple conditions
   - Support for all common operators:
     - Equality: `eq`, `ne`
     - Numeric: `gt`, `gte`, `lt`, `lte`
     - Arrays: `in`, `notIn`

3. **Performance Optimized**

   - Built-in caching mechanism
   - Batch processing support
   - Memory usage controls
   - Efficient rule evaluation

4. **Developer Experience**
   - Full TypeScript support
   - Comprehensive error messages
   - Extensive documentation
   - 100% test coverage

## 📖 Detailed Usage

### Defining Product Attributes

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
	enableCaching: true,
	cacheTTLSeconds: 3600,
	maxBatchSize: 1000,
});

// Find matching source products
const sourceProducts = await engine.findSourceProducts(products, rules);

// Find recommended products
const recommendedProducts = await engine.findRecommendedProducts(
	sourceProducts,
	recommendationRules,
	allProducts,
);

// Process a complete cross-selling configuration
const results = await engine.processConfig(config, products);

// Clear cache
await engine.clearCache();
```

## 🔧 Configuration Options

### Rule Engine Options

```typescript
interface RuleEngineConfig {
	enableCaching?: boolean; // Enable/disable caching
	cacheTTLSeconds?: number; // Cache TTL in seconds
	maxBatchSize?: number; // Maximum batch size for processing
	cache?: Cache; // Custom cache implementation
	evaluator?: RuleEvaluator; // Custom rule evaluator
}
```

### Attribute Types

```typescript
interface AttributeDefinition {
	name: string;
	type: 'string' | 'number' | 'boolean';
	validation: {
		required?: boolean;
		min?: number; // For numbers
		max?: number; // For numbers
		pattern?: RegExp; // For strings
		custom?: (value: any, attributes: Record<string, unknown>) => boolean | Promise<boolean>;
	};
}
```

## 🤝 Contributing

We welcome contributions to RuleKit! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

RuleKit is [MIT licensed](LICENSE).

## 🙏 Acknowledgments

- Inspired by various rule engines and product recommendation systems
- Built with TypeScript and modern JavaScript features
- Thoroughly tested with Vitest
- Optimized for modern e-commerce applications
