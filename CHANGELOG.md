# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

### Added

- Performance optimizations:
  - Pre-allocated result arrays
  - Removed unnecessary object creation
  - Optimized Set usage for O(1) lookups
  - Smart batch size management based on rule complexity
  - Fast paths for common operations (eq, numeric comparisons)
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
  - Real-world entity matching (100 entities): 54,102 ops/sec
  - Complex nested rules (1000 entities): 2,276 ops/sec
  - Large dataset processing (10000 entities): 247 ops/sec
  - Matching with multiple entities: 2,392 ops/sec

## [1.1.1] - 2025-02-07

### Added

- Improved documentation:
  - Added comprehensive JSDoc comments
  - Updated README with more detailed examples
  - Added better type documentation
  - Updated terminology to be more generic
  - Added performance benchmark results
  - Added detailed API documentation
  - Improved code examples with TypeScript types

## [1.1.0] - 2025-02-07

### Changed

- Made library more generic and less opinionated:
  - Renamed Product type to Entity for more generic use cases
  - Added `matchingFrom` and `matchingTo` as more generic alternatives to `source` and `recommendations`
  - Renamed internal types and methods to use more generic terminology
  - Updated example code to use new generic names
  - Added proper TypeScript deprecation notices for old names
  - Maintained backward compatibility with existing property names

### Removed

- Removed caching functionality:
  - Removed CachedRuleEvaluator
  - Removed MemoryCache implementation
  - Removed caching-related configuration options
  - Simplified RuleEngine to use BaseRuleEvaluator by default

## [1.0.3] - 2025-02-02

### Added

- Exported missing types and classes from attributes module:
  - `AttributeType` enum
  - `AttributeTypeValue`, `ValidationRule`, `AttributeDefinition`, `AttributeRegistry`, `AttributeValue`, `DynamicAttributes` types
  - `ProductAttributeRegistry` class
  - `validateAttribute` function and `AttributeValidationError` class

## [1.0.2] - 2025-02-01

### Fixed

- Fixed release workflow triggers
- Added proper release event handling
- Enabled benchmarks on main branch pushes
- Updated CI workflow configuration

## [1.0.1] - 2025-02-01

### Fixed

- Fixed CI/CD configuration
- Added proper Codecov integration
- Updated publishing workflow

## [1.0.0] - 2025-02-01

### Added

- Initial release of RuleKit
- Type-safe rule engine implementation with TypeScript
- Dynamic attribute handling with validation
- Flexible rule composition with AND/OR conditions
- High-performance evaluation with caching support
- Cross-selling and product recommendation features
- Memory-efficient caching with TTL and max items
- Comprehensive test suite with >90% coverage
- Performance benchmarks and optimization
- GitHub Actions CI/CD pipeline
- npm package publishing with provenance
- Detailed documentation and examples
- Contributing guidelines and code of conduct

### Features

- Product attribute registry with validation
- Rule evaluation engine with caching
- Batch processing for large datasets
- Cross-selling configuration
- Performance monitoring and statistics
- Memory usage optimization
- Type-safe API design

### Developer Experience

- Full TypeScript support
- Comprehensive documentation
- Example code and use cases
- Performance benchmarks
- Contributing guidelines
- Code style enforcement
- Automated testing and CI

[2.0.1]: https://github.com/phr3nzy/rulekit/releases/tag/v2.0.1
[2.0.0]: https://github.com/phr3nzy/rulekit/releases/tag/v2.0.0
[1.1.1]: https://github.com/phr3nzy/rulekit/releases/tag/v1.1.1
[1.1.0]: https://github.com/phr3nzy/rulekit/releases/tag/v1.1.0
[1.0.3]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.3
[1.0.2]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.2
[1.0.1]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.1
[1.0.0]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.0

## [0.0.1] - 2024-12-01

### Added

- Initial release with basic rule engine functionality
- JSON Logic based rule evaluation
- Basic TypeScript support
