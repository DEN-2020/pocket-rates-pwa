import { useMemo, useState } from 'react';
import { assetCatalog } from '../../domain/assets/catalog';
import type { Asset } from '../../domain/assets/types';
import { CloseIcon } from '../../shared/ui/icons';

interface CurrencyReplaceSheetProps {
  currentAsset: Asset;
  selectedAssets: readonly Asset[];
  onClose: () => void;
  onChoose: (asset: Asset) => void;
}

export function CurrencyReplaceSheet({
  currentAsset,
  selectedAssets,
  onClose,
  onChoose
}: CurrencyReplaceSheetProps) {
  const [query, setQuery] = useState('');
  const selectedIds = useMemo(
    () => new Set(selectedAssets.map((asset) => asset.id)),
    [selectedAssets]
  );

  const normalizedQuery = query.trim().toLowerCase();

  const options = useMemo(() => {
    return assetCatalog.filter((asset) => {
      if (asset.id !== currentAsset.id && selectedIds.has(asset.id)) return false;
      if (!normalizedQuery) return true;

      return (
        asset.code.toLowerCase().includes(normalizedQuery) ||
        asset.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [currentAsset.id, normalizedQuery, selectedIds]);

  return (
    <div
      className="sheet-backdrop"
      role="presentation"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="asset-sheet replace-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="replace-currency-title"
      >
        <header className="sheet-header">
          <div>
            <small>Replace {currentAsset.code}</small>
            <h2 id="replace-currency-title">Choose currency</h2>
          </div>

          <button className="icon-button" type="button" onClick={onClose} aria-label="Close currency picker">
            <CloseIcon />
          </button>
        </header>

        <label className="search-field">
          <span className="sr-only">Search currency</span>
          <input
            autoFocus
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search currency"
            autoComplete="off"
            inputMode="search"
          />
        </label>

        <div className="available-assets replace-options" aria-label="Currency choices">
          {options.map((asset) => (
            <button
              className={`available-asset-row ${asset.id === currentAsset.id ? 'is-current' : ''}`}
              type="button"
              key={asset.id}
              onClick={() => onChoose(asset)}
            >
              <span className="flag" aria-hidden="true">{asset.flag}</span>
              <span className="asset-label">
                <strong>{asset.code}</strong>
                <small>{asset.name}</small>
              </span>
              {asset.id === currentAsset.id && <span className="current-label">Current</span>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
