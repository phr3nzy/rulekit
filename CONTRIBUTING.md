# Contributing to RuleKit

First off, thank you for considering contributing to RuleKit! It's people like you that make RuleKit such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## Development Process

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`git commit -m 'feat: add amazing feature'`)
4. Push to your branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Local Development Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/phr3nzy/rulekit.git
   cd rulekit
   ```

2. Install dependencies:

   ```bash
   pnpm install
   ```

3. Start development:
   ```bash
   pnpm dev
   ```

## Running Tests

We use Vitest for testing. Run the test suite with:

```bash
# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run tests in watch mode
pnpm test:watch

# Run benchmarks
pnpm bench
```

## Code Style

We use ESLint and Prettier for code formatting. Our style guide is enforced through these tools:

```bash
# Run linter
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format
```

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/). This means your commit messages should be structured as follows:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

Types:

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools

## Release Process

1. Update version in package.json
2. Create a git tag:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```
3. Create a GitHub release from the tag
4. The GitHub Actions workflow will automatically:
   - Verify the version matches
   - Run tests
   - Build the package
   - Publish to npm with provenance

## Pull Request Process

1. Update the README.md with details of changes if needed
2. Update the CHANGELOG.md following the Keep a Changelog format
3. The PR will be merged once you have the sign-off of a maintainer

## Questions?

Feel free to open an issue with your question or suggestion. We're here to help!
