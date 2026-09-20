import { useEffect, useState } from 'react';
import { ChartsScreen } from '../features/charts/ChartsScreen';
import { ConverterScreen } from '../features/converter/ConverterScreen';

type AppTab = 'converter' | 'charts';

function tabFromHash(): AppTab {
  return window.location.hash === '#/charts' ? 'charts' : 'converter';
}

export function App() {
  const [tab, setTab] = useState<AppTab>(() => tabFromHash());

  useEffect(() => {
    const onHashChange = () => setTab(tabFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const navigate = (next: AppTab) => {
    const hash = next === 'charts' ? '#/charts' : '#/converter';

    if (window.location.hash === hash) {
      setTab(next);
      return;
    }

    window.location.hash = hash;
  };

  return (
    <>
      {tab === 'converter' ? <ConverterScreen /> : <ChartsScreen />}

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
      </nav>
    </>
  );
}
