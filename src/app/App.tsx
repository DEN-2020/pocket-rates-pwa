import { useEffect, useState } from 'react';
import { ChartsScreen } from '../features/charts/ChartsScreen';
import { ConverterScreen } from '../features/converter/ConverterScreen';
import { CustomRateScreen } from '../features/custom-rates/CustomRateScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import {
  ChartIcon,
  ConverterIcon,
  PencilIcon,
  SettingsIcon
} from '../shared/ui/icons';
import { PwaStatus } from './PwaStatus';

type AppTab = 'converter' | 'charts' | 'custom' | 'settings';

function tabFromHash(): AppTab {
  if (window.location.hash === '#/charts') return 'charts';
  if (window.location.hash === '#/custom-rate') return 'custom';
  if (window.location.hash === '#/settings') return 'settings';
  return 'converter';
}

export function App() {
  const [tab, setTab] = useState<AppTab>(() => tabFromHash());

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppTab) => {
    const hash =
      next === 'charts'
        ? '#/charts'
        : next === 'custom'
          ? '#/custom-rate'
          : next === 'settings'
            ? '#/settings'
            : '#/converter';

    if (window.location.hash === hash) {
      setTab(next);
      return;
    }

    window.location.hash = hash;
  };

  return (
    <>
      {tab === 'converter' && <ConverterScreen />}
      {tab === 'charts' && <ChartsScreen />}
      {tab === 'custom' && <CustomRateScreen />}
      {tab === 'settings' && <SettingsScreen />}

      <nav className="bottom-nav glass-surface" aria-label="Main navigation">
        <button
          type="button"
          className={tab === 'converter' ? 'is-active' : ''}
          aria-current={tab === 'converter' ? 'page' : undefined}
          onClick={() => navigate('converter')}
        >
          <ConverterIcon />
          <small>Converter</small>
        </button>

        <button
          type="button"
          className={tab === 'charts' ? 'is-active' : ''}
          aria-current={tab === 'charts' ? 'page' : undefined}
          onClick={() => navigate('charts')}
        >
          <ChartIcon />
          <small>Charts</small>
        </button>

        <button
          type="button"
          className={tab === 'custom' ? 'is-active' : ''}
          aria-current={tab === 'custom' ? 'page' : undefined}
          onClick={() => navigate('custom')}
        >
          <PencilIcon />
          <small>My rate</small>
        </button>

        <button
          type="button"
          className={tab === 'settings' ? 'is-active' : ''}
          aria-current={tab === 'settings' ? 'page' : undefined}
          onClick={() => navigate('settings')}
        >
          <SettingsIcon />
          <small>Settings</small>
        </button>
      </nav>

      <PwaStatus />
    </>
  );
}
