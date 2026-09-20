import { useEffect, useMemo, useState } from 'react';
import { readPreference, writePreference } from '../../adapters/storage/preferencesDb';
import { assetCatalog } from '../../domain/assets/catalog';
import { convertWithCustomRate } from '../../domain/customRates/convertCustomRate';

const fiatAssets = assetCatalog.filter((asset) => asset.kind === 'fiat');
const preferenceKey = 'custom-rate-v1';

interface SavedCustomRate {
  base: string;
  quote: string;
  rate: string;
  amount: string;
}

function sanitizeNumber(value: string): string {
  return value.replace(',', '.').replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1').slice(0, 32);
}

export function CustomRateScreen() {
  const [base, setBase] = useState('EUR');
  const [quote, setQuote] = useState('EGP');
  const [rate, setRate] = useState('52.5');
  const [amount, setAmount] = useState('100');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    void readPreference<SavedCustomRate>(preferenceKey)
      .then((saved) => {
        if (!alive || !saved) return;
        setBase(saved.base);
        setQuote(saved.quote);
        setRate(saved.rate);
        setAmount(saved.amount);
      })
      .finally(() => {
        if (alive) setLoaded(true);
      });

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;

    void writePreference<SavedCustomRate>(preferenceKey, {
      base,
      quote,
      rate,
      amount
    });
  }, [amount, base, loaded, quote, rate]);

  const result = useMemo(() => {
    try {
      if (!amount || !rate) return null;
      return convertWithCustomRate(amount, 'base-to-quote', rate).toSignificantDigits(14).toString();
    } catch {
      return null;
    }
  }, [amount, rate]);

  const reverse = useMemo(() => {
    try {
      if (!rate) return null;
      return convertWithCustomRate('1', 'quote-to-base', rate).toSignificantDigits(12).toString();
    } catch {
      return null;
    }
  }, [rate]);

  const swap = () => {
    const nextBase = quote;
    const nextQuote = base;

    if (reverse) {
      setRate(reverse);
    }

    setBase(nextBase);
    setQuote(nextQuote);
  };

  const changeBase = (next: string) => {
    if (next === quote) setQuote(base);
    setBase(next);
  };

  const changeQuote = (next: string) => {
    if (next === base) setBase(quote);
    setQuote(next);
  };

  return (
    <main className="screen custom-rate-screen">
      <header className="topbar">
        <div>
          <small>Pocket Rates</small>
          <h1>My rate</h1>
        </div>
      </header>

      <section className="custom-rate-card">
        <div className="custom-pair-row">
          <label>
            <span>From</span>
            <select value={base} onChange={(event) => changeBase(event.target.value)}>
              {fiatAssets.map((asset) => (
                <option key={asset.id} value={asset.code}>{asset.code} · {asset.name}</option>
              ))}
            </select>
          </label>

          <button className="swap-button" type="button" onClick={swap} aria-label="Swap custom rate pair">
            ⇄
          </button>

          <label>
            <span>To</span>
            <select value={quote} onChange={(event) => changeQuote(event.target.value)}>
              {fiatAssets.map((asset) => (
                <option key={asset.id} value={asset.code}>{asset.code} · {asset.name}</option>
              ))}
            </select>
          </label>
        </div>

        <label className="custom-rate-field">
          <span>Custom rate</span>
          <div className="rate-input-shell">
            <small>1 {base} =</small>
            <input
              inputMode="decimal"
              value={rate}
              onChange={(event) => setRate(sanitizeNumber(event.target.value))}
              aria-label={`Custom rate from ${base} to ${quote}`}
            />
            <strong>{quote}</strong>
          </div>
        </label>

        <div className="custom-divider" />

        <label className="custom-rate-field">
          <span>Amount</span>
          <div className="rate-input-shell">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(sanitizeNumber(event.target.value))}
              aria-label={`Amount in ${base}`}
            />
            <strong>{base}</strong>
          </div>
        </label>

        <div className="custom-result">
          <small>Result</small>
          <strong>{result ?? '—'} {quote}</strong>
          <span>{reverse ? `1 ${quote} = ${reverse} ${base}` : 'Enter a valid rate'}</span>
        </div>
      </section>

      <p className="custom-rate-note">
        Manual rate is stored only on this device. It does not replace official or market data elsewhere in the app.
      </p>
    </main>
  );
}
