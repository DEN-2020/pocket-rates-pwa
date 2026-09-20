import { useEffect, useState } from 'react';
import {
  applyTheme,
  readThemePreference,
  saveThemePreference,
  type ThemePreference
} from '../../app/theme';

const themes: readonly { id: ThemePreference; label: string; description: string }[] = [
  { id: 'system', label: 'System', description: 'Follow the phone theme' },
  { id: 'dark', label: 'Dark', description: 'Always use dark mode' },
  { id: 'light', label: 'Light', description: 'Always use light mode' }
];

export function SettingsScreen() {
  const [theme, setTheme] = useState<ThemePreference>(() => readThemePreference());
  const [online, setOnline] = useState(() => navigator.onLine);

  useEffect(() => {
    applyTheme(theme);

    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [theme]);

  const chooseTheme = (next: ThemePreference) => {
    setTheme(next);
    saveThemePreference(next);
  };

  return (
    <main className="screen settings-screen">
      <header className="topbar">
        <div>
          <small>Pocket Rates</small>
          <h1>Settings</h1>
        </div>
      </header>

      <section className="settings-card">
        <div className="settings-section-heading">
          <small>Appearance</small>
          <strong>Theme</strong>
        </div>

        <div className="theme-options">
          {themes.map((option) => (
            <button
              type="button"
              key={option.id}
              className={theme === option.id ? 'is-selected' : ''}
              aria-pressed={theme === option.id}
              onClick={() => chooseTheme(option.id)}
            >
              <span>{option.label}</span>
              <small>{option.description}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <small>Status</small>
          <strong>Local-first app</strong>
        </div>

        <dl className="settings-list">
          <div>
            <dt>Connection</dt>
            <dd>{online ? 'Online' : 'Offline'}</dd>
          </div>
          <div>
            <dt>Preferences</dt>
            <dd>Stored on this device</dd>
          </div>
          <div>
            <dt>Rates</dt>
            <dd>Cached for offline fallback</dd>
          </div>
          <div>
            <dt>Backend</dt>
            <dd>Not required for MVP</dd>
          </div>
        </dl>
      </section>

      <section className="settings-card">
        <div className="settings-section-heading">
          <small>Data</small>
          <strong>Sources</strong>
        </div>

        <div className="source-links">
          <a href="https://frankfurter.dev/" target="_blank" rel="noreferrer">
            <span>Fiat reference rates</span>
            <strong>Frankfurter</strong>
          </a>
          <a href="https://www.coingecko.com/en/api" target="_blank" rel="noreferrer">
            <span>Crypto pilot prices</span>
            <strong>Powered by CoinGecko</strong>
          </a>
        </div>
      </section>

      <p className="settings-note">
        Pocket Rates keeps calculator inputs and preferences local. Rates are informational reference data, not executable trading quotes. Crypto uses CoinGecko's keyless API only for the current pilot and can be rate-limited.
      </p>
    </main>
  );
}
