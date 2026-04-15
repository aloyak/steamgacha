import { useState, useEffect, useMemo } from 'react';
import GameCard from '../components/GameCard';
import { RARITY_RANKS, RARITIES } from '../config';
import { loadLocalCollection } from '../collectionSync';

const categoryRank = RARITY_RANKS;
const categories = [...RARITIES].reverse();

export default function Collection() {
  const [items, setItems] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [order, setOrder] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(200);
  const [loading, setLoading] = useState(true);

  const sortedItems = [...items]
    .map((item, index) => ({ ...item, _originalIndex: index }))
    .sort((a, b) => {
      if (order === 'oldest') return a._originalIndex - b._originalIndex;
      if (order === 'name') return (a.name || '').localeCompare(b.name || '');
      if (order === 'category') {
        const leftRank = categoryRank[a.rarity] || 0;
        const rightRank = categoryRank[b.rarity] || 0;
        if (leftRank !== rightRank) return rightRank - leftRank;
        return (a.name || '').localeCompare(b.name || '');
      }
      return b._originalIndex - a._originalIndex;
    });

  const filteredItems = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return !query ? sortedItems : sortedItems.filter((item) => (item.name || '').toLowerCase().includes(query));
  }, [sortedItems, searchQuery]);

  const tierOrderedItems = useMemo(() => {
    if (viewMode !== 'tiers') return filteredItems;
    const grouped = categories.reduce((acc, cat) => ({ ...acc, [cat]: [] }), {});
    for (const item of filteredItems) {
      if (grouped[item.rarity]) grouped[item.rarity].push(item);
    }
    return categories.flatMap((cat) => grouped[cat]);
  }, [filteredItems, viewMode]);

  const displayItems = viewMode === 'tiers' ? tierOrderedItems : filteredItems;
  const visibleItems = displayItems.slice(0, visibleCount);
  const hasMore = visibleCount < displayItems.length;

  useEffect(() => { setVisibleCount(200); }, [order, viewMode, searchQuery]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const res = await fetch('/games.json');
        const games = await res.json();
        setCatalog(games);
        const byId = new Map(games.map((g) => [String(g.id), g]));

        const localData = loadLocalCollection();
        const hydratedLocal = localData.map((lc) => ({
          ...byId.get(String(lc.id)),
          ...lc
        }));
        setItems(hydratedLocal);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const discoveredCount = useMemo(() => new Set(items.map((i) => i.id)).size, [items]);
  const categoryTotals = useMemo(() => {
    return categories.reduce((acc, cat) => {
      acc[cat] = catalog.filter((c) => c.rarity === cat).length;
      return acc;
    }, {});
  }, [catalog]);

  const categoryDiscovered = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const ids = items.filter((i) => i.rarity === cat).map((i) => i.id);
      acc[cat] = new Set(ids).size;
      return acc;
    }, {});
  }, [items]);

  const renderGrid = (games, isStacked = false) => (
    <div className={`flex flex-wrap px-4 ${isStacked ? 'gap-y-12' : 'gap-10'}`}>
      {games.map((game, idx) => (
        <div key={`${game.id}-${idx}`} className={`group relative transition-all duration-300 ${isStacked ? '-mr-16 last:mr-0 hover:z-50 hover:-translate-y-4 hover:scale-110' : 'hover:scale-105'}`}>
          <GameCard game={game} size="w-60" />
        </div>
      ))}
    </div>
  );

  if (loading) return <div className="p-32 text-center text-slate-500 animate-pulse uppercase font-black tracking-widest">Loading Library...</div>;

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            Collection
          </h2>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 font-mono text-sm uppercase tracking-widest">
              {discoveredCount} / {catalog.length - 1} Discovered
            </p>
            <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
              <button onClick={() => setViewMode('grid')} className={`cursor-pointer p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg></button>
              <button onClick={() => setViewMode('tiers')} className={`cursor-pointer p-1.5 rounded-md ${viewMode === 'tiers' ? 'bg-white/20 text-white' : 'text-slate-500'}`}><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="21" y1="6" x2="3" y2="6"></line><line x1="21" y1="12" x2="3" y2="12"></line><line x1="21" y1="18" x2="3" y2="18"></line></svg></button>
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-[220px] max-w-md">
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search..." className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-white/30" />
        </div>

        <div className="flex gap-8 items-center">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Order
            <select value={order} onChange={(e) => setOrder(e.target.value)} className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white font-black uppercase tracking-widest">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="category">Category</option>
              <option value="name">Name</option>
            </select>
          </label>
          <button onClick={() => window.location.reload()} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest cursor-pointer">Refresh Library</button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs">No cards collected yet</p>
        </div>
      ) : viewMode === 'grid' ? (
        <>{renderGrid(visibleItems, false)}{hasMore && <button onClick={() => setVisibleCount(c => c + 200)} className="mt-12 mx-auto block px-8 py-3 bg-white/5 text-white text-xs font-black uppercase rounded-xl border border-white/10">Load More</button>}</>
      ) : (
        <div className="space-y-16">
          {categories.map((cat) => {
            const catItems = visibleItems.filter(i => i.rarity === cat);
            if (catItems.length === 0) return null;
            return (
              <div key={cat} className="space-y-6">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-black text-white italic uppercase tracking-widest">{cat}</h3>
                  <div className="h-[1px] flex-grow bg-white/10"></div>
                  <span className="text-[10px] font-mono text-slate-500">{categoryDiscovered[cat]} / {categoryTotals[cat]}</span>
                </div>
                {renderGrid(catItems, true)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}