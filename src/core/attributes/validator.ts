import { AttributeType, type ValidationRule, type AttributeDefinition } from './types';

/**
 * Custom error class for attribute validation failures.
 * Provides detailed error messages with attribute context.
 *
 * @class AttributeValidationError
 * @extends Error
 *
 * @property {string} attributeName - Name of the attribute that failed validation
 *
 * @example
 * ```typescript
 * throw new AttributeValidationError('price', 'Value must be positive');
 * // Error: "Validation failed for attribute "price": Value must be positive"
 * ```
 */
export class AttributeValidationError extends Error {
	constructor(
		public readonly attributeName: string,
		message: string,
	) {
		super(`Validation failed for attribute "${attributeName}": ${message}`);
		this.name = 'AttributeValidationError';
	}
}

/**
 * Validates a single attribute value against its definition and validation rules.
 * Performs type checking and rule-specific validations.
 *
 * @param {string} name - Name of the attribute being validated
 * @param {unknown} value - Value to validate
 * @param {AttributeDefinition} definition - Attribute definition containing validation rules
 * @param {Record<string, unknown>} [allAttributes] - Optional object containing all attributes
 * @throws {AttributeValidationError} If validation fails
 *
 * @remarks
 * Validation process:
 * 1. Checks if value is required
 * 2. Runs custom validation if provided
 * 3. Performs type validation
 * 4. Runs type-specific validations
 *
 * @example
 * ```typescript
 * const definition: AttributeDefinition = {
 *   name: 'price',
 *   type: AttributeType.NUMBER,
 *   description: 'Product price',
 *   validation: {
 *     type: AttributeType.NUMBER,
 *     required: true,
 *     min: 0
 *   }
 * };
 *
 * await validateAttribute('price', 100, definition);
 * ```
 */
export async function validateAttribute(
	name: string,
	value: unknown,
	definition: AttributeDefinition,
	allAttributes?: Record<string, unknown>,
): Promise<void> {
	const { validation } = definition;

	// Check if required
	if (validation.required && (value === undefined || value === null)) {
		throw new AttributeValidationError(name, 'Value is required');
	}

	// Run custom validation first if it exists, as it might have special handling for undefined values
	if (validation.custom) {
		const isValid = await validation.custom(value, allAttributes);
		if (!isValid) {
			throw new AttributeValidationError(name, 'Custom validation failed');
		}
	}

	// Skip remaining validations if value is not provided and not required
	if (value === undefined || value === null) {
		return;
	}

	// Type validation
	await validateType(name, value, validation);

	// Additional validations based on type
	switch (validation.type) {
		case AttributeType.STRING:
			validateString(name, value as string, validation);
			break;
		case AttributeType.NUMBER:
			validateNumber(name, value as number, validation);
			break;
		case AttributeType.ENUM:
			validateEnum(name, value as string, validation);
			break;
		case AttributeType.ARRAY:
			await validateArray(name, value as unknown[], validation);
			break;
	}
}

/**
 * Internal helper to validate the type of a value.
 * Ensures the value matches its expected type.
 *
 * @param {string} name - Attribute name for error context
 * @param {unknown} value - Value to type check
 * @param {ValidationRule} validation - Validation rules containing type info
 * @throws {AttributeValidationError} If type validation fails
 *
 * @remarks
 * Handles all supported attribute types:
 * - Strings (typeof === 'string')
 * - Numbers (typeof === 'number' && !isNaN)
 * - Booleans (typeof === 'boolean')
 * - Dates (instanceof Date && valid timestamp)
 * - Enums (typeof === 'string')
 * - Arrays (Array.isArray)
 *
 * @example
 * ```typescript
 * await validateType('age', 25, { type: AttributeType.NUMBER });
 * await validateType('name', 'John', { type: AttributeType.STRING });
 * ```
 */
async function validateType(
	name: string,
	value: unknown,
	validation: ValidationRule,
): Promise<void> {
	const expectedType = validation.type;
	let isValid = false;

	switch (expectedType) {
		case AttributeType.STRING:
			isValid = typeof value === 'string';
			break;
		case AttributeType.NUMBER:
			isValid = typeof value === 'number' && !isNaN(value);
			break;
		case AttributeType.BOOLEAN:
			isValid = typeof value === 'boolean';
			break;
		case AttributeType.DATE:
			isValid = value instanceof Date && !isNaN(value.getTime());
			break;
		case AttributeType.ENUM:
			isValid = typeof value === 'string';
			break;
		case AttributeType.ARRAY:
			isValid = Array.isArray(value);
			break;
	}

	if (!isValid) {
		throw new AttributeValidationError(
			name,
			`Invalid type. Expected ${expectedType}, got ${typeof value}`,
		);
	}
}

