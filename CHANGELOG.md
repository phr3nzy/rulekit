# Changelog

## [3.0.0] - 2025-02-08

### Added

- Complete type-safe implementation with generic support
- New v3 API with improved type inference
- Enhanced rule engine with better performance
- Support for array conditions with element-level matching
- Comprehensive test coverage and benchmarks
- Type-safe schema validation
- Improved batch processing with dynamic sizing

### Changed

- Moved v2 implementation to legacy exports
- Updated core types to support generic schemas
- Improved rule evaluation performance
- Enhanced array matching behavior

### Breaking Changes

- New v3 API uses different import path (`import { v3 } from '@phr3nzy/rulekit'`)
- Type-safe schemas require explicit type definitions
- Array conditions now support both element and array-level matching
- Rule evaluation now validates against schema types

### Performance

- Real-world entity matching (100 entities): 47,603 ops/sec
- Simple rules (1000 entities): 936 ops/sec
- Complex rules (1000 entities): 260 ops/sec
- Large dataset (10000 entities): 87 ops/sec

### Migration Guide

#### 1. Update Imports

```typescript
// Before (v2)
import { RuleEngine } from '@phr3nzy/rulekit';

// After (v3)
import { v3 } from '@phr3nzy/rulekit';
const { TypedRuleEngine } = v3;
```

#### 2. Define Type-Safe Schema

```typescript
import { v3 } from '@phr3nzy/rulekit';
const { AttributeType } = v3;

// Define your schema with type safety
type ProductSchema = {
	category: {
		type: typeof AttributeType.STRING;
		validation: {
			type: typeof AttributeType.STRING;
			required: true;
			enum: ['electronics', 'furniture', 'clothing'];
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
} & v3.AttributeSchema;
```

#### 3. Create Type-Safe Engine

```typescript
// Create schema instance
const productSchema: ProductSchema = {
	category: {
		type: AttributeType.STRING,
		validation: {
			type: AttributeType.STRING,
			required: true,
			enum: ['electronics', 'furniture', 'clothing'],
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
};

// Create type-safe engine
const engine = new TypedRuleEngine(productSchema);
```

#### 4. Use Type-Safe Rules

```typescript
// Rules are now type-checked
const rules: v3.TypedRule<ProductSchema>[] = [
	{
		attributes: {
			category: { eq: 'electronics' }, // Type-safe: must be one of the enum values
			price: { gte: 100 }, // Type-safe: must be number
		},
	},
];

// Entities are type-checked
const entities: v3.TypedEntity<ProductSchema>[] = [
	{
		id: '1',
		name: 'Laptop',
		attributes: {
			category: 'electronics',
			price: 999,
			__validated: true,
		},
	},
];

// Find matches with type safety
const matches = engine.findMatchingFrom(entities, rules);
```

### Array Matching Improvements

The v3 release includes improved array matching that supports both element-level and array-level comparisons:

```typescript
// Match if any array element matches
const rule = {
	attributes: {
		tags: { in: ['featured', 'new'] }, // Matches if tags array contains 'featured' or 'new'
	},
};

// Match specific array elements
const rule2 = {
	attributes: {
		categories: { eq: 'electronics' }, // For non-array fields
		tags: { in: ['premium'] }, // For array fields
	},
};
```

### Backward Compatibility

V2 exports are still available for backward compatibility:

```typescript
// V2 imports still work
import { RuleEngine } from '@phr3nzy/rulekit';

// V3 recommended imports
import { v3 } from '@phr3nzy/rulekit';
```

## Previous Versions

[Previous changelog entries remain unchanged]
