import { useEffect, useState } from 'react';
import { ChartsScreen } from '../features/charts/ChartsScreen';
import { ConverterScreen } from '../features/converter/ConverterScreen';
import { CustomRateScreen } from '../features/custom-rates/CustomRateScreen';
import { PwaStatus } from './PwaStatus';

type AppTab = 'converter' | 'charts' | 'custom';

function tabFromHash(): AppTab {
  if (window.location.hash === '#/charts') return 'charts';
  if (window.location.hash === '#/custom-rate') return 'custom';
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

      <nav className="bottom-nav" aria-label="Main navigation">
        <button
          type="button"
          className={tab === 'converter' ? 'is-active' : ''}
          aria-current={tab === 'converter' ? 'page' : undefined}
          onClick={() => navigate('converter')}
        >
          <span aria-hidden="true">⇄</span>
          <small>Converter</small>
        </button>

        <button
          type="button"
          className={tab === 'charts' ? 'is-active' : ''}
          aria-current={tab === 'charts' ? 'page' : undefined}
          onClick={() => navigate('charts')}
        >
          <span aria-hidden="true">⌁</span>
          <small>Charts</small>
        </button>

        <button
          type="button"
          className={tab === 'custom' ? 'is-active' : ''}
          aria-current={tab === 'custom' ? 'page' : undefined}
          onClick={() => navigate('custom')}
        >
          <span aria-hidden="true">✎</span>
          <small>My rate</small>
        </button>
      </nav>

      <PwaStatus />
    </>
  );
}
