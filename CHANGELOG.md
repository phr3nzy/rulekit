# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-02-01

### Breaking Changes

- Complete rewrite of the rule engine implementation
- Removed dependency on json-logic-js in favor of a custom rule evaluation engine
- Changed rule format to be more intuitive and type-safe
- Updated API to be more flexible and performant

### Added

- New `RuleEngine` implementation with improved performance
- Caching support with `MemoryCache` implementation
- Batch processing support for large datasets
- Comprehensive test suite with unit and integration tests
- Performance benchmarks
- Type-safe rule validation using Zod schemas
- Support for complex nested AND/OR conditions
- Cross-selling configuration support
- Improved TypeScript types and documentation

### Changed

- Rule evaluation is now asynchronous for better performance
- Rule format is now more structured and type-safe
- Improved error handling and edge case management
- Better memory management for large datasets
- More flexible configuration options

### Removed

- Old rule engine implementation
- JSON Logic dependency
- Legacy rule format support

## [0.0.1] - 2024-01-31

### Added

- Initial release with basic rule engine functionality
- JSON Logic based rule evaluation
- Basic TypeScript support
