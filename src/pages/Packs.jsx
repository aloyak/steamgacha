import { useState, useEffect, useRef } from 'react';
import BoosterPack, { PACK_TYPES } from '../components/BoosterPack';
import GameCard from '../components/GameCard';
import { PACK_CONFIG, STORAGE_KEYS } from '../config';

const MAX_PACKS = PACK_CONFIG.MAX_PACKS;
const COOLDOWN_MS = PACK_CONFIG.COOLDOWN_MS;

export default function PacksPage() {
  const [pool, setPool] = useState([]);
  const [pack, setPack] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isOpening, setIsOpening] = useState(false);
  const [openingType, setOpeningType] = useState(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const openingTimersRef = useRef([]);

  const [packsLeft, setPacksLeft] = useState(MAX_PACKS);
  const [nextReset, setNextReset] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    fetch('/games.json').then(res => res.json()).then(setPool);

    const savedPacks = localStorage.getItem(STORAGE_KEYS.PACKS_REMAINING);
    const savedReset = localStorage.getItem(STORAGE_KEYS.PACKS_RESET);
    
    if (savedReset && Date.now() < parseInt(savedReset)) {
      setNextReset(parseInt(savedReset));
      setPacksLeft(parseInt(savedPacks) ?? MAX_PACKS);
    } else {
      resetPacks();
    }
  }, []);

  useEffect(() => {
    if (!nextReset) return;

    const timer = setInterval(() => {
      const remaining = nextReset - Date.now();
      if (remaining <= 0) {
        resetPacks();
      } else {
        const mins = Math.floor(remaining / 60000);
        const secs = Math.floor((remaining % 60000) / 1000);
        setTimeLeft(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [nextReset]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        
        if (currentIdx === -1) {
          generatePack();
        } else if (currentIdx >= 0 && currentIdx < 4) {
          setCurrentIdx(prev => prev + 1);
        } else if (currentIdx === 4) {
          handleFinish();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIdx, isOpening, packsLeft, pool]);

  const resetPacks = () => {
    const newReset = Date.now() + COOLDOWN_MS;
    setPacksLeft(MAX_PACKS);
    setNextReset(newReset);
    localStorage.setItem(STORAGE_KEYS.PACKS_REMAINING, MAX_PACKS);
    localStorage.setItem(STORAGE_KEYS.PACKS_RESET, newReset);
  };

  const rollRarity = (weights) => {
    const totalWeight = weights.reduce((sum, entry) => sum + entry.weight, 0);
    const roll = Math.random() * totalWeight;
    let total = 0;

    for (const { rarity, weight } of weights) {
      total += weight;
      if (roll < total) {
        return rarity;
      }
    }

    return weights[weights.length - 1].rarity;
  };

  const buildPack = (type) => {
    const newPack = [];
    const weights = type === 'special' ? PACK_TYPES.SPECIAL.weights : PACK_TYPES.STANDARD.weights;

    for (let i = 0; i < 5; i++) {
      const target = rollRarity(weights);
      const options = pool.filter(g => g.rarity === target);
      
      if (options.length > 0) {
        newPack.push(options[Math.floor(Math.random() * options.length)]);
      } else {
        newPack.push(pool[Math.floor(Math.random() * pool.length)]);
      }
    }

    const rarityOrder = { COMMON: 0, UNCOMMON: 1, RARE: 2, EPIC: 3, LEGENDARY: 4, MYTHIC: 5, CELESTIAL: 6, UNREAL: 7 };
    return newPack.sort((a, b) => (rarityOrder[a.rarity] ?? 0) - (rarityOrder[b.rarity] ?? 0));
  };

  const generatePack = () => {
    if (isOpening || pool.length === 0 || packsLeft <= 0) return;

    const currentPackType = packsLeft === 1 ? 'special' : 'standard';
    const newPacksLeft = packsLeft - 1;
    
    setOpeningType(currentPackType);
    setPacksLeft(newPacksLeft);
    localStorage.setItem(STORAGE_KEYS.PACKS_REMAINING, newPacksLeft);

    setIsOpening(true);

    const revealTimer = setTimeout(() => {
      const newPack = buildPack(currentPackType);
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION) || '[]');

      const processedPack = newPack.map(card => {
        const isDuplicateSecret = ['CELESTIAL', 'UNREAL'].includes(card.rarity) && saved.some(s => s.id === card.id);
        if (isDuplicateSecret) {
          return { ...card, isRepeatedCelestial: true };
        }
        return card;
      });

      const cardsToSave = processedPack.filter(p => !p.isRepeatedCelestial);
      localStorage.setItem(STORAGE_KEYS.COLLECTION, JSON.stringify([...saved, ...cardsToSave]));

      setPack(processedPack);
      setCurrentIdx(0);
      setIsOpening(false);
      setOpeningType(null);
    }, 2000);

    openingTimersRef.current.push(revealTimer);
  };

  const handleFinish = () => {
    setIsFinishing(true);
    setTimeout(() => {
      setPack([]);
      setCurrentIdx(-1);
      setIsFinishing(false);
    }, 1000);
  };

  if (currentIdx === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[85vh] relative pt-12">
        <div className="absolute top-4 flex gap-6 px-6 py-2 bg-white/5 backdrop-blur-md border border-white/10 rounded-full transition-opacity duration-300" 
          style={{ opacity: isOpening ? 0 : 1 }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Packs:</span>
            <span className={`text-sm font-black ${packsLeft === 1 ? 'text-fuchsia-400' : packsLeft === 0 ? 'text-red-500' : 'text-white'}`}>
              {packsLeft} / {MAX_PACKS}
            </span>
          </div>

          <div className="w-[1px] h-4 bg-white/10 self-center" />

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Refresh:</span>
            <span className="text-sm font-mono text-blue-400 font-bold">{timeLeft}</span>
          </div>

          <div className="w-[1px] h-4 bg-white/10 self-center" />

          <button 
            onClick={resetPacks}
            className="text-[10px] font-black uppercase tracking-tighter text-red-500 cursor-pointer"
          >
            Debug Reset
          </button>
        </div>
        {isOpening && <div className="screen-flash-overlay" />}

        <div className={packsLeft === 0 && !isOpening ? "grayscale opacity-50 pointer-events-none" : ""}>
          <BoosterPack
            onClick={generatePack}
            type={isOpening ? openingType : (packsLeft === 1 ? 'special' : 'standard')}
            disabled={isOpening || packsLeft === 0}
            packClassName={isOpening ? 'pack-animating' : ''}
          />
        </div>

        <p className={`mt-12 font-black tracking-[0.5em] text-[10px] uppercase transition-opacity duration-300 ${isOpening ? 'opacity-0' : 'text-blue-400/60 animate-pulse'}`}>
          {packsLeft === 1 ? "Open the Special Pack" : packsLeft > 0 ? "Rip to Reveal" : "No Packs Remaining"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-10 py-6 overflow-hidden min-h-[85vh]">
      <div className="relative w-80 aspect-[2/3.1] my-4" style={{ perspective: '1200px' }}>
        {pack.map((game, i) => {
          const isActive = i === currentIdx;
          const isPrev = i < currentIdx;
          const isNext = i > currentIdx;

          let transform = 'translate3d(0, 0, 0) scale(1) rotate(0deg)';
          let zIndex = 10;
          let opacity = 1;
          let pointerEvents = 'auto';

          if (isFinishing) {
            transform = `translate3d(0, 150vh, 0) rotate(${(i - 2) * 25}deg)`;
            opacity = 0;
            pointerEvents = 'none';
          } else if (isPrev) {
            const offset = currentIdx - i;
            transform = `translate3d(-${45 + offset * 15}%, 0, -${350 * offset}px) scale(${1 - offset * 0.1}) rotate(-${8 + offset}deg)`;
            zIndex = 10 - offset;
            opacity = offset === 1 ? 0.6 : 0; 
            pointerEvents = 'none';
          } else if (isNext) {
            const offset = i - currentIdx;
            transform = `translate3d(${45 + offset * 15}%, 0, -${350 * offset}px) scale(${1 - offset * 0.1}) rotate(${8 + offset}deg)`;
            zIndex = 10 - offset;
            opacity = offset === 1 ? 0.6 : 0;
            pointerEvents = 'none';
          }

          return (
            <div key={i} className="absolute inset-0" style={{
              transform, zIndex, opacity, pointerEvents,
              transition: isFinishing 
                ? `all 0.6s cubic-bezier(0.5, -0.5, 0.5, 1.5) ${i * 100}ms`
                : 'all 0.6s cubic-bezier(0.23, 1, 0.32, 1)',
              transformStyle: 'preserve-3d'
            }}>
              <GameCard game={game} />
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-6 mt-8 z-20 transition-opacity duration-300" style={{ opacity: isFinishing ? 0 : 1 }}>
        <button disabled={currentIdx === 0} onClick={() => setCurrentIdx(prev => prev - 1)} className="cursor-pointer p-4 rounded-full bg-white/5 text-slate-400 hover:text-white disabled:opacity-20 transition-all">←</button>
        <div className="text-white font-black text-lg">{currentIdx + 1} / 5</div>
        {currentIdx < 4 ? (
          <button onClick={() => setCurrentIdx(prev => prev + 1)} className="cursor-pointer p-4 rounded-full bg-white/5 text-slate-400 hover:text-white transition-all">→</button>
        ) : (
          <button onClick={handleFinish} className="cursor-pointer px-10 py-3 rounded-2xl bg-white text-black font-black text-sm hover:scale-105 transition-transform">FINISH</button>
        )}
      </div>
    </div>
  );
}