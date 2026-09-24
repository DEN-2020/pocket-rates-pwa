import { useEffect, useMemo, useRef, useState } from 'react';
import { CoinGeckoKeylessProvider } from '../../adapters/providers/coingecko';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { readPreference, writePreference } from '../../adapters/storage/preferencesDb';
import { readQuoteSnapshot, writeQuoteSnapshot } from '../../adapters/storage/quoteSnapshotsDb';
import { assetCatalog, findAsset, initialAssetIds } from '../../domain/assets/catalog';
import { formatAssetAmount } from '../../domain/assets/format';
import type { Asset } from '../../domain/assets/types';
import {
  CalculatorError,
  MAX_EXPRESSION_LENGTH,
  evaluateExpression
} from '../../domain/calculator/evaluateExpression';
import { convertAmount } from '../../domain/conversion/convert';
import { mergeQuoteSnapshots } from '../../domain/conversion/mergeSnapshots';
import type { QuoteSnapshot } from '../../domain/conversion/types';
import { GripIcon, PlusIcon, RefreshIcon } from '../../shared/ui/icons';
import { AssetManagerSheet } from './AssetManagerSheet';
import { CalculatorKeypad } from './CalculatorKeypad';

const fiatProvider = new FrankfurterProvider();
const cryptoProvider = new CoinGeckoKeylessProvider();
const plainNumberPattern = /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/;
const layoutPreferenceKey = 'converter-layout-v1';
const quoteCachePrefix = 'frankfurter:USD:';
const longPressMs = 280;

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

function friendlySourceName(source: string): string {
  return source
    .replaceAll('frankfurter', 'Frankfurter')
    .replaceAll('coingecko-keyless', 'CoinGecko')
    .replaceAll('USD reference', 'USD');
}

