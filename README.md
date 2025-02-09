# RuleKit

A powerful and flexible toolkit for building rule-based matching and filtering systems with full TypeScript support.

[![npm version](https://badge.fury.io/js/@phr3nzy%2Frulekit.svg)](https://badge.fury.io/js/@phr3nzy%2Frulekit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Type-Safe**: Full TypeScript support with generic type inference
- 🚀 **High Performance**: 47K+ ops/sec for real-world scenarios
- 🔍 **Flexible Matching**: Support for complex rule combinations
- 📦 **Zero Dependencies**: Lightweight and efficient
- 🔒 **Validation**: Built-in schema validation
- 🔄 **Batch Processing**: Optimized for large datasets

## Installation

```bash
# Using npm
npm install @phr3nzy/rulekit

# Using yarn
yarn add @phr3nzy/rulekit

# Using pnpm
pnpm add @phr3nzy/rulekit
```

## Quick Start (v3)

```typescript
import { v3 } from '@phr3nzy/rulekit';
const { AttributeType, TypedRuleEngine } = v3;

// 1. Define your schema
type ProductSchema = {
	category: {
		type: typeof AttributeType.STRING;
		validation: {
			type: typeof AttributeType.STRING;
			required: true;
			enum: ['electronics', 'furniture'];
		};
	};
	price: {
		type: typeof AttributeType.NUMBER;
		validation: {
			type: typeof AttributeType.NUMBER;
			required: true;
			min: 0;
		};
	};
	tags: {
		type: typeof AttributeType.ARRAY;
		validation: {
			type: typeof AttributeType.ARRAY;
			arrayType: typeof AttributeType.STRING;
			required: false;
		};
	};
} & v3.AttributeSchema;

// 2. Create schema instance
const productSchema: ProductSchema = {
	category: {
		type: AttributeType.STRING,
		validation: {
			type: AttributeType.STRING,
			required: true,
			enum: ['electronics', 'furniture'],
		},
	},
	price: {
		type: AttributeType.NUMBER,
		validation: {
			type: AttributeType.NUMBER,
			required: true,
			min: 0,
		},
	},
	tags: {
		type: AttributeType.ARRAY,
		validation: {
			type: AttributeType.ARRAY,
			arrayType: AttributeType.STRING,
			required: false,
		},
	},
};

// 3. Create engine
const engine = new TypedRuleEngine(productSchema);

// 4. Define entities
const entities: v3.TypedEntity<ProductSchema>[] = [
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
	{
		id: '2',
		name: 'Office Chair',
		attributes: {
			category: 'furniture',
			price: 299,
			tags: ['office', 'ergonomic'],
			__validated: true,
		},
	},
];

// 5. Define rules
const rules: v3.TypedRule<ProductSchema>[] = [
	{
		and: [
			{
				attributes: {
					category: { eq: 'electronics' },
					price: { gte: 1000 },
				},
			},
			{
				attributes: {
					tags: { in: ['premium'] },
				},
			},
		],
	},
];

// 6. Find matches
const matches = engine.findMatchingFrom(entities, rules);
console.debug(matches); // [{ id: '1', name: 'Gaming Laptop', ... }]
```

## Features

### Type-Safe Schema Definition

```typescript
import { v3 } from '@phr3nzy/rulekit';

type UserSchema = {
	role: {
		type: typeof v3.AttributeType.ENUM;
		validation: {
			type: typeof v3.AttributeType.ENUM;
			required: true;
			enum: ['admin', 'user', 'guest'];
		};
	};
	permissions: {
		type: typeof v3.AttributeType.ARRAY;
		validation: {
			type: typeof v3.AttributeType.ARRAY;
			arrayType: typeof v3.AttributeType.STRING;
			required: true;
		};
	};
} & v3.AttributeSchema;
```

### Complex Rule Combinations

```typescript
const rules: v3.TypedRule<UserSchema>[] = [
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
const engine = new v3.TypedRuleEngine(schema, {
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
