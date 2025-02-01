# RuleKit

A powerful and flexible toolkit for building rule-based product recommendations and dynamic filtering. Built with TypeScript and designed for high performance.

## Features

- 🚀 High Performance: Optimized for large datasets with batch processing
- 💾 Built-in Caching: Memory-based caching with TTL support
- 🔍 Type-Safe: Full TypeScript support with comprehensive type definitions
- 🧩 Flexible Rules: Support for complex nested AND/OR conditions
- 📦 Minimal Dependencies: Uses Zod for schema validation
- 🔄 Cross-Selling: Built-in support for cross-selling configurations
- 📊 Benchmarks: Includes performance benchmarks
- 🧪 Well Tested: Comprehensive test suite with high coverage

## Installation

```bash
# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit

# Using pnpm
pnpm add @phr3nzy/rulekit
```

## Quick Start

```typescript
import { RuleEngine, type Product, type Rule } from '@phr3nzy/rulekit';

// Initialize the engine (with default memory cache)
const engine = new RuleEngine();

// Define your products
const products: Product[] = [
	{
		id: '1',
		name: 'Laptop',
		price: 1200,
		category: 'Electronics',
		brand: 'TechBrand',
	},
	{
		id: '2',
		name: 'Laptop Bag',
		price: 50,
		category: 'Accessories',
		brand: 'BagBrand',
	},
];

// Define your rules
const rules: Rule[] = [
	{
		and: [{ category: { eq: 'Electronics' } }, { price: { gt: 1000 } }],
	},
];

// Find matching products
const matchingProducts = await engine.findSourceProducts(products, rules);
console.log(matchingProducts); // [{ id: '1', name: 'Laptop', ... }]
```

## Cross-Selling Example

```typescript
import { RuleEngine, type CrossSellingConfig } from '@phr3nzy/rulekit';

const config: CrossSellingConfig = {
	id: 'cs1',
	name: 'Electronics with Accessories',
	ruleSet: {
		sourceRules: [{ category: { eq: 'Electronics' } }],
		recommendationRules: [
			{
				and: [{ category: { eq: 'Accessories' } }, { price: { lt: 100 } }],
			},
		],
	},
	isActive: true,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const { sourceProducts, recommendedProducts } = await engine.processConfig(config, products);
```

## Advanced Usage

### Custom Cache Implementation

```typescript
import { RuleEngine, type ICache } from '@phr3nzy/rulekit';

class RedisCache implements ICache {
	// Implement the ICache interface
}

const cache = new RedisCache();
const engine = new RuleEngine({ cache });
```

### Batch Processing

```typescript
import { RuleEngine } from '@phr3nzy/rulekit';

const engine = new RuleEngine({
	maxBatchSize: 1000, // Process products in batches of 1000
});
```

### Available Operators

- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `in`: In array
- `notIn`: Not in array

### Complex Rules

```typescript
const complexRule: Rule = {
	or: [
		{
			and: [
				{ category: { eq: 'Electronics' } },
				{ price: { gt: 1000 } },
				{ brand: { eq: 'TechBrand' } },
			],
		},
		{
			and: [
				{ category: { eq: 'Accessories' } },
				{ price: { lt: 100 } },
				{ brand: { in: ['TechBrand', 'Brand1'] } },
			],
		},
	],
};
```

## Performance

The engine includes built-in performance benchmarks that you can run:

```bash
pnpm bench
```

Sample benchmark results:

- Simple rule evaluation (1000 products): ~9,200 ops/sec
- Complex nested rules (1000 products): ~40 ops/sec
- Large product set (10000 products): ~170 ops/sec
- Cache performance (repeated queries): ~4,800 ops/sec

### Future Performance Improvements

While the current implementation is highly optimized, there are several areas identified for potential future performance enhancements:

1. **Parallel Processing**: Implementing worker threads for batch processing
2. **Rule Optimization**: Pre-processing rules to optimize evaluation order
3. **Cache Strategies**: Advanced caching strategies for specific use cases
4. **Memory Management**: Fine-tuned memory management for very large datasets
5. **Rule Validation**: Replacing Zod with a more performant validation library/implementation

These improvements will be explored in future releases while maintaining the current high test coverage and type safety.

## API Reference

### RuleEngine

```typescript
class RuleEngine {
	constructor(config?: {
		cache?: ICache;
		evaluator?: IRuleEvaluator;
		enableCaching?: boolean;
		cacheTTLSeconds?: number;
		maxBatchSize?: number;
	});

	findSourceProducts(products: Product[], rules: Rule[]): Promise<Product[]>;
	findRecommendedProducts(
		sourceProducts: Product[],
		recommendationRules: Rule[],
		allProducts: Product[],
	): Promise<Product[]>;
	processConfig(
		config: CrossSellingConfig,
		products: Product[],
	): Promise<{ sourceProducts: Product[]; recommendedProducts: Product[] }>;
	clearCache(): Promise<void>;
}
```

### Rule Types

```typescript
type Rule = {
	[K in ProductAttribute]?: BaseFilter;
} & {
	and?: Rule[];
	or?: Rule[];
};

type BaseFilter = {
	[K in ComparisonOperator]?: RuleValue;
};

type RuleValue = string | number | boolean | Array<string | number>;
```

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
