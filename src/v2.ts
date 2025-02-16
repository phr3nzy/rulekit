/**
 * Legacy v2 namespace exports
 * @deprecated Use latest v3 exports instead
 * @packageDocumentation
 */

import * as validation from './core/models/validation';
import { RuleEngine as Engine } from './core/services/rule-engine';
import { ComparisonOperators as CoreOperators } from './core/models/types';

export const v2 = {
	ruleEngine: Engine,
	validation,
	ComparisonOperators: CoreOperators,
};
