import { useCallback, useState } from 'react';
import type { SubstationData } from '../../data/schema';
import { es } from '../../i18n/es';
import { AssetInfoCard } from '../components/AssetInfoCard';
import { Button } from '../components/Button';
import { ScreenLayout } from '../components/ScreenLayout';
import { SubstationMap } from '../components/SubstationMap';

interface MapScreenProps {
  data: SubstationData;
  onNext: () => void;
}

export function MapScreen({ data, onNext }: MapScreenProps) {
  const [openAssetId, setOpenAssetId] = useState<string | null>(null);
  const openAsset = data.assets.find((asset) => asset.id === openAssetId);
  const close = useCallback(() => setOpenAssetId(null), []);

  return (
    <ScreenLayout
      title={es.map.title}
      hint={es.map.hint}
      step={0}
      footer={<Button onClick={onNext}>{es.map.next}</Button>}
    >
      <SubstationMap data={data} onAssetTap={setOpenAssetId} />
      {openAsset && <AssetInfoCard asset={openAsset} onClose={close} />}
    </ScreenLayout>
  );
}
