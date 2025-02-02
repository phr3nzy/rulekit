# RuleKit - Dynamic Product Rule Engine

A powerful, type-safe, and flexible rule engine for product filtering and cross-selling recommendations in TypeScript/JavaScript applications.

[![Coverage](https://img.shields.io/badge/coverage-98.94%25-brightgreen.svg)](https://github.com/yourusername/rulekit)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🌟 Features

- **Type-Safe Rule Definitions**: Full TypeScript support with strict type checking
- **Dynamic Attribute Handling**: Support for products with dynamic, user-defined attributes
- **Flexible Rule Composition**: Combine rules using AND/OR conditions with unlimited nesting
- **High Performance**: Optimized evaluation with caching support
- **Comprehensive Validation**: Built-in validation for rules and configurations
- **Cross-Selling Support**: Built-in support for product recommendations and cross-selling
- **Memory Efficient**: Optional TTL and max items for cache management
- **100% Test Coverage**: All critical paths are thoroughly tested

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

// 1. Define your product attributes
const registry = new ProductAttributeRegistry();
registry.register('price', { type: 'number', required: true });
registry.register('category', { type: 'string', required: true });
registry.register('brand', { type: 'string', required: true });

// 2. Create products with dynamic attributes
const products = [
	{
		id: '1',
		name: 'Gaming Laptop',
		attributes: {
			price: 1299.99,
			category: 'Electronics',
			brand: 'TechBrand',
			__validated: true,
		},
	},
	// ... more products
];

// 3. Create a rule engine instance
const engine = new RuleEngine({
	enableCaching: true,
	cacheTTL: 3600, // 1 hour
	maxCacheItems: 1000,
});

// 4. Define cross-selling rules
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

// 5. Find recommendations
const recommendations = await engine.findRecommendations(products, config);
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
registry.register('price', {
	type: 'number',
	required: true,
	min: 0,
});

// String attribute with validation
registry.register('sku', {
	type: 'string',
	required: true,
	pattern: /^[A-Z]{2}-\d{6}$/,
});

// Enum attribute
registry.register('status', {
	type: 'enum',
	values: ['active', 'discontinued', 'upcoming'],
});

// Array attribute
registry.register('tags', {
	type: 'array',
	itemType: 'string',
	minLength: 1,
	maxLength: 10,
});

// Custom validation
registry.register('discount', {
	type: 'number',
	validate: (value, product) => {
		if (value > product.attributes.price) {
			throw new Error('Discount cannot be greater than price');
		}
		return true;
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
	cacheTTL: 3600,
	maxCacheItems: 1000,
	maxBatchSize: 100,
});

// Evaluate a single product against a rule
const matches = await engine.evaluateRule(product, rule);

// Evaluate multiple products against a rule
const results = await engine.evaluateRuleBatch(products, rule);

// Find matching source products
const sourceProducts = await engine.findSourceProducts(products, config);

// Find recommended products
const recommendations = await engine.findRecommendations(products, config);

// Clear cache
await engine.clearCache();
```

### Cross-Selling Configuration

```typescript
const crossSellConfig = {
	id: 'premium-accessories',
	name: 'Premium Accessories Cross-Sell',
	description: 'Recommend premium accessories for high-end products',
	ruleSet: {
		sourceRules: [
			{
				and: [
					{ category: { eq: 'Electronics' } },
					{ price: { gte: 1000 } },
					{ brand: { in: ['Apple', 'Samsung', 'Sony'] } },
				],
			},
		],
		recommendationRules: [
			{
				and: [
					{ category: { eq: 'Accessories' } },
					{ price: { between: [50, 500] } },
					{ rating: { gte: 4 } },
				],
			},
		],
	},
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};
```

## 🔧 Configuration Options

### Rule Engine Options

```typescript
interface RuleEngineOptions {
	enableCaching?: boolean; // Enable/disable caching
	cacheTTL?: number; // Cache TTL in seconds
	maxCacheItems?: number; // Maximum items in cache
	maxBatchSize?: number; // Maximum batch size for processing
	cacheKeyPrefix?: string; // Prefix for cache keys
}
```

### Attribute Types

```typescript
type AttributeType = 'string' | 'number' | 'enum' | 'array';

interface AttributeDefinition {
	type: AttributeType;
	required?: boolean;
	min?: number; // For numbers
	max?: number; // For numbers
	pattern?: RegExp; // For strings
	values?: string[]; // For enums
	itemType?: string; // For arrays
	minLength?: number; // For arrays/strings
	maxLength?: number; // For arrays/strings
	validate?: (value: any, product: Product) => boolean;
}
```

## 🔍 Advanced Features

### Custom Validation Functions

```typescript
registry.register('margin', {
	type: 'number',
	validate: (value, product) => {
		const { price, cost } = product.attributes;
		if (value !== ((price - cost) / price) * 100) {
			throw new Error('Invalid margin calculation');
		}
		return true;
	},
});
```

### Complex Rule Patterns

```typescript
const seasonalRule = {
	or: [
		{
			and: [
				{ category: { eq: 'Seasonal' } },
				{ season: { eq: 'Summer' } },
				{
					or: [{ price: { lt: 50 } }, { rating: { gte: 4.5 } }],
				},
			],
		},
		{
			and: [{ category: { eq: 'Clearance' } }, { stock: { lt: 10 } }, { margin: { gt: 30 } }],
		},
	],
};
```

### Batch Processing with Progress

```typescript
const engine = new RuleEngine({
	maxBatchSize: 1000,
	onBatchProgress: (processed, total) => {
		console.log(`Processed ${processed} of ${total} items`);
	},
});
```

### Cache Management

```typescript
// Configure cache
const engine = new RuleEngine({
	enableCaching: true,
	cacheTTL: 3600,
	maxCacheItems: 10000,
	cacheKeyPrefix: 'prod:rules:',
});

// Monitor cache stats
const stats = await engine.getCacheStats();
console.log(`
	Hits: ${stats.hits}
	Misses: ${stats.misses}
	Items: ${stats.items}
	Memory: ${stats.memoryUsage}MB
`);

// Clear specific keys
await engine.clearCachePattern('prod:rules:electronics:*');
```

## 🚀 Performance Tips

1. **Enable Caching**

   - Use caching for frequently accessed rules
   - Set appropriate TTL based on data update frequency
   - Monitor cache hit/miss ratios

2. **Batch Processing**

   - Use batch processing for large datasets
   - Adjust `maxBatchSize` based on memory constraints
   - Implement progress tracking for long-running operations

3. **Rule Optimization**

   - Place most discriminating conditions first
   - Use simple conditions before complex ones
   - Minimize deep nesting of conditions

4. **Memory Management**
   - Set appropriate `maxCacheItems` limit
   - Clear cache periodically
   - Monitor memory usage

## 🧪 Testing

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run performance benchmarks
pnpm benchmark
```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by various rule engines and product recommendation systems
- Built with TypeScript and modern JavaScript features
- Thoroughly tested with Vitest
- Optimized for modern e-commerce applications
