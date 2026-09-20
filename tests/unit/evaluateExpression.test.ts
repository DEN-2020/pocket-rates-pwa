import { describe, expect, it } from 'vitest';
import { CalculatorError, evaluateExpression } from '../../src/domain/calculator/evaluateExpression';

describe('evaluateExpression', () => {
  it('respects precedence', () => {
    expect(evaluateExpression('1000 + 250 * 2').toString()).toBe('1500');
  });
  it('respects parentheses', () => {
    expect(evaluateExpression('(1000 + 250) * 2').toString()).toBe('2500');
  });
  it('supports calculator symbols and decimal commas', () => {
    expect(evaluateExpression('10 ÷ 4 + 1,5 × 2').toString()).toBe('5.5');
  });
  it('handles unary signs', () => {
    expect(evaluateExpression('-5 + +2').toString()).toBe('-3');
  });
  it('keeps common decimal arithmetic exact', () => {
    expect(evaluateExpression('0.1 + 0.2').toString()).toBe('0.3');
  });
  it('rejects division by zero', () => {
    try {
      evaluateExpression('12 / (3 - 3)');
      throw new Error('Expected error');
    } catch (error) {
      expect(error).toBeInstanceOf(CalculatorError);
      expect((error as CalculatorError).code).toBe('DIVISION_BY_ZERO');
    }
  });
  it('rejects malformed input', () => {
    expect(() => evaluateExpression('1..2 + 3')).toThrow(CalculatorError);
    expect(() => evaluateExpression('(1 + 2')).toThrow(CalculatorError);
    expect(() => evaluateExpression('2 EUR')).toThrow(CalculatorError);
  });
});
