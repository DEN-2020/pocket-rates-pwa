export type ThemePreference = 'system' | 'light' | 'dark';

const storageKey = 'pocket-rates-theme';

export function readThemePreference(): ThemePreference {
  const value = localStorage.getItem(storageKey);
  return value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
}

export function applyTheme(theme: ThemePreference): void {
  const root = document.documentElement;

  if (theme === 'system') {
    delete root.dataset.theme;
  } else {
    root.dataset.theme = theme;
  }

  root.style.colorScheme = theme === 'system' ? 'light dark' : theme;
}

export function saveThemePreference(theme: ThemePreference): void {
  localStorage.setItem(storageKey, theme);
  applyTheme(theme);
}
