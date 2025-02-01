# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.0.1] - 2025-02-01

### Added

- Initial release of the rule engine
- Support for rule-based product filtering and recommendations
- TypeScript support with full type definitions
- JSON Logic integration for rule evaluation
- Comprehensive test suite with edge case coverage
- Support for both CommonJS and ES Modules
- Zod schema validation for rules
- Documentation and examples

### Features

- Rule-based filtering system with support for:
  - Price-based filters
  - Category-based filters
  - Brand-based filters
  - Complex combinations using AND/OR operators
- Two-part rule system:
  - Source rules for selecting main products
  - Recommendation rules for selecting products to suggest
- Framework agnostic design
- Zero config setup
- Lightweight and tree-shakeable

[0.0.1]: https://github.com/phr3nzy/rulekit/releases/tag/v0.0.1
