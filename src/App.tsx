import { useState } from 'react';
import type { SubstationData } from './data/schema';
import { loadResult, showPlaceholderBadge } from './data/load';
import { PlaceholderBadge } from './ui/components/PlaceholderBadge';
import { DataErrorScreen } from './ui/screens/DataErrorScreen';
import { DefenseScreen } from './ui/screens/DefenseScreen';
import { MapScreen } from './ui/screens/MapScreen';
import { ResultScreen } from './ui/screens/ResultScreen';
import { StartScreen } from './ui/screens/StartScreen';

type Screen = 'start' | 'map' | 'defense' | 'result';

function Game({ data }: { data: SubstationData }) {
  const [screen, setScreen] = useState<Screen>('start');
  const [selected, setSelected] = useState<string[]>([]);

  switch (screen) {
    case 'start':
      return <StartScreen onStart={() => setScreen('map')} />;
    case 'map':
      return <MapScreen data={data} onNext={() => setScreen('defense')} />;
    case 'defense':
      return (
        <DefenseScreen
          data={data}
          selected={selected}
          onChange={setSelected}
          onBack={() => setScreen('map')}
          onSimulate={() => setScreen('result')}
        />
      );
    case 'result':
      return (
        <ResultScreen
          data={data}
          selected={selected}
          onRetry={() => setScreen('defense')}
          onHome={() => {
            setSelected([]);
            setScreen('start');
          }}
        />
      );
  }
}

export default function App() {
  return (
    <>
      {loadResult.ok ? (
        <Game data={loadResult.data} />
      ) : (
        <DataErrorScreen errors={loadResult.errors} />
      )}
      {showPlaceholderBadge && <PlaceholderBadge />}
    </>
  );
}
