import { useEffect, useMemo, useState } from 'react';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { readPreference, writePreference } from '../../adapters/storage/preferencesDb';
import { assetCatalog, findAsset, initialAssetIds } from '../../domain/assets/catalog';
import { formatAssetAmount } from '../../domain/assets/format';
import type { Asset } from '../../domain/assets/types';
import {
  CalculatorError,
  MAX_EXPRESSION_LENGTH,
  evaluateExpression
} from '../../domain/calculator/evaluateExpression';
import { convertAmount } from '../../domain/conversion/convert';
import type { QuoteSnapshot } from '../../domain/conversion/types';
import { AssetManagerSheet } from './AssetManagerSheet';
import { CalculatorKeypad } from './CalculatorKeypad';

const provider = new FrankfurterProvider();
const plainNumberPattern = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
const layoutPreferenceKey = 'converter-layout-v1';

interface ConverterLayoutPreference {
  selectedAssetIds: string[];
  activeCode: string;
}

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
    case 'DIVISION_BY_ZERO':
      return 'Division by zero is not allowed.';
    case 'MISSING_PARENTHESIS':
      return 'Check the parentheses.';
    case 'TOO_LONG':
    case 'TOO_DEEP':
      return error.message;
    default:
      return 'Check the calculation and try again.';
  }
}

function normalizeSelectedIds(ids: readonly string[]): string[] {
  const valid = new Set(assetCatalog.map((asset) => asset.id));
  const unique = [...new Set(ids)].filter((id) => valid.has(id));

  return unique.length >= 2 ? unique : [...initialAssetIds];
}

export function ConverterScreen() {
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([...initialAssetIds]);
  const [activeCode, setActiveCode] = useState('EUR');
  const [amount, setAmount] = useState('100');
  const [expression, setExpression] = useState('100');
  const [calculatorError, setCalculatorError] = useState<string | null>(null);
  const [snapshot, setSnapshot] = useState<QuoteSnapshot | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);

  const selectedAssets = useMemo(
    () => selectedAssetIds.map(findAsset).filter((asset): asset is Asset => Boolean(asset)),
    [selectedAssetIds]
  );

  const quoteCodesKey = useMemo(
    () => selectedAssets.map((asset) => asset.code).sort().join(','),
    [selectedAssets]
  );

  useEffect(() => {
    let alive = true;

    void readPreference<ConverterLayoutPreference>(layoutPreferenceKey)
      .then((saved) => {
        if (!alive || !saved) return;

        const normalizedIds = normalizeSelectedIds(saved.selectedAssetIds ?? []);
        setSelectedAssetIds(normalizedIds);

        const normalizedAssets = normalizedIds
          .map(findAsset)
          .filter((asset): asset is Asset => Boolean(asset));

        const requestedActive = normalizedAssets.find((asset) => asset.code === saved.activeCode);
        setActiveCode(requestedActive?.code ?? normalizedAssets[0]?.code ?? 'EUR');
      })
      .catch((error: unknown) => {
        console.warn('Could not restore converter preferences.', error);
      })
      .finally(() => {
        if (alive) setPreferencesLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!preferencesLoaded) return;

    void writePreference<ConverterLayoutPreference>(layoutPreferenceKey, {
      selectedAssetIds,
      activeCode
    }).catch((error: unknown) => {
      console.warn('Could not persist converter preferences.', error);
    });
  }, [activeCode, preferencesLoaded, selectedAssetIds]);

  useEffect(() => {
    const controller = new AbortController();
    const codes = quoteCodesKey.split(',').filter(Boolean);

    setStatus('loading');

    void provider
      .getLatest('USD', codes, controller.signal)
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
  }, [quoteCodesKey]);

  useEffect(() => {
    const numeric = parsePlainNumber(expression);
    if (numeric !== null) setAmount(numeric);
  }, [expression]);

  const rows = useMemo(() => {
    return selectedAssets.map((asset) => {
      if (!snapshot) {
        return {
          asset,
          rawValue: asset.code === activeCode ? amount : null,
          displayValue: asset.code === activeCode ? formatAssetAmount(amount, asset) : '—'
        };
      }

      try {
        const rawValue = convertAmount(amount || '0', activeCode, asset.code, snapshot)
          .toSignificantDigits(16)
          .toString();

        return {
          asset,
          rawValue,
          displayValue: formatAssetAmount(rawValue, asset)
        };
      } catch {
        return { asset, rawValue: null, displayValue: '—' };
      }
    });
  }, [activeCode, amount, selectedAssets, snapshot]);

  const activateAsset = (asset: Asset, rawValue: string | null) => {
    if (rawValue === null) return;
    setAmount(rawValue);
    setExpression(rawValue);
    setActiveCode(asset.code);
    setCalculatorError(null);
  };

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

  const addAsset = (asset: Asset) => {
    setSelectedAssetIds((current) => current.includes(asset.id) ? current : [...current, asset.id]);
  };

  const removeAsset = (assetId: string) => {
    setSelectedAssetIds((current) => {
      if (current.length <= 2) return current;

      const removedAsset = findAsset(assetId);
      const next = current.filter((id) => id !== assetId);

      if (removedAsset?.code === activeCode) {
        const first = next.map(findAsset).find((asset): asset is Asset => Boolean(asset));
        const firstRow = rows.find((row) => row.asset.id === first?.id);

        if (first && firstRow?.rawValue) {
          setActiveCode(first.code);
          setAmount(firstRow.rawValue);
          setExpression(firstRow.rawValue);
        } else if (first) {
          setActiveCode(first.code);
        }
      }

      return next;
    });
  };

  const moveAsset = (assetId: string, direction: -1 | 1) => {
    setSelectedAssetIds((current) => {
      const index = current.indexOf(assetId);
      const nextIndex = index + direction;

      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;

      const next = [...current];
      const currentItem = next[index];
      const targetItem = next[nextIndex];

      if (currentItem === undefined || targetItem === undefined) return current;

      next[index] = targetItem;
      next[nextIndex] = currentItem;
      return next;
    });
  };

  return (
    <main className="screen">
      <header className="topbar">
        <div>
          <small>Pocket Rates</small>
          <h1>Converter</h1>
        </div>

        <div className="topbar-actions">
          <span className={`status status-${status}`} aria-label={`Rates ${status}`} />
          <button className="manage-button" type="button" onClick={() => setManagerOpen(true)}>
            Edit
          </button>
        </div>
      </header>

      <p className="meta">
        {snapshot
          ? `${snapshot.source} · ${snapshot.quoteType} · ${snapshot.sourceDate}`
          : status === 'error'
            ? 'Rates unavailable'
            : 'Loading rates…'}
      </p>

      <section className="currency-list" aria-label="Currencies">
        {rows.map(({ asset, rawValue, displayValue }) => {
          const active = asset.code === activeCode;

          return (
            <div className={`currency-row ${active ? 'is-active' : ''}`} key={asset.id}>
              <button
                className="currency-select"
                type="button"
                onClick={() => activateAsset(asset, rawValue)}
              >
                <span className="flag" aria-hidden="true">{asset.flag}</span>
                <span>
                  <strong>{asset.code}</strong>
                  <small>{asset.name}</small>
                </span>
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
              ) : (
                <output title={rawValue ?? undefined}>{displayValue}</output>
              )}
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

      {managerOpen && (
        <AssetManagerSheet
          selectedAssets={selectedAssets}
          onClose={() => setManagerOpen(false)}
          onAdd={addAsset}
          onRemove={removeAsset}
          onMove={moveAsset}
        />
      )}
    </main>
  );
}
