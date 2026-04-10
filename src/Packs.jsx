import { useState, useEffect, useRef } from 'react';
import BoosterPack from './components/BoosterPack';
import GameCard from './components/GameCard';

export default function PacksPage() {
  const [pool, setPool] = useState([]);
  const [pack, setPack] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isOpening, setIsOpening] = useState(false);
  const openingTimersRef = useRef([]);

  const rollRarity = (weights) => {
    const roll = Math.random() * 100;
    let total = 0;

    for (const { rarity, chance } of weights) {
      total += chance;
      if (roll < total) {
        return rarity;
      }
    }

    return weights[weights.length - 1].rarity;
  };

  useEffect(() => {
    fetch('/games.json').then(res => res.json()).then(setPool);
  }, []);

  useEffect(() => {
    return () => {
      for (const timer of openingTimersRef.current) {
        clearTimeout(timer);
      }
    };
  }, []);

  const buildPack = () => {
    const newPack = [];

    const normalSlotWeights = [
      { rarity: 'COMMON', chance: 50 },
      { rarity: 'UNCOMMON', chance: 30 },
      { rarity: 'RARE', chance: 20 }
    ];

    const finalSlotWeights = [
      { rarity: 'EPIC', chance: 65 },
      { rarity: 'LEGENDARY', chance: 25 },
      { rarity: 'MYTHIC', chance: 10 }
    ];

    for (let i = 0; i < 5; i++) {
      const slotWeights = i === 4 ? finalSlotWeights : normalSlotWeights;
      const target = rollRarity(slotWeights);
      const options = pool.filter(g => g.rarity === target);

      if (options.length > 0) {
        newPack.push(options[Math.floor(Math.random() * options.length)]);
        continue;
      }

      const fallbackPool = pool.filter(g => slotWeights.some(({ rarity }) => rarity === g.rarity));
      const randomFallbackPool = fallbackPool.length > 0 ? fallbackPool : pool;
      newPack.push(randomFallbackPool[Math.floor(Math.random() * randomFallbackPool.length)]);
    }

    return newPack;
  };

  const generatePack = () => {
    if (isOpening || pool.length === 0) {
      return;
    }

    setIsOpening(true);

    const revealTimer = setTimeout(() => {
      const newPack = buildPack();

      setPack(newPack);
      setCurrentIdx(0);
      setIsOpening(false);

      const saved = JSON.parse(localStorage.getItem('steam_collection') || '[]');
      const filtered = newPack.filter(p => !saved.some(s => s.id === p.id));
      localStorage.setItem('steam_collection', JSON.stringify([...saved, ...filtered]));
    }, 2000);

    openingTimersRef.current.push(revealTimer);
  };

  if (currentIdx === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] relative">
        {isOpening && <div className="screen-flash-overlay" />}

        <BoosterPack
          onClick={generatePack}
          disabled={isOpening}
          packClassName={isOpening ? 'pack-animating' : ''}
        />

        <p className={`mt-12 font-black tracking-[0.5em] text-[10px] uppercase transition-opacity duration-300 ${isOpening ? 'opacity-0' : 'text-blue-400/60 animate-pulse'}`}>
          Rip to Reveal
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 py-6">
      <GameCard game={pack[currentIdx]} />

      <div className="flex items-center gap-6">
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="p-4 rounded-full bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all">←</button>
        <div className="text-white font-black text-lg">{currentIdx + 1} / 5</div>
        {currentIdx < 4 ? (
          <button onClick={() => setCurrentIdx(prev => prev + 1)} className="cursor-pointer p-4 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">→</button>
        ) : (
          <button onClick={() => { setPack([]); setCurrentIdx(-1); }} className="cursor-pointer px-10 py-3 rounded-2xl bg-white text-black font-black text-sm">FINISH</button>
        )}
      </div>
    </div>
  );
}