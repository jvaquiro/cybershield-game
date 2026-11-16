import { useEffect } from 'react';
import type { Asset } from '../../data/schema';
import { assetRisk } from '../../engine/risk';
import { es } from '../../i18n/es';
import { Button } from './Button';

interface AssetInfoCardProps {
  asset: Asset;
  onClose: () => void;
}

/** Modal info card for one asset. Tapping outside or pressing Escape closes it. */
export function AssetInfoCard({ asset, onClose }: AssetInfoCardProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const t = es.assetCard;
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/75 p-6"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-card-title"
        className="w-full max-w-lg rounded-2xl border-2 border-cyan-accent bg-navy-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="asset-card-title" className="text-3xl font-bold text-cyan-accent">
          {asset.name}
        </h2>
        <p className="mt-1 text-text-muted">
          {`${es.levelLabel(asset.level)} · ${es.levels[asset.level]}`}
        </p>
        <p className="mt-4 text-xl">{asset.description}</p>
        <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
          <dt className="font-bold text-text-muted">{t.protocol}</dt>
          <dd>{asset.protocol}</dd>
          <dt className="font-bold text-text-muted">{t.risk}</dt>
          <dd>
            <span className="font-bold text-attack">{assetRisk(asset)}</span>
            {` · ${t.riskFormula(asset.probability, asset.impact, assetRisk(asset))}`}
          </dd>
        </dl>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} autoFocus>
            {t.close}
          </Button>
        </div>
      </div>
    </div>
  );
}
