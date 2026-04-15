import { useEffect, useMemo, useState } from 'react';
import GameCard from '../components/GameCard';
import {
  RARITIES,
  NEXT_RARITY_MAP,
  LAB_CONFIG
} from '../config';
import {
  loadLocalCollection,
  saveLocalCollection,
  syncLocalCollectionToCloud,
  toPersistedCard
} from '../collectionSync';

const FUSION_SUCCESS_RATE = LAB_CONFIG.FUSION_SUCCESS_RATE;

export default function Lab({ session }) {
  const [collection, setCollection] = useState([]);
  const [pool, setPool] = useState([]);
  const [selectedRarity, setSelectedRarity] = useState('COMMON');
  const [selectedIds, setSelectedIds] = useState([]);
  const [result, setResult] = useState(null);
  const [fusionState, setFusionState] = useState(null);
  const [resultAnimKey, setResultAnimKey] = useState(0);
  const [message, setMessage] = useState('Pick 5 cards from one rarity, then transform them.');

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    try {
      const res = await fetch('/games.json');
      const games = await res.json();
      setPool(games);
      const byId = new Map(games.map((g) => [String(g.id), g]));

      const saved = loadLocalCollection();
      const hydrated = saved.map((item) => {
        const fromCatalog = byId.get(String(item.id));
        return fromCatalog ? { ...fromCatalog, ...item } : item;
      });

      const normalized = hydrated.map((c, i) => ({ 
        ...c, 
        _labId: c._labId || `${c.id}-${i}-${Date.now()}` 
      }));
      setCollection(normalized);
    } catch (err) {
      console.error("Error loading lab data:", err);
    }
  };

  const persistCollection = async (nextCollection) => {
    const toSave = nextCollection.map(toPersistedCard);
    saveLocalCollection(toSave);

    if (!session) {
      return;
    }

    try {
      await syncLocalCollectionToCloud(session);
    } catch (error) {
      console.error('Lab sync failed:', error);
    }
  };

  const nextRarity = useMemo(() => {
    return NEXT_RARITY_MAP[selectedRarity] || null;
  }, [selectedRarity]);

  const displayNextRarity = useMemo(() => {
    if (selectedRarity === 'CELESTIAL') return '???';
    return nextRarity || 'MAX TIER';
  }, [nextRarity, selectedRarity]);

  const rarityCards = useMemo(
    () => collection.filter((card) => card.rarity === selectedRarity),
    [collection, selectedRarity]
  );

  const selectedCards = useMemo(
    () => rarityCards.filter((card) => selectedIds.includes(card._labId)),
    [rarityCards, selectedIds]
  );

  const rarityCounts = useMemo(() => {
    return RARITIES.reduce((acc, rarity) => {
      acc[rarity] = collection.filter((card) => card.rarity === rarity).length;
      return acc;
    }, {});
  }, [collection]);

  const canTransform = selectedCards.length === 5 && !!nextRarity;

  const toggleCard = (labId) => {
    setMessage('');
    setResult(null);
    setFusionState(null);

    setSelectedIds((prev) => {
      if (prev.includes(labId)) return prev.filter((id) => id !== labId);
      if (prev.length >= 5) return prev;
      return [...prev, labId];
    });
  };

  const handleRarityChange = (rarity) => {
    setSelectedRarity(rarity);
    setSelectedIds([]);
    setResult(null);
    setFusionState(null);
    setMessage('Pick 5 cards from one rarity, then transform them.');
  };

  const transform = async () => {
    if (!canTransform) {
      setMessage('You need exactly 5 cards from the selected rarity.');
      return;
    }

    const candidates = pool.filter((game) => game.rarity === nextRarity);
    if (candidates.length === 0) {
      setMessage(`No ${nextRarity} cards available in the database yet.`);
      return;
    }

    setFusionState('fusing');
    const selectedIdSet = new Set(selectedIds);
    const remaining = collection.filter((card) => !selectedIdSet.has(card._labId));

    if (Math.random() * 100 > FUSION_SUCCESS_RATE) {
      await persistCollection(remaining);
      setCollection(remaining);
      setResult(null);
      setFusionState('failed');
      setMessage('FUSION FAILED: The chamber destabilized and consumed all 5 cards.');
    } else {
      const reward = candidates[Math.floor(Math.random() * candidates.length)];
      const isDuplicateSecret = ['CELESTIAL', 'UNREAL'].includes(reward.rarity) && remaining.some(c => c.id === reward.id);
      
      if (isDuplicateSecret) {
        setResult({ ...reward, isRepeatedCelestial: true });
        setFusionState('failed');
        await persistCollection(remaining);
        setCollection(remaining);
        setMessage(`Fusion failed: You already own this ${reward.rarity} card.`);
      } else {
        const finalReward = { ...reward, _labId: `${reward.id}-${Date.now()}` };

        const updatedCollection = [...remaining, finalReward];
        await persistCollection(updatedCollection);
        setCollection(updatedCollection);
        setResult(reward);
        setFusionState('success');
        setMessage(`Transformed into ${reward.name} (${reward.rarity})`);
      }
    }

    setSelectedIds([]);
    setResultAnimKey((prev) => prev + 1);
  };

  const renderStackedCards = (cards, selectable = false) => (
    <div className="flex flex-wrap px-4 gap-y-12">
      {cards.map((card) => {
        const isSelected = selectedIds.includes(card._labId);
        const reachedLimit = selectable && !isSelected && selectedIds.length >= 5;

        return (
          <div
            key={card._labId}
            className={`group relative transition-all duration-300 ease-out -mr-16 last:mr-0 hover:z-50 hover:-translate-y-4 hover:scale-110 ${
              isSelected ? 'ring-2 ring-blue-400 ring-offset-2 ring-offset-slate-900 rounded-xl' : ''
            } ${reachedLimit ? 'opacity-60' : ''}`}
          >
            <div className="flex justify-center">
              <GameCard
                game={card}
                size="w-60"
                disableLink={selectable}
                disabled={reachedLimit}
                onClick={selectable ? () => toggleCard(card._labId) : undefined}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Lab</h1>
        <p className="text-slate-400">Choose 5 cards from one rarity and fuse them into a higher tier.</p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {RARITIES.map((rarity) => {
          const active = rarity === selectedRarity;
          if (rarity === 'UNREAL') return null;
          return (
            <button
              key={rarity}
              type="button"
              onClick={() => handleRarityChange(rarity)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md border transition cursor-pointer ${
                active
                  ? 'bg-white/20 border-white/30 text-white'
                  : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
              }`}
            >
              {rarity} ({rarityCounts[rarity] || 0})
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        <section className="p-4 md:p-5 bg-slate-800/40 rounded-xl border border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Collection: {selectedRarity}</h2>
            <span className="text-xs text-slate-400">Selected {selectedCards.length}/5</span>
          </div>

          {rarityCards.length === 0 ? (
            <p className="text-slate-400 text-sm">No cards in this rarity.</p>
          ) : (
            <div className="pr-1">{renderStackedCards(rarityCards, true)}</div>
          )}
        </section>

        <section className="p-4 md:p-5 bg-slate-800/40 rounded-xl border border-white/10 space-y-4">
          <h2 className="text-lg font-semibold">Fusion Queue</h2>

          {selectedCards.length === 0 ? (
            <p className="text-slate-400 text-sm">Select cards from the left panel.</p>
          ) : (
            renderStackedCards(selectedCards)
          )}

          <div className="pt-2 border-t border-white/10 space-y-2">
            <p className="text-sm text-slate-300">
              Output rarity: <span className="font-semibold text-white">{displayNextRarity}</span>
            </p>
            <p className="text-sm text-slate-300">
              Success rate: <span className="font-semibold text-emerald-300">{FUSION_SUCCESS_RATE}%</span>
            </p>
            <button
              type="button"
              onClick={transform}
              disabled={!canTransform || fusionState === 'fusing'}
              className="w-full py-2 rounded-md font-semibold bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            >
              {fusionState === 'fusing' ? 'Fusing...' : 'Transform'}
            </button>
            <p className="text-xs text-slate-400">{message}</p>
          </div>

          {(result || fusionState === 'failed') && (
            <div className={`rounded-lg border p-3 ${fusionState === 'failed' ? 'border-red-400/50 bg-red-600/10' : 'border-emerald-400/40 bg-emerald-600/10'}`}>
              <p className={`text-xs uppercase tracking-wider mb-2 ${fusionState === 'failed' ? 'text-red-300' : 'text-emerald-300'}`}>
                {fusionState === 'failed' ? 'Fusion Error' : 'Result'}
              </p>

              {fusionState === 'failed' && !result && (
                <div key={resultAnimKey} className="rounded-md border border-red-300/30 bg-red-950/40 p-4 text-center transform-card-anim">
                  <p className="text-2xl font-black uppercase tracking-wider text-red-200">FUSION FAILED</p>
                  <p className="mt-1 text-sm text-red-100/85">All 5 input cards were consumed.</p>
                </div>
              )}

              {result && (
                <div key={resultAnimKey} className="flex justify-center transform-card-anim">
                  <GameCard game={result} size="w-60" disableLink />
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}