/**
 * Validates string values against string-specific rules.
 * Checks length constraints and pattern matching.
 *
 * @param {string} name - Attribute name for error context
 * @param {string} value - String value to validate
 * @param {ValidationRule} validation - Validation rules for strings
 * @throws {AttributeValidationError} If string validation fails
 *
 * @remarks
 * Validates:
 * - Minimum length (validation.min)
 * - Maximum length (validation.max)
 * - Pattern matching (validation.pattern)
 *
 * @example
 * ```typescript
 * validateString('username', 'john_doe', {
 *   type: AttributeType.STRING,
 *   min: 3,
 *   max: 20,
 *   pattern: '^[a-z0-9_]+$'
 * });
 * ```
 */
function validateString(name: string, value: string, validation: ValidationRule): void {
	if (validation.min !== undefined && value.length < validation.min) {
		throw new AttributeValidationError(name, `String length must be at least ${validation.min}`);
	}

	if (validation.max !== undefined && value.length > validation.max) {
		throw new AttributeValidationError(name, `String length must be at most ${validation.max}`);
	}

	if (validation.pattern) {
		const regex = new RegExp(validation.pattern);
		if (!regex.test(value)) {
			throw new AttributeValidationError(name, `Value must match pattern: ${validation.pattern}`);
		}
	}
}

/**
 * Validates numeric values against number-specific rules.
 * Checks value range constraints.
 *
 * @param {string} name - Attribute name for error context
 * @param {number} value - Numeric value to validate
 * @param {ValidationRule} validation - Validation rules for numbers
 * @throws {AttributeValidationError} If number validation fails
 *
 * @remarks
 * Validates:
 * - Minimum value (validation.min)
 * - Maximum value (validation.max)
 *
 * @example
 * ```typescript
 * validateNumber('age', 25, {
 *   type: AttributeType.NUMBER,
 *   min: 0,
 *   max: 120
 * });
 * ```
 */
function validateNumber(name: string, value: number, validation: ValidationRule): void {
	if (validation.min !== undefined && value < validation.min) {
		throw new AttributeValidationError(name, `Value must be at least ${validation.min}`);
	}

	if (validation.max !== undefined && value > validation.max) {
		throw new AttributeValidationError(name, `Value must be at most ${validation.max}`);
	}
}

/**
 * Validates string values against a set of allowed enum values.
 * Ensures the value is one of the predefined options.
 *
 * @param {string} name - Attribute name for error context
 * @param {string} value - String value to validate
 * @param {ValidationRule} validation - Validation rules containing enum values
 * @throws {AttributeValidationError} If enum validation fails
 *
 * @remarks
 * - Value must be included in validation.enum array
 * - Case-sensitive comparison
 *
 * @example
 * ```typescript
 * validateEnum('status', 'active', {
 *   type: AttributeType.ENUM,
 *   enum: ['active', 'inactive', 'pending']
 * });
 * ```
 */
function validateEnum(name: string, value: string, validation: ValidationRule): void {
	if (!validation.enum?.includes(value)) {
		throw new AttributeValidationError(
			name,
			`Value must be one of: ${validation.enum?.join(', ')}`,
		);
	}
}

/**
 * Validates array values and their elements.
 * Checks array length and validates each element's type.
 *
 * @param {string} name - Attribute name for error context
 * @param {unknown[]} value - Array to validate
 * @param {ValidationRule} validation - Validation rules for arrays
 * @throws {AttributeValidationError} If array validation fails
 *
 * @remarks
 * Validates:
 * - Minimum length (validation.min)
 * - Maximum length (validation.max)
 * - Element types (validation.arrayType)
 *
 * @example
 * ```typescript
 * await validateArray('tags', ['new', 'featured'], {
 *   type: AttributeType.ARRAY,
 *   arrayType: AttributeType.STRING,
 *   min: 1,
 *   max: 5
 * });
 * ```
 */
async function validateArray(
	name: string,
	value: unknown[],
	validation: ValidationRule,
): Promise<void> {
	if (validation.min !== undefined && value.length < validation.min) {
		throw new AttributeValidationError(name, `Array must have at least ${validation.min} items`);
	}

	if (validation.max !== undefined && value.length > validation.max) {
		throw new AttributeValidationError(name, `Array must have at most ${validation.max} items`);
	}

	if (validation.arrayType) {
		// Validate each array item
		await Promise.all(
			value.map((item, index) =>
				validateType(`${name}[${index}]`, item, {
					type: validation.arrayType!,
				}),
			),
		);
	}
}
