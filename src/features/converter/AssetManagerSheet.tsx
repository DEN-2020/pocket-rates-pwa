import { useMemo, useState } from 'react';
import { assetCatalog } from '../../domain/assets/catalog';
import type { Asset } from '../../domain/assets/types';

interface AssetManagerSheetProps {
  selectedAssets: readonly Asset[];
  onClose: () => void;
  onAdd: (asset: Asset) => void;
  onRemove: (assetId: string) => void;
  onMove: (assetId: string, direction: -1 | 1) => void;
}

export function AssetManagerSheet({
  selectedAssets,
  onClose,
  onAdd,
  onRemove,
  onMove
}: AssetManagerSheetProps) {
  const [query, setQuery] = useState('');
  const selectedIds = useMemo(
    () => new Set(selectedAssets.map((asset) => asset.id)),
    [selectedAssets]
  );

  const normalizedQuery = query.trim().toLowerCase();
  const available = useMemo(() => {
    return assetCatalog.filter((asset) => {
      if (selectedIds.has(asset.id)) return false;
      if (!normalizedQuery) return true;
      return (
        asset.code.toLowerCase().includes(normalizedQuery) ||
        asset.name.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [normalizedQuery, selectedIds]);

  return (
    <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="asset-sheet" role="dialog" aria-modal="true" aria-labelledby="asset-sheet-title">
        <header className="sheet-header">
          <div>
            <small>Customize</small>
            <h2 id="asset-sheet-title">Currencies</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close currency manager">×</button>
        </header>

        <div className="selected-assets" aria-label="Selected currencies">
          {selectedAssets.map((asset, index) => (
            <div className="selected-asset-row" key={asset.id}>
              <span className="flag" aria-hidden="true">{asset.flag}</span>
              <span className="asset-label"><strong>{asset.code}</strong><small>{asset.name}</small></span>
              <div className="asset-actions">
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => onMove(asset.id, -1)}
                  disabled={index === 0}
                  aria-label={`Move ${asset.code} up`}
                >↑</button>
                <button
                  type="button"
                  className="mini-button"
                  onClick={() => onMove(asset.id, 1)}
                  disabled={index === selectedAssets.length - 1}
                  aria-label={`Move ${asset.code} down`}
                >↓</button>
                <button
                  type="button"
                  className="mini-button danger-button"
                  onClick={() => onRemove(asset.id)}
                  disabled={selectedAssets.length <= 2}
                  aria-label={`Remove ${asset.code}`}
                >−</button>
              </div>
            </div>
          ))}
        </div>

        <label className="search-field">
          <span className="sr-only">Search currencies</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by code or name"
            autoComplete="off"
            inputMode="search"
          />
        </label>

        <div className="available-assets" aria-label="Available currencies">
          {available.map((asset) => (
            <button className="available-asset-row" type="button" key={asset.id} onClick={() => onAdd(asset)}>
              <span className="flag" aria-hidden="true">{asset.flag}</span>
              <span className="asset-label"><strong>{asset.code}</strong><small>{asset.name}</small></span>
              <span className="add-glyph" aria-hidden="true">＋</span>
            </button>
          ))}
          {available.length === 0 && <p className="empty-state">No matching currencies.</p>}
        </div>
      </section>
    </div>
  );
}
