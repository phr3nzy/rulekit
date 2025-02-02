import { AttributeType, type ValidationRule, type AttributeDefinition } from './types';

/**
 * Error thrown when attribute validation fails
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
 * Validates a single attribute value against its definition
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
 * Validates the type of a value
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
 * Validates string-specific rules
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
 * Validates number-specific rules
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
 * Validates enum values
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
 * Validates array values
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
