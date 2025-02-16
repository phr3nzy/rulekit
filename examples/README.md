# RuleKit Examples

This directory contains examples demonstrating how to use RuleKit in different scenarios.

## Interface-Agnostic Components

The `interface-agnostic` directory shows how to use RuleKit's new interface-agnostic component system, which provides:

- Automatic component suggestion based on data analysis
- Smart statistics generation for fields
- Type-safe component handling
- Flexible component customization

### Running the Example

```bash
# Run with ts-node
npx ts-node examples/interface-agnostic/smart-filtering.ts

# Or compile and run
tsc examples/interface-agnostic/smart-filtering.ts
node examples/interface-agnostic/smart-filtering.js
```

The example demonstrates:

1. Analyzing data to get smart component suggestions
2. Viewing data statistics and insights
3. Creating a filtering interface with suggested components
4. Converting components to rules
5. Finding matching products
6. Customizing component suggestions with rules
