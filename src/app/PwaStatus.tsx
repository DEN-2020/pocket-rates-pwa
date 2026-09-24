import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PwaStatus() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia('(display-mode: standalone)').matches
  );
  const [installDismissed, setInstallDismissed] = useState(false);

  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker
  } = useRegisterSW({
    onRegisterError(error) {
      console.warn('Service worker registration failed.', error);
    }
  });

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
      setInstallDismissed(false);
    };

    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const dismissStatus = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
    setInstallDismissed(true);
  };

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const showInstall = Boolean(installPrompt && !installed && !installDismissed);

  if (!offlineReady && !needRefresh && !showInstall) return null;

  return (
    <aside className="pwa-toast" aria-live="polite">
      <div className="pwa-toast-copy">
        <strong>
          {needRefresh
            ? 'Update available'
            : offlineReady
              ? 'Ready offline'
              : 'Install Pocket Rates'}
        </strong>
        <span>
          {needRefresh
            ? 'A newer version is ready.'
            : offlineReady
              ? 'The app shell is cached for offline launch.'
              : 'Add it to your home screen for faster access.'}
        </span>
      </div>

      <div className="pwa-toast-actions">
        {needRefresh && (
          <button type="button" className="pwa-primary" onClick={() => void updateServiceWorker(true)}>
            Update
          </button>
        )}
        {!needRefresh && showInstall && (
          <button type="button" className="pwa-primary" onClick={() => void install()}>
            Install
          </button>
        )}
        <button type="button" onClick={dismissStatus}>
          Close
        </button>
      </div>
    </aside>
  );
}