function formatSourceDate(value: string): string {
  if (!value) return '';
  if (!value.includes('T')) return value;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
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
  const [status, setStatus] = useState<'loading' | 'ready' | 'stale' | 'error'>('loading');
  const [preferencesLoaded, setPreferencesLoaded] = useState(false);
  const [managerOpen, setManagerOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const longPressTimerRef = useRef<number | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const selectedAssets = useMemo(
    () => selectedAssetIds.map(findAsset).filter((asset): asset is Asset => Boolean(asset)),
    [selectedAssetIds]
  );

  const quoteCodesKey = useMemo(
    () => selectedAssets.map((asset) => asset.id).sort().join(','),
    [selectedAssets]
  );

  const hasCrypto = selectedAssets.some((asset) => asset.kind === 'crypto');

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
    let alive = true;

    // Reconstruct from the sorted key so changing only visual row order does not hit providers again.
    const requestAssets = quoteCodesKey
      .split(',')
      .map(findAsset)
      .filter((asset): asset is Asset => Boolean(asset));

    const fiatAssets = requestAssets.filter((asset) => asset.kind === 'fiat');
    const cryptoAssets = requestAssets.filter((asset) => asset.kind === 'crypto');
    const fiatCodes = fiatAssets.map((asset) => asset.code).sort();
    const fiatNonBaseCodes = fiatCodes.filter((code) => code !== 'USD');
    const fiatCacheKey = `${quoteCachePrefix}${fiatCodes.join(',')}`;

    setSnapshot(null);
    setStatus('loading');

    void (async () => {
      let cachedFiat: QuoteSnapshot | undefined;

      if (fiatNonBaseCodes.length > 0) {
        try {
          cachedFiat = await readQuoteSnapshot(fiatCacheKey);

          if (alive && cachedFiat) {
            setSnapshot(mergeQuoteSnapshots('USD', [cachedFiat]));
            setStatus('stale');
          }
        } catch (error) {
          console.warn('Could not read cached fiat rates.', error);
        }
      }

      const referenceOnly: QuoteSnapshot = {
        reference: 'USD',
        rates: {},
        source: 'USD reference',
        quoteType: 'reference',
        sourceDate: '',
        fetchedAt: new Date().toISOString()
      };

      const fiatPromise = fiatNonBaseCodes.length > 0
        ? fiatProvider.getLatest('USD', fiatCodes, controller.signal)
        : Promise.resolve(referenceOnly);

      const cryptoPromise = cryptoAssets.length > 0
        ? cryptoProvider.getLatest(cryptoAssets, controller.signal)
        : Promise.resolve<QuoteSnapshot | null>(null);

      const [fiatResult, cryptoResult] = await Promise.allSettled([fiatPromise, cryptoPromise]);

      if (!alive || controller.signal.aborted) return;

      let usedFallback = false;
      let effectiveFiat: QuoteSnapshot | undefined;

      if (fiatResult.status === 'fulfilled') {
        effectiveFiat = fiatResult.value;

        if (fiatNonBaseCodes.length > 0) {
          void writeQuoteSnapshot(fiatCacheKey, effectiveFiat).catch((error: unknown) => {
            console.warn('Could not cache fiat rates.', error);
          });
        }
      } else if (cachedFiat) {
        effectiveFiat = cachedFiat;
        usedFallback = true;
      } else {
        console.error(fiatResult.reason);
      }

      let effectiveCrypto: QuoteSnapshot | null = null;

      if (cryptoResult.status === 'fulfilled') {
        effectiveCrypto = cryptoResult.value;
      } else if (cryptoAssets.length > 0) {
        console.error(cryptoResult.reason);
        usedFallback = true;
      }

      const available = [effectiveFiat, effectiveCrypto].filter(
        (candidate): candidate is QuoteSnapshot => Boolean(candidate)
      );

      if (available.length === 0) {
        setStatus('error');
        return;
      }

      setSnapshot(mergeQuoteSnapshots('USD', available));

      const expectedProvidersSucceeded =
        fiatResult.status === 'fulfilled' &&
        (cryptoAssets.length === 0 || cryptoResult.status === 'fulfilled');

      setStatus(expectedProvidersSucceeded && !usedFallback ? 'ready' : 'stale');
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [quoteCodesKey, refreshVersion]);

  useEffect(() => {
    const numeric = parsePlainNumber(expression);
    if (numeric !== null) setAmount(numeric);
  }, [expression]);

  useEffect(() => {
    const refreshWhenOnline = () => setRefreshVersion((current) => current + 1);
    window.addEventListener('online', refreshWhenOnline);
    return () => window.removeEventListener('online', refreshWhenOnline);
  }, []);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current !== null) {
        window.clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

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
    if (draggingId || rawValue === null) return;
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

  const moveAssetTo = (assetId: string, targetId: string) => {
    if (assetId === targetId) return;

    setSelectedAssetIds((current) => {
      const from = current.indexOf(assetId);
      const to = current.indexOf(targetId);
      if (from < 0 || to < 0 || from === to) return current;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      if (!moved) return current;
      next.splice(to, 0, moved);
      return next;
    });
  };

  const clearLongPressTimer = () => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleGripPointerDown = (assetId: string, event: React.PointerEvent<HTMLButtonElement>) => {
    clearLongPressTimer();
    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);

    longPressTimerRef.current = window.setTimeout(() => {
      setDraggingId(assetId);
      navigator.vibrate?.(12);
      longPressTimerRef.current = null;
    }, longPressMs);
  };

  const handleGripPointerMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!draggingId || pointerIdRef.current !== event.pointerId) return;

    event.preventDefault();
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const row = hit?.closest<HTMLElement>('[data-asset-id]');
    const targetId = row?.dataset.assetId;

    if (targetId) moveAssetTo(draggingId, targetId);
  };

  const stopGripInteraction = (event: React.PointerEvent<HTMLButtonElement>) => {
    clearLongPressTimer();

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    pointerIdRef.current = null;
    setDraggingId(null);
  };

  return (
    <main className="screen converter-screen">
      <header className="topbar compact-topbar">
        <div className="title-block">
          <small>Pocket Rates</small>
          <h1>Converter</h1>
        </div>

        <div className="topbar-actions">
          <span className={`status status-${status}`} aria-label={`Rates ${status}`} />
          <button
            className="icon-button refresh-button"
            type="button"
            onClick={() => setRefreshVersion((current) => current + 1)}
            aria-label="Refresh rates"
            disabled={status === 'loading'}
          >
            <RefreshIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setManagerOpen(true)}
            aria-label="Add or manage currencies"
          >
            <PlusIcon />
          </button>
        </div>
      </header>

      <p className="meta converter-meta">
        {snapshot
          ? `${friendlySourceName(snapshot.source)} · ${snapshot.quoteType}${snapshot.sourceDate ? ` · ${formatSourceDate(snapshot.sourceDate)}` : ''}${status === 'stale' ? ' · partial/cached' : ''}`
          : status === 'error'
            ? 'Rates unavailable'
            : 'Loading rates…'}
        {hasCrypto && (
          <>
            {' · '}
            <a className="provider-attribution" href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer">
              CoinGecko
            </a>
          </>
        )}
      </p>

      <section className="currency-viewport" aria-label="Currencies">
        <div className="currency-list glass-surface">
          {rows.map(({ asset, rawValue, displayValue }) => {
            const active = asset.code === activeCode;
            const dragging = draggingId === asset.id;

            return (
              <div
                className={`currency-row ${active ? 'is-active' : ''} ${dragging ? 'is-dragging' : ''}`}
                key={asset.id}
                data-asset-id={asset.id}
              >
                <button
                  className="currency-drag-handle"
                  type="button"
                  aria-label={`Long press and drag to reorder ${asset.code}`}
                  onPointerDown={(event) => handleGripPointerDown(asset.id, event)}
                  onPointerMove={handleGripPointerMove}
                  onPointerUp={stopGripInteraction}
                  onPointerCancel={stopGripInteraction}
                >
                  <GripIcon />
                </button>

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
                  <div className="editable-amount">
                    <input
                      aria-label={`Amount or calculation in ${asset.code}`}
                      inputMode="none"
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
                    <span className="edit-hint" aria-hidden="true">tap to type</span>
                  </div>
                ) : (
                  <output title={rawValue ?? undefined}>{displayValue}</output>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="calculator-dock">
        {calculatorError && (
          <div className="calculator-feedback has-error" aria-live="polite">
            {calculatorError}
          </div>
        )}

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
      </section>

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
