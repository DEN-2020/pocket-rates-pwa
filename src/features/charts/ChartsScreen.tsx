import Decimal from 'decimal.js-light';
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { readHistoricalSeries, writeHistoricalSeries } from '../../adapters/storage/historySeriesDb';
import { assetCatalog } from '../../domain/assets/catalog';
import { historyPeriods, resolveHistoryPeriod, type HistoryPeriod } from '../../domain/history/periods';
import type { HistoricalSeries } from '../../domain/history/types';
import { RefreshIcon, SwapIcon } from '../../shared/ui/icons';

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
  const [status, setStatus] = useState<'loading' | 'ready' | 'stale' | 'error'>('loading');
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    let alive = true;
    const resolved = resolveHistoryPeriod(period);
    const cacheKey = `frankfurter:${base}:${quote}:${resolved.from}:${resolved.to}:${resolved.grouping}`;

    setSeries(null);
    setStatus('loading');

    void (async () => {
      let cached: HistoricalSeries | undefined;

      try {
        cached = await readHistoricalSeries(cacheKey);
        if (alive && cached) {
          setSeries(cached);
          setStatus('stale');
        }
      } catch (error) {
        console.warn('Could not read cached chart history.', error);
      }

      try {
        const next = await provider.getHistory(
          {
            base,
            quote,
            from: resolved.from,
            to: resolved.to,
            grouping: resolved.grouping
          },
          controller.signal
        );

        if (!alive) return;

        setSeries(next);
        setStatus('ready');

        void writeHistoricalSeries(cacheKey, next).catch((error: unknown) => {
          console.warn('Could not cache chart history.', error);
        });
      } catch (error) {
        if (!controller.signal.aborted && alive) {
          console.error(error);
          setStatus(cached ? 'stale' : 'error');
        }
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [base, period, quote, refreshVersion]);

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
        <div className="topbar-actions">
          <span className={`status status-${status}`} aria-label={`Chart data ${status}`} />
          <button
            className="icon-button refresh-button"
            type="button"
            onClick={() => setRefreshVersion((current) => current + 1)}
            aria-label="Refresh chart data"
            disabled={status === 'loading'}
          >
            <RefreshIcon />
          </button>
        </div>
      </header>

      <section className="pair-card" aria-label="Currency pair">
        <label>
          <span>From</span>
          <select value={base} onChange={(event) => changeBase(event.target.value)}>
            {fiatAssets.map((asset) => (
              <option value={asset.code} key={asset.id}>{asset.flag ? `${asset.flag} ` : ''}{asset.code}</option>
            ))}
          </select>
        </label>

        <button className="swap-button" type="button" onClick={swapPair} aria-label="Swap currencies">
          <SwapIcon />
        </button>

        <label>
          <span>To</span>
          <select value={quote} onChange={(event) => changeQuote(event.target.value)}>
            {fiatAssets.map((asset) => (
              <option value={asset.code} key={asset.id}>{asset.flag ? `${asset.flag} ` : ''}{asset.code}</option>
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

        {status === 'loading' && !series && <div className="chart-placeholder">Loading history…</div>}
        {status === 'error' && <div className="chart-placeholder">Historical rates are unavailable right now.</div>}
        {(status === 'ready' || status === 'stale') && series && series.points.length === 0 && (
          <div className="chart-placeholder">No historical data for this pair and period.</div>
        )}
        {(status === 'ready' || status === 'stale') && series && series.points.length > 0 && (
          <>
            {status === 'stale' && <div className="cached-banner">Showing cached history while fresh data is unavailable.</div>}
            <Suspense fallback={<div className="chart-placeholder">Loading chart…</div>}>
              <RateChart points={series.points} />
            </Suspense>
          </>
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
