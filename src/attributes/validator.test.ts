import { describe, it, expect } from 'vitest';
import { validateAttribute, AttributeValidationError } from './validator';
import { AttributeType } from './types';

describe('Attribute Validator', () => {
	describe('String Validation', () => {
		const stringDef = {
			name: 'test',
			type: AttributeType.STRING,
			description: 'Test string attribute',
			validation: {
				type: AttributeType.STRING,
				required: true,
				min: 2,
				max: 10,
				pattern: '^[a-z]+$',
			},
		};

		it('should validate valid strings', async () => {
			await expect(validateAttribute('test', 'valid', stringDef)).resolves.toBeUndefined();
		});

		it('should reject strings that are too short', async () => {
			await expect(validateAttribute('test', 'a', stringDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject strings that are too long', async () => {
			await expect(validateAttribute('test', 'thisistoolong', stringDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject strings that dont match pattern', async () => {
			await expect(validateAttribute('test', 'INVALID', stringDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});

	describe('Number Validation', () => {
		const numberDef = {
			name: 'test',
			type: AttributeType.NUMBER,
			description: 'Test number attribute',
			validation: {
				type: AttributeType.NUMBER,
				required: true,
				min: 0,
				max: 100,
			},
		};

		it('should validate valid numbers', async () => {
			await expect(validateAttribute('test', 50, numberDef)).resolves.toBeUndefined();
		});

		it('should reject numbers below minimum', async () => {
			await expect(validateAttribute('test', -1, numberDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject numbers above maximum', async () => {
			await expect(validateAttribute('test', 101, numberDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject non-numbers', async () => {
			await expect(validateAttribute('test', '50', numberDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});

	describe('Enum Validation', () => {
		const enumDef = {
			name: 'test',
			type: AttributeType.ENUM,
			description: 'Test enum attribute',
			validation: {
				type: AttributeType.ENUM,
				required: true,
				enum: ['option1', 'option2', 'option3'] as const,
			},
		};

		it('should validate valid enum values', async () => {
			await expect(validateAttribute('test', 'option1', enumDef)).resolves.toBeUndefined();
		});

		it('should reject invalid enum values', async () => {
			await expect(validateAttribute('test', 'invalid', enumDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});

	describe('Array Validation', () => {
		const arrayDef = {
			name: 'test',
			type: AttributeType.ARRAY,
			description: 'Test array attribute',
			validation: {
				type: AttributeType.ARRAY,
				required: true,
				min: 1,
				max: 3,
				arrayType: AttributeType.STRING,
			},
		};

		it('should validate valid arrays', async () => {
			await expect(
				validateAttribute('test', ['item1', 'item2'], arrayDef),
			).resolves.toBeUndefined();
		});

		it('should reject arrays that are too short', async () => {
			await expect(validateAttribute('test', [], arrayDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject arrays that are too long', async () => {
			await expect(validateAttribute('test', ['1', '2', '3', '4'], arrayDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject arrays with invalid item types', async () => {
			await expect(validateAttribute('test', [1, 2, 3], arrayDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});

	describe('Required Validation', () => {
		const requiredDef = {
			name: 'test',
			type: AttributeType.STRING,
			description: 'Test required attribute',
			validation: {
				type: AttributeType.STRING,
				required: true,
			},
		};

		it('should reject undefined for required attributes', async () => {
			await expect(validateAttribute('test', undefined, requiredDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});

		it('should reject null for required attributes', async () => {
			await expect(validateAttribute('test', null, requiredDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});

	describe('Custom Validation', () => {
		const customDef = {
			name: 'test',
			type: AttributeType.STRING,
			description: 'Test custom validation',
			validation: {
				type: AttributeType.STRING,
				required: true,
				custom: (value: unknown) => {
					if (typeof value !== 'string') return false;
					return value.startsWith('custom-');
				},
			},
		};

		it('should validate values that pass custom validation', async () => {
			await expect(validateAttribute('test', 'custom-value', customDef)).resolves.toBeUndefined();
		});

		it('should reject values that fail custom validation', async () => {
			await expect(validateAttribute('test', 'invalid', customDef)).rejects.toThrow(
				AttributeValidationError,
			);
		});
	});
});
