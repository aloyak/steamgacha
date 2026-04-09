import { useState } from 'react';

const MOCK_GAMES = [
  { id: 1, name: "Counter-Strike 2", rarity: "Legendary", color: "text-amber-400", bg: "border-amber-400/50", img: "🎮" },
  { id: 2, name: "Portal 2", rarity: "Rare", color: "text-purple-400", bg: "border-purple-400/50", img: "🌀" },
  { id: 3, name: "Stardew Valley", rarity: "Rare", color: "text-purple-400", bg: "border-purple-400/50", img: "👨‍🌾" },
  { id: 4, name: "Half-Life Alyx", rarity: "Legendary", color: "text-amber-400", bg: "border-amber-400/50", img: "🧤" },
  { id: 5, name: "Bad Rats", rarity: "Common", color: "text-slate-400", bg: "border-white/10", img: "🐀" },
  { id: 6, name: "Garry's Mod", rarity: "Common", color: "text-slate-400", bg: "border-white/10", img: "🔧" },
  { id: 7, name: "Desktop Goose", rarity: "Common", color: "text-slate-400", bg: "border-white/10", img: "🪿" }
];

export default function PacksPage() {
  const [isOpening, setIsOpening] = useState(false);
  const [currentPack, setCurrentPack] = useState([]);
  const [revealIndex, setRevealIndex] = useState(0);

  const generatePack = () => {
    setIsOpening(true);
    setCurrentPack([]);
    setRevealIndex(0);

    setTimeout(() => {
      const newPack = [];
      
      for (let i = 0; i < 4; i++) {
        const commons = MOCK_GAMES.filter(g => g.rarity === 'Common');
        newPack.push(commons[Math.floor(Math.random() * commons.length)]);
      }

      const rareRoll = Math.random();
      if (rareRoll > 0.90) {
        const legendaries = MOCK_GAMES.filter(g => g.rarity === 'Legendary');
        newPack.push(legendaries[Math.floor(Math.random() * legendaries.length)]);
      } else {
        const rares = MOCK_GAMES.filter(g => g.rarity === 'Rare');
        newPack.push(rares[Math.floor(Math.random() * rares.length)]);
      }

      setCurrentPack(newPack);
      setIsOpening(false);
    }, 1000);
  };

  const nextCard = () => {
    if (revealIndex < currentPack.length - 1) {
      setRevealIndex(prev => prev + 1);
    } else {
      setCurrentPack([]);
    }
  };

  const activeCard = currentPack[revealIndex];

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
      {currentPack.length === 0 && !isOpening && (
        <button onClick={generatePack} className="group relative">
          <div className="absolute -inset-1 rounded-xl bg-gradient-to-t from-blue-600 to-cyan-400 opacity-20 blur group-hover:opacity-100 transition" />
          <div className="relative flex h-72 w-48 flex-col items-center justify-center rounded-xl border border-white/20 bg-slate-900 shadow-2xl">
            <div className="text-5xl mb-4 group-hover:scale-110 transition">📦</div>
            <h3 className="font-bold tracking-tight">STEAM BOOSTER</h3>
            <p className="text-[10px] text-slate-500 mt-1">5 STEAM GAMES</p>
          </div>
        </button>
      )}

      {isOpening && (
        <div className="flex flex-col items-center gap-4 animate-bounce">
          <div className="h-72 w-48 rounded-xl bg-white/5 border border-white/10" />
          <p className="text-cyan-400 font-mono text-sm tracking-widest">UNPACKING...</p>
        </div>
      )}

      {currentPack.length > 0 && (
        <div className="flex flex-col items-center gap-8">
          <div className="flex gap-2 mb-4">
            {currentPack.map((_, i) => (
              <div key={i} className={`h-1.5 w-8 rounded-full transition-colors ${i <= revealIndex ? 'bg-cyan-500' : 'bg-white/10'}`} />
            ))}
          </div>

          <div 
            onClick={nextCard}
            className={`relative flex h-96 w-64 cursor-pointer flex-col items-center justify-between rounded-2xl border-2 bg-slate-900 p-6 shadow-2xl transition-all hover:scale-[1.02] ${activeCard.bg}`}
          >
            <div className={`text-xs font-black uppercase tracking-[0.2em] ${activeCard.color}`}>
              {activeCard.rarity}
            </div>
            
            <div className="text-7xl">{activeCard.img}</div>

            <div className="w-full text-center">
              <h3 className="text-xl font-bold mb-1">{activeCard.name}</h3>
              <p className="text-[10px] text-slate-500">CLICK TO REVEAL NEXT</p>
            </div>
          </div>
          
          <p className="text-slate-400 text-sm">Card {revealIndex + 1} of {currentPack.length}</p>
        </div>
      )}
    </div>
  );
}