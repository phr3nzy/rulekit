# RuleKit 🎯

A powerful and flexible toolkit for building intelligent filtering, matching, and rule-based systems. RuleKit combines high-performance rule evaluation with smart interface generation and data analysis.

[![npm version](https://badge.fury.io/js/@phr3nzy%2Frulekit.svg)](https://badge.fury.io/js/@phr3nzy%2Frulekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is RuleKit?

RuleKit is a comprehensive toolkit that helps you build sophisticated filtering and matching systems. It's perfect for:

- 🛍️ **E-commerce Filtering**: Create smart product filters with automatic UI generation
- 🤝 **Entity Matching**: Match entities based on complex rule combinations
- 📊 **Data Analysis**: Automatically analyze data to suggest appropriate UI components
- 🎨 **Interface Generation**: Build dynamic interfaces based on data characteristics
- 🔍 **Smart Search**: Implement advanced search with type-safe rules
- 🎯 **Business Rules**: Define and evaluate complex business rules

## Core Features

- 🎯 **Type-Safe**: Full TypeScript support with generic type inference
- 🚀 **High Performance**: 47K+ ops/sec for real-world scenarios
- 🔍 **Smart Analysis**: Automatic data analysis and component suggestion
- 🎨 **Interface Agnostic**: Flexible component system for any UI framework
- 📦 **Zero Dependencies**: Lightweight and efficient
- 🔒 **Validation**: Built-in schema validation
- 🔄 **Batch Processing**: Optimized for large datasets
- 📚 **Well Documented**: Clean, documented exports with proper versioning

## Key Components

### 1. Rule Engine

The core engine that evaluates rules against entities with high performance:

```typescript
const engine = new RuleEngine(schema);
const matches = engine.findMatchingFrom(entities, rules);
```

### 2. Data Analyzer

Automatically analyzes your data to suggest appropriate UI components:

```typescript
const analyzer = new DataAnalyzer();
const analysis = analyzer.analyze(data);
// Get insights like data types, statistics, and suggested components
```

### 3. Interface Components

Type-safe, framework-agnostic components that can be used with any UI:

```typescript
const component = {
	type: ComponentType.RANGE,
	identifier: 'price',
	value: 500,
	constraints: {
		min: 0,
		max: 1000,
		step: 1,
	},
};
```

### 4. Rule Converter

Convert UI components to rules and vice versa:

```typescript
const converter = new RuleConverter();
const rule = converter.convertComponentsToRule(components);
```

## Installation

```bash
# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit

# Using pnpm
pnpm add @phr3nzy/rulekit
```

## Exports Overview

RuleKit provides a well-organized export structure:

```typescript
// Core functionality
import { RuleEngine, AttributeType } from '@phr3nzy/rulekit';
import type { Entity, Rule, RuleSet } from '@phr3nzy/rulekit';

// Interface-agnostic components
import { ComponentType, InterfaceOperators } from '@phr3nzy/rulekit';
import type { Component, ComponentConstraints } from '@phr3nzy/rulekit';

// Data analysis
import { Analyzer, type DataStatistics } from '@phr3nzy/rulekit';

// Legacy v2 functionality (if needed)
import { v2 } from '@phr3nzy/rulekit';
```

## Quick Start

```typescript
import { AttributeType, RuleEngine, DataAnalyzer, RuleConverter } from '@phr3nzy/rulekit';

// 1. Define your data
const products = [
	{
		id: '1',
		name: 'Gaming Laptop',
		attributes: {
			category: 'electronics',
			price: 1299,
			tags: ['gaming', 'premium'],
			__validated: true,
		},
	},
	// ... more products
];

// 2. Analyze data to get smart component suggestions
const analyzer = new DataAnalyzer();
const analysis = analyzer.analyze(products.map(p => p.attributes));

// 3. Create type-safe components based on analysis
const priceAnalysis = analysis.price;
const component = {
	type: priceAnalysis.suggestedComponent.type, // RANGE
	identifier: 'price',
	value: 500,
	constraints: {
		min: priceAnalysis.statistics.numeric.min,
		max: priceAnalysis.statistics.numeric.max,
	},
};

// 4. Convert components to rules
const converter = new RuleConverter();
const rule = converter.convertComponentsToRule([{ field: 'price', component }]);

// 5. Find matches using the rule engine
const engine = new RuleEngine();
const matches = engine.findMatchingFrom(products, [rule]);
```

Check out our [examples](./examples) for more advanced usage!

## Features

### Type-Safe Schema Definition

```typescript
import { AttributeType } from '@phr3nzy/rulekit';

type UserSchema = {
	role: {
		type: typeof AttributeType.ENUM;
		validation: {
			type: typeof AttributeType.ENUM;
			required: true;
			enum: ['admin', 'user', 'guest'];
		};
	};
	permissions: {
		type: typeof AttributeType.ARRAY;
		validation: {
			type: typeof AttributeType.ARRAY;
			arrayType: typeof AttributeType.STRING;
			required: true;
		};
	};
} & AttributeSchema;
```

### Complex Rule Combinations

```typescript
const rules: Rule<UserSchema>[] = [
	{
		or: [
			{
				attributes: {
					role: { eq: 'admin' },
				},
			},
			{
				and: [
					{
						attributes: {
							role: { eq: 'user' },
							permissions: { in: ['manage_content'] },
						},
					},
				],
			},
		],
	},
];
```

### Array Matching

```typescript
// Match if any array element matches
const rule = {
	attributes: {
		tags: { in: ['featured', 'new'] }, // Matches if tags contains any of these
	},
};

// Match specific array elements
const rule2 = {
	attributes: {
		permissions: { in: ['admin_panel'] }, // For array fields
		role: { eq: 'admin' }, // For non-array fields
	},
};
```

### Batch Processing

```typescript
// Engine automatically optimizes batch size based on rule complexity
const engine = new RuleEngine(schema, {
	maxBatchSize: 1000, // Optional: customize batch size
});

// Process large datasets efficiently
const matches = engine.findMatchingFrom(largeEntityList, rules);
```

## Performance

- Real-world entity matching (100 entities): 47,603 ops/sec
- Simple rules (1000 entities): 936 ops/sec
- Complex rules (1000 entities): 260 ops/sec
- Large dataset (10000 entities): 87 ops/sec

## Migration from v2

See the [CHANGELOG.md](CHANGELOG.md) for detailed migration guide.

## License

MIT © [phr3nzy](https://github.com/phr3nzy)
