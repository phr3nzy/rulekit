# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0] - 2025-02-16

### Improved

- Enhanced export organization:
  - Better grouping of related exports
  - Improved JSDoc documentation
  - Clearer deprecation notices
  - Separated v2 legacy exports into dedicated file

### Changed

- Moved v2 namespace to dedicated file for better maintainability
- Enhanced type exports organization
- Improved code organization and documentation
- Better separation of concerns between v2 and v3 exports

### Documentation

- Added comprehensive JSDoc documentation for all exports
- Improved type documentation and examples
- Enhanced deprecation notices with migration guidance
- Updated export structure documentation

## [3.2.0] - 2025-02-16

### Added

- New interface-agnostic component system that can be used across different interfaces (web, terminal, etc.)
- Data analysis system that automatically suggests appropriate components based on data characteristics
- Generic adapter system for converting components to different interface implementations
- Smart component suggestion based on data type and statistics
- Comprehensive statistics generation for numeric and categorical data
- Support for range, choice, multi-select, and input components
- Type-safe component handling with proper TypeScript support
- Backward compatibility with existing UI configuration through converters

### Changed

- Refactored UI subsystem to be interface-agnostic
- Improved type safety across the entire codebase
- Enhanced rule conversion with support for more comparison operators
- Better handling of numeric ranges and categorical data
- More flexible component constraints and validation

### Deprecated

- UI-specific components (UIConditionType, UIComponentType, etc.)
- UI configuration converter
- UI example implementation

### Migration Note

The old UI-specific components are now deprecated in favor of the new interface-agnostic system. While the old components will continue to work in this version, they will be removed in a future major release. We recommend migrating to the new system which provides better type safety and more flexibility.

Example migration:

```typescript
// Before
import { UIComponentType, UIConditionType } from '@phr3nzy/rulekit';

const component = {
	type: UIComponentType.RANGE,
	field: 'price',
	value: [0, 1000],
};

// After
import { ComponentType } from '@phr3nzy/rulekit';

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

The new system provides:

- Better type safety with proper TypeScript support
- More flexible component constraints
- Automatic component suggestions based on data analysis
- Support for different interface implementations
- Enhanced validation and error handling

## [3.1.0] - 2025-02-16

### Changed

- Restructured exports to make v3 the main API:
  - v3 functionality now available at root level
  - v2 functionality moved to `v2` namespace
  - Better organization of legacy exports
  - Enhanced type safety and import experience
- Minimum node version is now 18

### Improved

- Enhanced project organization:
  - Cleaner export structure
  - Better namespace organization
  - Restored complete changelog history
  - Improved test file organization

### Migration Note

The v3 API is now available directly from the root:

```typescript
// Before
import { v3 } from '@phr3nzy/rulekit';
const { TypedRuleEngine } = v3;

// After
import { RuleEngine } from '@phr3nzy/rulekit';
```

Legacy v2 functionality remains available through the v2 namespace:

```typescript
// Before
import { RuleEngine } from '@phr3nzy/rulekit';

// After
import { v2 } from '@phr3nzy/rulekit';
const { RuleEngine } = v2.ruleEngine;
```

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

- New v3 API is now available at root level
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
import { RuleEngine, AttributeType } from '@phr3nzy/rulekit';
```

#### 2. Define Type-Safe Schema

```typescript
import { AttributeType } from '@phr3nzy/rulekit';
import type { AttributeSchema } from '@phr3nzy/rulekit';

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
} & AttributeSchema;
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
const engine = new RuleEngine(productSchema);
```

#### 4. Use Type-Safe Rules

```typescript
// Rules are now type-checked
const rules: Rule<ProductSchema>[] = [
	{
		attributes: {
			category: { eq: 'electronics' }, // Type-safe: must be one of the enum values
			price: { gte: 100 }, // Type-safe: must be number
		},
	},
];

// Entities are type-checked
const entities: Entity<ProductSchema>[] = [
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

V2 exports are still available through the v2 namespace:

```typescript
// Before
import { RuleEngine } from '@phr3nzy/rulekit';

// After
import { v2 } from '@phr3nzy/rulekit';
const { RuleEngine } = v2.ruleEngine;
```

## [2.0.2] - 2025-02-08

### Improved

- Enhanced documentation:
  - Updated performance metrics and benchmarks
  - Improved code examples to reflect synchronous API
  - Added detailed performance section
  - Enhanced contributing guidelines
  - Added CI/CD pipeline details
  - Updated feature list to highlight performance
  - Added recommended installation method (pnpm)

## [2.0.1] - 2025-02-08

### Improved

- Enhanced CI/CD pipeline:
  - Added comprehensive caching for faster builds:
    - pnpm store caching for dependencies
    - Coverage report caching
    - Build output caching
  - Improved workflow organization:
    - Separated test and publish jobs
    - Added proper job dependencies
    - Enhanced concurrency handling
  - Added Codecov integration:
    - Detailed coverage reporting
    - Coverage upload with proper configuration
    - Fail CI on coverage regression

## [2.0.0] - 2025-02-07

### Changed

- **BREAKING**: Converted all operations to synchronous for major performance improvements:

  - Removed async/await from all methods
  - Optimized rule evaluation engine
  - Improved batch processing performance
  - Updated all method signatures to be synchronous
  - Simplified internal implementations

- Performance optimizations:
  - Pre-allocated result arrays
  - Removed unnecessary object creation
  - Optimized Set usage for O(1) lookups
  - Smart batch size management based on rule complexity
  - Fast paths for common operations (eq numeric comparisons)
  - Optimized operator validation with static Set

### Improved

- Test coverage improvements:
  - Added comprehensive edge case testing
  - Improved error handling coverage
  - Added legacy rule validation tests
  - Expanded numeric conversion tests
  - Added null value handling tests

### Performance

- Benchmark results:
  - Real-world entity matching (100 entities): 54102 ops/sec
  - Complex nested rules (1000 entities): 2276 ops/sec
  - Large dataset processing (10000 entities): 247 ops/sec
  - Matching with multiple entities: 2392 ops/sec
