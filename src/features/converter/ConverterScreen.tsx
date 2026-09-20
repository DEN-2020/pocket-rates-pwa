import { useEffect, useMemo, useState } from 'react';
import { FrankfurterProvider } from '../../adapters/providers/frankfurter';
import { initialAssets } from '../../domain/assets/catalog';
import { convertAmount } from '../../domain/conversion/convert';
import type { QuoteSnapshot } from '../../domain/conversion/types';

const assets = initialAssets;
const provider = new FrankfurterProvider();

export function ConverterScreen() {
  const [activeCode, setActiveCode] = useState('EUR');
  const [amount, setAmount] = useState('100');
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

  const rows = useMemo(() => {
    return assets.map((asset) => {
      if (!snapshot) return { asset, value: asset.code === activeCode ? amount : '—' };

      try {
        const value = convertAmount(amount || '0', activeCode, asset.code, snapshot);
        return { asset, value: value.toSignificantDigits(12).toString() };
      } catch {
        return { asset, value: '—' };
      }
    });
  }, [activeCode, amount, snapshot]);

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
          : status === 'error'
            ? 'Rates unavailable'
            : 'Loading rates…'}
      </p>

      <section className="currency-list">
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
                    setActiveCode(asset.code);
                  }
                }}
              >
                <span className="flag">{asset.flag}</span>
                <span><strong>{asset.code}</strong><small>{asset.name}</small></span>
              </button>

              {active ? (
                <input
                  aria-label={`Amount in ${asset.code}`}
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value.replace(',', '.'))}
                />
              ) : (
                <output>{value}</output>
              )}
            </div>
          );
        })}
      </section>

      <div className="phase-note">
        Foundation build: real fiat provider + decimal conversion kernel. Calculator, persistence,
        charts and full offline UX follow the approved phases.
      </div>
    </main>
  );
}
