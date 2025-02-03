# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[1.0.2]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.2
[1.0.1]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.1
[1.0.0]: https://github.com/phr3nzy/rulekit/releases/tag/v1.0.0

## [0.0.1] - 2024-12-01

### Added

- Initial release with basic rule engine functionality
- JSON Logic based rule evaluation
- Basic TypeScript support
