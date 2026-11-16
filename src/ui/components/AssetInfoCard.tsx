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
  const risk = assetRisk(asset);
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-navy-950/80 p-6 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="asset-card-title"
        className="pop-in w-full max-w-xl rounded-md border-2 border-cyan-accent bg-navy-900 shadow-[0_0_60px_-20px_var(--color-cyan-accent)]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-5 border-b border-navy-700 px-6 py-4">
          <span aria-hidden="true" className="font-display text-7xl leading-none text-cyan-accent">
            {asset.level}
          </span>
          <div>
            <h2 id="asset-card-title" className="text-4xl leading-tight">
              {asset.name}
            </h2>
            <p className="text-text-muted">
              {es.levelLabel(asset.level)}: {es.levels[asset.level]}
            </p>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-2xl">{asset.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <dt className="text-text-muted">{t.protocol}</dt>
              <dd className="text-xl font-bold">{asset.protocol}</dd>
            </div>
            <div>
              <dt className="text-text-muted">{t.risk}</dt>
              <dd>
                <span className="font-display text-4xl text-attack">{risk}</span>
                <span className="block text-text-muted">
                  {t.riskFormula(asset.probability, asset.impact, risk)}
                </span>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} autoFocus>
              {t.close}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
