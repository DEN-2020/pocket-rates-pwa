import Decimal from 'decimal.js-light';

export const MAX_EXPRESSION_LENGTH = 160;
export const MAX_NESTING_DEPTH = 16;

export type CalculatorErrorCode =
  | 'EMPTY' | 'TOO_LONG' | 'TOO_DEEP' | 'INVALID_CHARACTER'
  | 'MALFORMED_NUMBER' | 'UNEXPECTED_TOKEN' | 'MISSING_PARENTHESIS'
  | 'DIVISION_BY_ZERO';

export class CalculatorError extends Error {
  constructor(
    public readonly code: CalculatorErrorCode,
    message: string,
    public readonly index?: number
  ) {
    super(message);
    this.name = 'CalculatorError';
  }
}

type BinaryOperator = '+' | '-' | '*' | '/';
type Token =
  | { type: 'number'; value: string; index: number }
  | { type: 'operator'; value: BinaryOperator; index: number }
  | { type: 'leftParen'; index: number }
  | { type: 'rightParen'; index: number };

function normalizeExpression(input: string): string {
  return input.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-').replaceAll(',', '.');
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9';
}

function tokenize(input: string): Token[] {
  const source = normalizeExpression(input);
  if (source.length > MAX_EXPRESSION_LENGTH) {
    throw new CalculatorError('TOO_LONG', `Expression is limited to ${MAX_EXPRESSION_LENGTH} characters.`);
  }

  const tokens: Token[] = [];
  let index = 0;

  while (index < source.length) {
    const char = source.charAt(index);
    if (/\s/.test(char)) { index += 1; continue; }

    if (isDigit(char) || char === '.') {
      const start = index;
      let dots = 0;
      let digits = 0;

      while (index < source.length) {
        const current = source.charAt(index);
        if (isDigit(current)) { digits += 1; index += 1; continue; }
        if (current === '.') {
          dots += 1;
          if (dots > 1) throw new CalculatorError('MALFORMED_NUMBER', 'Number has more than one decimal point.', index);
          index += 1;
          continue;
        }
        break;
      }

      if (digits === 0) throw new CalculatorError('MALFORMED_NUMBER', 'A decimal point must belong to a number.', start);

      let value = source.slice(start, index);
      if (value.startsWith('.')) value = `0${value}`;
      if (value.endsWith('.')) value = `${value}0`;
      tokens.push({ type: 'number', value, index: start });
      continue;
    }

    if (char === '+' || char === '-' || char === '*' || char === '/') {
      tokens.push({ type: 'operator', value: char, index }); index += 1; continue;
    }
    if (char === '(') { tokens.push({ type: 'leftParen', index }); index += 1; continue; }
    if (char === ')') { tokens.push({ type: 'rightParen', index }); index += 1; continue; }

    throw new CalculatorError('INVALID_CHARACTER', `Unsupported character: ${char}`, index);
  }

  if (tokens.length === 0) throw new CalculatorError('EMPTY', 'Enter a calculation first.');
  return tokens;
}

class Parser {
  private position = 0;
  constructor(private readonly tokens: readonly Token[]) {}

  parse(): Decimal {
    const result = this.parseAdditive(0);
    const trailing = this.peek();
    if (trailing) throw new CalculatorError('UNEXPECTED_TOKEN', 'Unexpected token after the result.', trailing.index);
    return result;
  }

  private peek(): Token | undefined { return this.tokens[this.position]; }

  private consume(): Token {
    const token = this.peek();
    if (!token) throw new CalculatorError('UNEXPECTED_TOKEN', 'Expression ended unexpectedly.');
    this.position += 1;
    return token;
  }

  private parseAdditive(depth: number): Decimal {
    let value = this.parseMultiplicative(depth);
    while (true) {
      const token = this.peek();
      if (token?.type !== 'operator' || (token.value !== '+' && token.value !== '-')) break;
      this.consume();
      const right = this.parseMultiplicative(depth);
      value = token.value === '+' ? value.plus(right) : value.minus(right);
    }
    return value;
  }

  private parseMultiplicative(depth: number): Decimal {
    let value = this.parseUnary(depth);
    while (true) {
      const token = this.peek();
      if (token?.type !== 'operator' || (token.value !== '*' && token.value !== '/')) break;
      this.consume();
      const right = this.parseUnary(depth);
      if (token.value === '/' && right.isZero()) throw new CalculatorError('DIVISION_BY_ZERO', 'Cannot divide by zero.', token.index);
      value = token.value === '*' ? value.mul(right) : value.div(right);
    }
    return value;
  }

  private parseUnary(depth: number): Decimal {
    const token = this.peek();
    if (token?.type === 'operator' && (token.value === '+' || token.value === '-')) {
      this.consume();
      const value = this.parseUnary(depth);
      return token.value === '-' ? value.negated() : value;
    }
    return this.parsePrimary(depth);
  }

  private parsePrimary(depth: number): Decimal {
    const token = this.consume();
    if (token.type === 'number') return new Decimal(token.value);

    if (token.type === 'leftParen') {
      if (depth >= MAX_NESTING_DEPTH) {
        throw new CalculatorError('TOO_DEEP', `Parentheses are limited to ${MAX_NESTING_DEPTH} levels.`, token.index);
      }
      const value = this.parseAdditive(depth + 1);
      const closing = this.peek();
      if (closing?.type !== 'rightParen') throw new CalculatorError('MISSING_PARENTHESIS', 'Missing closing parenthesis.', token.index);
      this.consume();
      return value;
    }

    throw new CalculatorError('UNEXPECTED_TOKEN', 'Expected a number or opening parenthesis.', token.index);
  }
}

export function evaluateExpression(expression: string): Decimal {
  return new Parser(tokenize(expression)).parse();
}
