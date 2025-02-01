# @phr3nzy/rulekit

A powerful and flexible toolkit for building rule-based product recommendations and dynamic filtering. Written in TypeScript with zero runtime dependencies except for json-logic-js and zod.

## Features

- Rule-based filtering system supporting:
  - Price-based filters
  - Category-based filters
  - Brand-based filters
  - Complex combinations using AND/OR operators
- Two-part rule system:
  - Source rules for selecting main products
  - Recommendation rules for selecting products to suggest
- Type-safe with full TypeScript support
- Input validation using Zod
- Framework agnostic - use with any frontend or backend
- Zero config - just import and use
- Lightweight and tree-shakeable

## Installation

```bash
# Using pnpm (recommended)
pnpm add @phr3nzy/rulekit

# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit
```

## Usage

```typescript
import { RuleEngine, type Product, type CrossSellingRuleSet } from '@phr3nzy/rulekit';

// Initialize the rule engine
const ruleEngine = new RuleEngine();

// Define your products
const products: Product[] = [
	{
		id: '1',
		name: 'High-end Laptop',
		price: 1200,
		category: 'Electronics',
		brand: 'BrandA',
	},
	{
		id: '2',
		name: 'Laptop Bag',
		price: 80,
		category: 'Accessories',
		brand: 'BrandB',
	},
];

// Define your rules
const ruleSet: CrossSellingRuleSet = {
	sourceRules: [
		{
			and: [{ category: { eq: 'Electronics' } }, { price: { gte: 1000 } }],
		},
	],
	recommendationRules: [
		{
			and: [{ category: { eq: 'Accessories' } }, { price: { lte: 100 } }],
		},
	],
};

// Get recommendations for a product
const recommendations = ruleEngine.getRecommendations(
	products[0], // source product
	products, // available products
	ruleSet,
);

// Get recommendations for multiple products
const bulkRecommendations = ruleEngine.getBulkRecommendations(
	products, // source products
	products, // available products
	ruleSet,
);
```

## Rule Operators

The rule engine supports the following operators:

- `eq`: Equal to
- `ne`: Not equal to
- `gt`: Greater than
- `gte`: Greater than or equal to
- `lt`: Less than
- `lte`: Less than or equal to
- `in`: Value is in array
- `notIn`: Value is not in array

You can combine these operators using `and` and `or` conditions:

```typescript
const complexRule = {
	and: [
		{ category: { eq: 'Electronics' } },
		{
			or: [{ price: { gte: 1000 } }, { brand: { in: ['BrandA', 'BrandB'] } }],
		},
	],
};
```

## Benchmarks

Performance benchmarks run on a standard development machine:

| Scenario                                        | Operations/sec | Mean Time (ms) | Notes                                       |
| ----------------------------------------------- | -------------- | -------------- | ------------------------------------------- |
| Simple rule evaluation (1000 products)          | 1,767.65       | 0.57           | Fastest operation, good for basic filtering |
| Complex nested rules (1000 products, depth 3)   | 76.89          | 13.01          | Handles deep rule nesting efficiently       |
| Large dataset (10000 products) with mixed rules | 54.74          | 18.27          | Scales well with larger datasets            |
| Multiple concurrent evaluations (100 rules)     | 34.41          | 29.06          | Good for batch processing                   |
| Memory usage (100000 products)                  | 7.90           | 126.60         | Efficient memory handling                   |
| Cross-selling recommendations (1000 products)   | 3.05           | 327.53         | Most complex operation                      |

### Performance Notes

- Simple rule evaluations are extremely fast, processing 1000 products in less than 1ms
- Complex nested rules maintain good performance even with depth-3 nesting
- Large datasets (100k products) are handled efficiently with reasonable memory usage
- Cross-selling recommendations, being the most complex operation, still complete in under 330ms
- The engine scales linearly with data size, making it suitable for production use

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](./LICENSE)

## Copyright

Copyright © 2025 phr3nzy <adilosama47@gmail.com>. All rights reserved.
