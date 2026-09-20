interface CalculatorKeypadProps {
  onToken: (token: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onEquals: () => void;
}

export function CalculatorKeypad({ onToken, onBackspace, onClear, onToggleSign, onEquals }: CalculatorKeypadProps) {
  return (
    <section className="calculator" aria-label="Calculator keypad">
      <button className="calc-key is-muted" type="button" onClick={onClear}>C</button>
      <button className="calc-key is-muted" type="button" onClick={() => onToken('(')}>(</button>
      <button className="calc-key is-muted" type="button" onClick={() => onToken(')')}>)</button>
      <button className="calc-key is-muted" type="button" aria-label="Backspace" onClick={onBackspace}>⌫</button>

      {['7','8','9'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
      <button className="calc-key is-operator" type="button" onClick={() => onToken('÷')}>÷</button>

      {['4','5','6'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
      <button className="calc-key is-operator" type="button" onClick={() => onToken('×')}>×</button>

      {['1','2','3'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
      <button className="calc-key is-operator" type="button" onClick={() => onToken('−')}>−</button>

      <button className="calc-key is-muted" type="button" aria-label="Toggle sign" onClick={onToggleSign}>±</button>
      <button className="calc-key" type="button" onClick={() => onToken('0')}>0</button>
      <button className="calc-key" type="button" onClick={() => onToken('.')}>.</button>
      <button className="calc-key is-operator" type="button" onClick={() => onToken('+')}>+</button>

      <button className="calc-key is-equals" type="button" onClick={onEquals}>=</button>
    </section>
  );
}
