import { useState, useEffect, useMemo } from 'react';
import GameCard from './components/GameCard';

export default function Collection() {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [order, setOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [visibleCount, setVisibleCount] = useState(200);

  const categoryRank = {
    UNREAL: 8,
    CELESTIAL: 7,
    MYTHIC: 6,
    LEGENDARY: 5,
    EPIC: 4,
    RARE: 3,
    UNCOMMON: 2,
    COMMON: 1
  };

  const categories = ['UNREAL', 'CELESTIAL', 'MYTHIC', 'LEGENDARY', 'EPIC', 'RARE', 'UNCOMMON', 'COMMON'];

  const sortedItems = [...items]
    .map((item, index) => ({ ...item, _originalIndex: index }))
    .sort((a, b) => {
      if (order === 'oldest') {
        return a._originalIndex - b._originalIndex;
      }

      if (order === 'name') {
        return (a.name || '').localeCompare(b.name || '');
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

  const visibleItems = sortedItems.slice(0, visibleCount);
  const hasMore = visibleCount < sortedItems.length;

  useEffect(() => {
    setVisibleCount(200);
  }, [order, viewMode]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('steam_collection') || '[]');

    fetch('/games.json')
      .then((res) => res.json())
      .then((games) => {
        setCatalog(games);

        const byId = new Map(games.map((game) => [game.id, game]));
        const hydrated = saved.map((item) => {
          const fromCatalog = byId.get(item.id);
          return fromCatalog ? { ...fromCatalog, ...item } : item;
        });

        setItems(hydrated);
        localStorage.setItem('steam_collection', JSON.stringify(hydrated));
      });
  }, []);

  const discoveredCount = useMemo(() => {
    return new Set(items.map((item) => item.id)).size;
  }, [items]);

  const totalCards = catalog.length;

  const categoryTotals = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category] = catalog.filter((card) => card.rarity === category).length;
      return acc;
    }, {});
  }, [catalog]);

  const categoryDiscovered = useMemo(() => {
    return categories.reduce((acc, category) => {
      const ids = items.filter((item) => item.rarity === category).map((item) => item.id);
      acc[category] = new Set(ids).size;
      return acc;
    }, {});
  }, [items]);

  const deleteCollection = () => {
    if (window.confirm("Are you sure you want to delete your entire collection? This cannot be undone.")) {
      localStorage.removeItem('steam_collection');
      setItems([]);
    }
  };

  const renderGrid = (games, isStacked = false) => (
    <div className={`flex flex-wrap px-4 ${isStacked ? 'gap-y-12' : 'gap-10'}`}>
      {games.map((game, idx) => (
        <div
          key={`${game.id}-${idx}`}
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

  const renderLoadMore = () => (
    hasMore && (
      <div className="flex flex-col items-center gap-2 mt-16">
        <button
          type="button"
          onClick={() => setVisibleCount((c) => c + 200)}
          className="cursor-pointer px-8 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/25 rounded-xl text-white font-black uppercase tracking-widest text-xs transition-all duration-200"
        >
          Load More
        </button>
        <p className="text-slate-600 font-mono text-[10px] uppercase tracking-widest">
          Showing {visibleCount} of {sortedItems.length}
        </p>
      </div>
    )
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter">My Collection</h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
              {discoveredCount} / {totalCards - 1} Cards Discovered
            </p>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
              </button>
              <button
                type="button"
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
              <option value="name">Name</option>
            </select>
          </label>

          <button
            type="button"
            onClick={deleteCollection}
            className="text-[10px] font-black text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors cursor-pointer"
          >
            Clear Collection
          </button>

          <button
            type="button"
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
      ) : viewMode === 'grid' ? (
        <>
          {renderGrid(visibleItems, false)}
          {renderLoadMore()}
        </>
      ) : (
        <div className="space-y-16">
          {categories.map((cat) => {
            const categoryItems = visibleItems.filter((item) => item.rarity === cat);
            if (categoryItems.length === 0) return null;

            return (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-black text-white italic uppercase tracking-widest">{cat}</h3>
                  <div className="h-[1px] flex-grow bg-white/10"></div>
                  <span className="text-[10px] font-mono text-slate-500">
                    {categoryDiscovered[cat] || 0} / {categoryTotals[cat] || 0}
                  </span>
                </div>
                {renderGrid(categoryItems, true)}
              </div>
            );
          })}
          {renderLoadMore()}
        </div>
      )}
    </div>
  );
}