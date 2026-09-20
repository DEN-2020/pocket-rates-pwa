import Decimal from 'decimal.js-light';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { assetCatalog } from '../../domain/assets/catalog';
import { historyPeriods, resolveHistoryPeriod, type HistoryPeriod } from '../../domain/history/periods';
import type { HistoricalSeries } from '../../domain/history/types';

const RateChart = lazy(() => import('./RateChart'));
const provider = new FrankfurterProvider();
const fiatAssets = assetCatalog.filter((asset) => asset.kind === 'fiat');

function formatRate(value: string | null): string {
  if (!value) return '—';

  try {
    const decimal = new Decimal(value);
    const numeric = Number(decimal.toSignificantDigits(8).toString());

    if (!Number.isFinite(numeric)) return decimal.toSignificantDigits(8).toString();

    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: Math.abs(numeric) < 1 ? 6 : 4
    }).format(numeric);
  } catch {
    return '—';
  }
}

export function ChartsScreen() {
  const [base, setBase] = useState('EUR');
  const [quote, setQuote] = useState('EGP');
  const [period, setPeriod] = useState<HistoryPeriod>('1y');
  const [series, setSeries] = useState<HistoricalSeries | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();
    const resolved = resolveHistoryPeriod(period);

    setSeries(null);
    setStatus('loading');

    void provider
      .getHistory(
        {
          base,
          quote,
          from: resolved.from,
          to: resolved.to,
          grouping: resolved.grouping
        },
        controller.signal
      )
      .then((next) => {
        setSeries(next);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error(error);
          setStatus('error');
        }
      });

    return () => controller.abort();
  }, [base, period, quote]);

  const stats = useMemo(() => {
    if (!series || series.points.length === 0) {
      return { current: null, min: null, max: null, change: null };
    }

    let min = new Decimal(series.points[0]?.value ?? '0');
    let max = min;
    const first = min;
    let last = min;

    for (const point of series.points) {
      const value = new Decimal(point.value);
      if (value.lessThan(min)) min = value;
      if (value.greaterThan(max)) max = value;
      last = value;
    }

    const change = first.isZero()
      ? null
      : last.minus(first).div(first).mul(100);

    return {
      current: last.toString(),
      min: min.toString(),
      max: max.toString(),
      change: change?.toDecimalPlaces(2).toString() ?? null
    };
  }, [series]);

  const swapPair = () => {
    setBase(quote);
    setQuote(base);
  };

  const changeBase = (next: string) => {
    if (next === quote) {
      setQuote(base);
    }
    setBase(next);
  };

  const changeQuote = (next: string) => {
    if (next === base) {
      setBase(quote);
    }
    setQuote(next);
  };

  return (
    <main className="screen chart-screen">
      <header className="topbar">
        <div>
          <small>Pocket Rates</small>
          <h1>Charts</h1>
        </div>
        <span className={`status status-${status}`} aria-label={`Chart data ${status}`} />
      </header>

      <section className="pair-card" aria-label="Currency pair">
        <label>
          <span>From</span>
          <select value={base} onChange={(event) => changeBase(event.target.value)}>
            {fiatAssets.map((asset) => (
              <option value={asset.code} key={asset.id}>{asset.code} · {asset.name}</option>
            ))}
          </select>
        </label>

        <button className="swap-button" type="button" onClick={swapPair} aria-label="Swap currencies">
          ⇄
        </button>

        <label>
          <span>To</span>
          <select value={quote} onChange={(event) => changeQuote(event.target.value)}>
            {fiatAssets.map((asset) => (
              <option value={asset.code} key={asset.id}>{asset.code} · {asset.name}</option>
            ))}
          </select>
        </label>
      </section>

      <div className="period-strip" aria-label="Chart period">
        {historyPeriods.map((candidate) => (
          <button
            type="button"
            key={candidate}
            className={candidate === period ? 'is-selected' : ''}
            onClick={() => setPeriod(candidate)}
          >
            {candidate.toUpperCase()}
          </button>
        ))}
      </div>

      <section className="chart-card">
        <div className="chart-heading">
          <div>
            <small>1 {base}</small>
            <strong>{formatRate(stats.current)} {quote}</strong>
          </div>
          {stats.change !== null && (
            <span className={new Decimal(stats.change).isNegative() ? 'change-negative' : 'change-positive'}>
              {new Decimal(stats.change).isPositive() ? '+' : ''}{stats.change}%
            </span>
          )}
        </div>

        {status === 'loading' && <div className="chart-placeholder">Loading history…</div>}
        {status === 'error' && <div className="chart-placeholder">Historical rates are unavailable right now.</div>}
        {status === 'ready' && series && series.points.length === 0 && (
          <div className="chart-placeholder">No historical data for this pair and period.</div>
        )}
        {status === 'ready' && series && series.points.length > 0 && (
          <Suspense fallback={<div className="chart-placeholder">Loading chart…</div>}>
            <RateChart points={series.points} />
          </Suspense>
        )}

        <div className="chart-stats">
          <div><small>Low</small><strong>{formatRate(stats.min)}</strong></div>
          <div><small>High</small><strong>{formatRate(stats.max)}</strong></div>
          <div><small>Points</small><strong>{series?.points.length ?? '—'}</strong></div>
        </div>

        <p className="chart-meta">
          {series?.actualFrom && series.actualTo
            ? `${series.actualFrom} → ${series.actualTo} · ${series.grouping} · ${series.source}`
            : 'Frankfurter blended reference data'}
        </p>
        <p className="chart-attribution">
          Charting library by <a href="https://www.tradingview.com/" target="_blank" rel="noreferrer">TradingView</a>.
        </p>
      </section>
    </main>
  );
}
