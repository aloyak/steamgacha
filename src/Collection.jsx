import { useState, useEffect } from 'react';
import GameCard from './components/GameCard';

export default function Collection() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('steam_collection') || '[]');
    setItems(saved);
  }, []);

  const deleteCollection = () => {
    if (window.confirm("Are you sure you want to delete your entire collection? This cannot be undone.")) {
      localStorage.removeItem('steam_collection');
      setItems([]);
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">My Collection</h2>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mt-2">
            {items.length} Cards Discovered
          </p>
        </div>
        
        <div className="flex gap-8">
          <button 
            onClick={deleteCollection}
            className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Clear Collection
          </button>
          
          <button 
            onClick={() => window.location.reload()} 
            className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors cursor-pointer"
          >
            Refresh Library
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs">No cards collected yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-10">
          {items.map((game) => (
            <div key={game.id} className="flex justify-center">
              <GameCard game={game} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}