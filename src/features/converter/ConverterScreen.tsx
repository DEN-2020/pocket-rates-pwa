import { useEffect, useMemo, useState } from 'react';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { initialAssets } from '../../domain/assets/catalog';
import {
  CalculatorError,
  MAX_EXPRESSION_LENGTH,
  evaluateExpression
} from '../../domain/calculator/evaluateExpression';
import { convertAmount } from '../../domain/conversion/convert';
import type { QuoteSnapshot } from '../../domain/conversion/types';
import { CalculatorKeypad } from './CalculatorKeypad';

const assets = initialAssets;
const provider = new FrankfurterProvider();
const plainNumberPattern = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;

function parsePlainNumber(draft: string): string | null {
  const trimmed = draft.trim();
  if (!plainNumberPattern.test(trimmed)) return null;
  try {
    return evaluateExpression(trimmed).toString();
  } catch {
    return null;
  }
}

function sanitizeDraft(value: string): string {
  return value.replace(/[^\d.,()+\-*\/×÷−\s]/g, '').slice(0, MAX_EXPRESSION_LENGTH);
}

function messageForCalculatorError(error: unknown): string {
  if (!(error instanceof CalculatorError)) return 'Could not calculate this expression.';
  switch (error.code) {
    case 'DIVISION_BY_ZERO': return 'Division by zero is not allowed.';
    case 'MISSING_PARENTHESIS': return 'Check the parentheses.';
    case 'TOO_LONG':
    case 'TOO_DEEP': return error.message;
    default: return 'Check the calculation and try again.';
  }
}

export function ConverterScreen() {
  const [activeCode, setActiveCode] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const [expression, setExpression] = useState('100');
  const [calculatorError, setCalculatorError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<QuoteSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    void provider
      .getLatest('USD', assets.map((asset) => asset.code), controller.signal)
      .then((next) => {
        setSnapshot(next);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setStatus('error');
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const numeric = parsePlainNumber(expression);
    if (numeric !== null) setAmount(numeric);
  }, [expression]);

  const rows = useMemo(() => assets.map((asset) => {
    if (!snapshot) return { asset, value: asset.code === activeCode ? amount : '—' };
    try {
      const value = convertAmount(amount || '0', activeCode, asset.code, snapshot);
      return { asset, value: value.toSignificantDigits(12).toString() };
    } catch {
      return { asset, value: '—' };
    }
  }), [activeCode, amount, snapshot]);

  const appendToken = (token: string) => {
    setCalculatorError(null);
    setExpression((current) => {
      if (current.length >= MAX_EXPRESSION_LENGTH) return current;
      if (current === '0' && /^\d$/.test(token)) return token;
      return `${current}${token}`.slice(0, MAX_EXPRESSION_LENGTH);
    });
  };

  const calculate = () => {
    try {
      const result = evaluateExpression(expression).toString();
      setExpression(result);
      setAmount(result);
      setCalculatorError(null);
    } catch (error) {
      setCalculatorError(messageForCalculatorError(error));
    }
  };

  const toggleSign = () => {
    setCalculatorError(null);
    const trimmed = expression.trim();
    if (!trimmed || trimmed === '0') return;
    const numeric = parsePlainNumber(trimmed);
    if (numeric !== null) {
      setExpression(trimmed.startsWith('-') ? trimmed.slice(1) || '0' : `-${trimmed}`);
      return;
    }
    setExpression(`-(${trimmed})`.slice(0, MAX_EXPRESSION_LENGTH));
  };

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <small>Pocket Rates</small>
          <h1>Converter</h1>
        </div>
        <span className={`status status-${status}`} aria-label={`Rates ${status}`} />
      </header>

      <p className="meta">
        {snapshot
          ? `${snapshot.source} · ${snapshot.quoteType} · ${snapshot.sourceDate}`
          : status === 'error' ? 'Rates unavailable' : 'Loading rates…'}
      </p>

      <section className="currency-list" aria-label="Currencies">
        {rows.map(({ asset, value }) => {
          const active = asset.code === activeCode;
          return (
            <div className={`currency-row ${active ? 'is-active' : ''}`} key={asset.id}>
              <button
                className="currency-select"
                type="button"
                onClick={() => {
                  if (value !== '—') {
                    setAmount(value);
                    setExpression(value);
                    setActiveCode(asset.code);
                    setCalculatorError(null);
                  }
                }}
              >
                <span className="flag" aria-hidden="true">{asset.flag}</span>
                <span><strong>{asset.code}</strong><small>{asset.name}</small></span>
              </button>

              {active ? (
                <input
                  aria-label={`Amount or calculation in ${asset.code}`}
                  inputMode="decimal"
                  autoComplete="off"
                  spellCheck={false}
                  value={expression}
                  onChange={(event) => {
                    setCalculatorError(null);
                    setExpression(sanitizeDraft(event.target.value));
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') calculate();
                  }}
                />
              ) : <output>{value}</output>}
            </div>
          );
        })}
      </section>

      <div className="calculator-feedback" aria-live="polite">
        {calculatorError ?? 'Arithmetic is local — typing does not request new rates.'}
      </div>

      <CalculatorKeypad
        onToken={appendToken}
        onClear={() => {
          setExpression('0');
          setAmount('0');
          setCalculatorError(null);
        }}
        onBackspace={() => {
          setCalculatorError(null);
          setExpression((current) => current.length <= 1 ? '0' : current.slice(0, -1));
        }}
        onToggleSign={toggleSign}
        onEquals={calculate}
      />
    </main>
  );
}
