import { ChevronDownIcon, ChevronUpIcon } from '../../shared/ui/icons';

interface CalculatorKeypadProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onToken: (token: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  onToggleSign: () => void;
  onEquals: () => void;
}

export function CalculatorKeypad({
  collapsed,
  onToggleCollapsed,
  onToken,
  onBackspace,
  onClear,
  onToggleSign,
  onEquals
}: CalculatorKeypadProps) {
  return (
    <section className={`calculator-shell ${collapsed ? 'is-collapsed' : ''}`} aria-label="Calculator">
      <div className="calculator-toolbar">
        <button
          className="calculator-collapse"
          type="button"
          onClick={onToggleCollapsed}
          aria-label={collapsed ? 'Open calculator' : 'Collapse calculator'}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronUpIcon /> : <ChevronDownIcon />}
          <span>{collapsed ? 'Calculator' : 'Hide'}</span>
        </button>

        {!collapsed && (
          <div className="calculator-extra" aria-label="Extra calculator functions">
            <button type="button" onClick={() => onToken('(')} aria-label="Open parenthesis">(</button>
            <button type="button" onClick={() => onToken(')')} aria-label="Close parenthesis">)</button>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="calculator">
          <button className="calc-key is-muted" type="button" onClick={onClear}>C</button>
          <button className="calc-key is-muted" type="button" aria-label="Backspace" onClick={onBackspace}>⌫</button>
          <button className="calc-key is-muted" type="button" onClick={() => onToken('%')}>%</button>
          <button className="calc-key is-operator" type="button" onClick={() => onToken('÷')}>÷</button>

          {['7','8','9'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
          <button className="calc-key is-operator" type="button" onClick={() => onToken('×')}>×</button>

          {['4','5','6'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
          <button className="calc-key is-operator" type="button" onClick={() => onToken('−')}>−</button>

          {['1','2','3'].map((n) => <button key={n} className="calc-key" type="button" onClick={() => onToken(n)}>{n}</button>)}
          <button className="calc-key is-operator" type="button" onClick={() => onToken('+')}>+</button>

          <button className="calc-key is-muted" type="button" aria-label="Toggle sign" onClick={onToggleSign}>±</button>
          <button className="calc-key" type="button" onClick={() => onToken('0')}>0</button>
          <button className="calc-key" type="button" onClick={() => onToken('.')}>.</button>
          <button className="calc-key is-equals" type="button" onClick={onEquals}>=</button>
        </div>
      )}
    </section>
  );
}
