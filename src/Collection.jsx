import { useState, useEffect } from 'react';
import GameCard from './components/GameCard';

export default function Collection() {
  const [items, setItems] = useState([]);
  const [order, setOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  const categoryRank = {
    MYTHIC: 6,
    LEGENDARY: 5,
    EPIC: 4,
    RARE: 3,
    UNCOMMON: 2,
    COMMON: 1
  };

  const categories = ['MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];

  const sortedItems = [...items]
    .map((item, index) => ({ ...item, _originalIndex: index }))
    .sort((a, b) => {
      if (order === 'oldest') {
        return a._originalIndex - b._originalIndex;
      }

      if (order === 'category') {
        const leftRank = categoryRank[a.rarity] || 0;
        const rightRank = categoryRank[b.rarity] || 0;

        if (leftRank !== rightRank) {
          return rightRank - leftRank;
        }

        return (a.name || '').localeCompare(b.name || '');
      }

      return b._originalIndex - a._originalIndex;
    });

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

  const renderGrid = (games, isStacked = false) => (
    <div className={`flex flex-wrap px-4 ${isStacked ? 'gap-y-12' : 'gap-10'}`}>
      {games.map((game) => (
        <div 
          key={game.id} 
          className={`
            group relative transition-all duration-300 ease-out 
            ${isStacked ? '-mr-16 last:mr-0 hover:z-50 hover:-translate-y-4 hover:scale-110' : 'hover:scale-105'}
          `}
        >
          <div className="flex justify-center">
            <GameCard game={game} size="w-60" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">My Collection</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
              {items.length} Cards Discovered
            </p>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button 
                onClick={() => setViewMode('tiers')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'tiers' ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex gap-8 items-center">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Order
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-[10px] text-white font-black uppercase tracking-widest focus:outline-none focus:border-white/30"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="category">Category</option>
            </select>
          </label>

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
        viewMode === 'grid' ? (
          renderGrid(sortedItems, false)
        ) : (
          <div className="space-y-16">
            {categories.map(cat => {
              const categoryItems = sortedItems.filter(item => item.rarity === cat);
              if (categoryItems.length === 0) return null;

              return (
                <div key={cat} className="space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="text-lg font-black text-white italic uppercase tracking-widest">{cat}</h3>
                    <div className="h-[1px] flex-grow bg-white/10"></div>
                    <span className="text-[10px] font-mono text-slate-500">{categoryItems.length}</span>
                  </div>
                  {renderGrid(categoryItems, true)}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}