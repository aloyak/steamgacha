import { useState, useEffect } from 'react';

const RARITY_WEIGHTS = {
  COMMON: 70,
  RARE: 20,
  EPIC: 9,
  LEGENDARY: 1
};

export default function PacksPage() {
  const [pool, setPool] = useState([]);
  const [pack, setPack] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isRevealed, setIsRevealed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/games.json')
      .then((res) => res.json())
      .then((data) => {
        setPool(data);
        setLoading(false);
      })
      .catch((err) => console.error("Error loading pool:", err));
  }, []);

  const getWeightedRarity = () => {
    const roll = Math.random() * 100;
    let cumulative = 0;
    for (const [rarity, weight] of Object.entries(RARITY_WEIGHTS)) {
      cumulative += weight;
      if (roll <= cumulative) return rarity;
    }
    return "COMMON";
  };

  const saveToCollection = (game) => {
    const saved = JSON.parse(localStorage.getItem('steam_collection') || '[]');
    const isDuplicate = saved.some((item) => item.id === game.id);
    if (!isDuplicate) {
      localStorage.setItem('steam_collection', JSON.stringify([...saved, game]));
    }
  };

  const generatePack = () => {
    const newPack = [];
    for (let i = 0; i < 5; i++) {
      let targetRarity = getWeightedRarity();
      
      if (i === 4 && targetRarity === "COMMON") {
        targetRarity = Math.random() > 0.5 ? "RARE" : "EPIC";
      }

      const options = pool.filter((g) => g.rarity === targetRarity);
      const fallbackOptions = options.length > 0 ? options : pool;
      const selection = fallbackOptions[Math.floor(Math.random() * fallbackOptions.length)];
      
      newPack.push(selection);
    }
    setPack(newPack);
    setCurrentIdx(0);
    setIsRevealed(false);
  };

  const handleAction = () => {
    if (!isRevealed) {
      setIsRevealed(true);
      saveToCollection(pack[currentIdx]);
    } else {
      if (currentIdx < 4) {
        setCurrentIdx(currentIdx + 1);
        setIsRevealed(false);
      } else {
        setPack([]);
        setCurrentIdx(-1);
      }
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center text-slate-400">Loading Pool...</div>;

  if (currentIdx === -1) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <button 
          onClick={generatePack}
          className="group relative bg-blue-600 px-12 py-6 rounded-2xl font-black text-2xl hover:bg-blue-500 transition-all active:scale-95 shadow-2xl shadow-blue-900/40"
        >
          OPEN BOOSTER
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 group-hover:opacity-100 transition" />
        </button>
      </div>
    );
  }

  const card = pack[currentIdx];
  const rarityColors = {
    COMMON: 'text-slate-400',
    RARE: 'text-blue-400',
    EPIC: 'text-purple-400',
    LEGENDARY: 'text-amber-400'
  };

  return (
    <div className="flex flex-col items-center gap-12 py-10">
      <div className="flex gap-3">
        {pack.map((_, i) => (
          <div 
            key={i} 
            className={`h-1.5 w-12 rounded-full transition-all duration-500 ${
              i < currentIdx ? 'bg-blue-500/50' : i === currentIdx ? 'bg-blue-500' : 'bg-white/10'
            }`} 
          />
        ))}
      </div>

      <div 
        onClick={handleAction}
        className={`w-72 aspect-[2/3] rounded-[2rem] border-2 cursor-pointer transition-all duration-500 relative perspective-1000 ${
          isRevealed 
            ? (card.rarity === 'LEGENDARY' ? 'border-amber-400 shadow-amber-500/30 scale-105' : 'border-white/10') 
            : 'border-blue-500/50 bg-slate-900 hover:scale-105 shadow-xl shadow-blue-500/10'
        }`}
      >
        {isRevealed ? (
          <div className="h-full flex flex-col overflow-hidden rounded-[1.8rem] animate-in fade-in zoom-in duration-300">
            <img src={card.image} className="h-1/2 w-full object-cover" alt={card.name} />
            <div className="p-6 flex-1 flex flex-col justify-between bg-gradient-to-b from-slate-900 to-black">
              <div>
                <p className={`text-[10px] font-black tracking-[0.2em] mb-1 ${rarityColors[card.rarity]}`}>
                  {card.rarity}
                </p>
                <h3 className="text-xl font-bold text-white leading-tight">{card.name}</h3>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-4">
                <div>
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Score</p>
                  <p className="font-mono text-cyan-400 text-sm">{card.score}%</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase font-bold">Reviews</p>
                  <p className="font-mono text-slate-300 text-sm">
                    {card.reviews >= 1000 ? (card.reviews / 1000).toFixed(1) + 'k' : card.reviews}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 rounded-[1.8rem]">
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
              <span className="text-4xl">🎮</span>
            </div>
            <p className="font-black tracking-[0.3em] text-blue-200 text-xs">STEAM GACHA</p>
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="text-slate-400 font-medium text-sm animate-pulse">
          {isRevealed ? 'Click to continue' : 'Click to flip'}
        </p>
        <p className="text-[10px] text-slate-600 mt-2 uppercase tracking-widest">
          Card {currentIdx + 1} of 5
        </p>
      </div>
    </div>
  );
}