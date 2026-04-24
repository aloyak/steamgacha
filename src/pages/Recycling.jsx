import { useEffect, useMemo, useState } from 'react';
import { loadLocalCollection, saveLocalCollectionToCloud } from '../collectionSync';
import { addMoney, syncLocalMoneyToCloud } from '../economy';
import GameCard from '../components/GameCard';

const PLACEHOLDER_PRICES = { // PLACEHOLDER!!
  COMMON: 10,
  UNCOMMON: 18,
  RARE: 23,
  EPIC: 34,
  LEGENDARY: 40,
  MYTHIC: 52,
  EXOTIC: 60,
  CELESTIAL: 300,
  UNREAL: 1000
};

const RECYCLE_RATE = 0.70;

const cardKey = (id, rarity) => `${String(id)}::${String(rarity)}`;
    
export default function Recycling({ session }) {
  const [catalogById, setCatalogById] = useState(new Map());
  const [collection, setCollection] = useState([]);
  const [selectedCounts, setSelectedCounts] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('value');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const hydrate = async () => {
      try {
        const res = await fetch('/games.json');
        const games = await res.json();
        setCatalogById(new Map(games.map((g) => [String(g.id), g])));
      } catch (error) {
        console.error('Failed to load catalog for recycling:', error);
      }
      setCollection(loadLocalCollection());
    };

    hydrate();

    const handleCollectionUpdated = () => {
      setCollection(loadLocalCollection());
    };

    window.addEventListener('steamgacha:collection-updated', handleCollectionUpdated);
    window.addEventListener('storage', handleCollectionUpdated);

    return () => {
      window.removeEventListener('steamgacha:collection-updated', handleCollectionUpdated);
      window.removeEventListener('storage', handleCollectionUpdated);
    };
  }, []);

  const duplicateRows = useMemo(() => {
    const grouped = new Map();

    for (const card of collection) {
      const key = cardKey(card.id, card.rarity);
      const existing = grouped.get(key) || { id: card.id, rarity: card.rarity, count: 0 };
      existing.count += 1;
      grouped.set(key, existing);
    }

    return [...grouped.values()]
      .filter((row) => row.count > 1)
      .map((row) => {
        const catalogCard = catalogById.get(String(row.id));
        const price = PLACEHOLDER_PRICES[row.rarity] ?? 10;
        const maxRecycle = row.count - 1;
        return {
          ...row,
          name: catalogCard?.name || `Card #${row.id}`,
          game: {
            ...(catalogCard || {}),
            id: row.id,
            rarity: row.rarity,
            name: catalogCard?.name || `Card #${row.id}`,
            developer: catalogCard?.developer || 'Unknown',
            image: catalogCard?.image || '',
            score: Number(catalogCard?.score || 0),
            reviews: Number(catalogCard?.reviews || 0),
            description: catalogCard?.description || catalogCard?.short_description || ''
          },
          price,
          maxRecycle
        };
      })
      .sort((a, b) => {
        if (sortBy === 'value') return b.price - a.price;
        if (sortBy === 'quantity') return b.maxRecycle - a.maxRecycle;
        if (sortBy === 'rarity') {
          const rarities = Object.keys(PLACEHOLDER_PRICES);
          return rarities.indexOf(b.rarity) - rarities.indexOf(a.rarity);
        }
        return a.name.localeCompare(b.name);
      });
  }, [catalogById, collection, sortBy]);

  const payout = useMemo(() => {
    return Math.floor(
      duplicateRows.reduce((total, row) => {
        const qty = Math.min(Number(selectedCounts[cardKey(row.id, row.rarity)] || 0), row.maxRecycle);
        return total + row.price * qty * RECYCLE_RATE;
      }, 0)
    );
  }, [duplicateRows, selectedCounts]);

  const selectedTotal = useMemo(() => {
    return duplicateRows.reduce((total, row) => {
      const qty = Math.min(Number(selectedCounts[cardKey(row.id, row.rarity)] || 0), row.maxRecycle);
      return total + qty;
    }, 0);
  }, [duplicateRows, selectedCounts]);

  const setQty = (row, qty) => {
    const key = cardKey(row.id, row.rarity);
    const clamped = Math.max(0, Math.min(row.maxRecycle, Number(qty) || 0));
    setSelectedCounts((prev) => ({ ...prev, [key]: clamped }));
  };

  const quickAction = (type) => {
    const next = {};
    if (type === 'all') {
      duplicateRows.forEach(r => next[cardKey(r.id, r.rarity)] = r.maxRecycle);
    } else if (type === 'common') {
      duplicateRows.forEach(r => {
        if (['COMMON', 'UNCOMMON'].includes(r.rarity)) next[cardKey(r.id, r.rarity)] = r.maxRecycle;
      });
    }
    setSelectedCounts(next);
  };

  const recycleSelected = async () => {
    if (selectedTotal === 0 || payout <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    setNotice('Liquidating cards...');

    try {
      const removalByKey = {};
      for (const row of duplicateRows) {
        const key = cardKey(row.id, row.rarity);
        const qty = Math.min(Number(selectedCounts[key] || 0), row.maxRecycle);
        if (qty > 0) removalByKey[key] = qty;
      }

      const nextCollection = [];
      for (const card of collection) {
        const key = cardKey(card.id, card.rarity);
        if ((removalByKey[key] || 0) > 0) {
          removalByKey[key] -= 1;
        } else {
          nextCollection.push(card);
        }
      }

      await saveLocalCollectionToCloud(nextCollection, session, { allowDeletions: true });
      const updatedMoney = addMoney(payout);
      if (session) await syncLocalMoneyToCloud(session, { moneySnapshot: updatedMoney });

      setCollection(nextCollection);
      setSelectedCounts({});
      setNotice(`Successfully recycled ${selectedTotal} cards for $${payout.toLocaleString()}.`);
    } catch (error) {
      setNotice('Recycling failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-12">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
            Recycle Center
          </h2>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mt-2">
            Convert duplicate cards into balance at {Math.round(RECYCLE_RATE * 100)}% market value.
          </p>
          <p className="text-slate-500 font-mono text-sm uppercase tracking-widest mt-2">
            {duplicateRows.length} duplicate{duplicateRows.length !== 1 ? 's' : ''} available
          </p>
        </div>

        <div className="flex gap-8 items-center">
          <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            Sort
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-md px-2 py-1 text-white font-black uppercase tracking-widest"
            >
              <option value="value">Value</option>
              <option value="quantity">Quantity</option>
              <option value="rarity">Rarity</option>
              <option value="name">Name</option>
            </select>
          </label>

          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <button
              onClick={() => quickAction('all')}
              className="text-slate-500 hover:text-white cursor-pointer transition-colors"
            >
              Select All
            </button>
            <button
              onClick={() => quickAction('common')}
              className="text-slate-500 hover:text-white cursor-pointer transition-colors"
            >
              Commons
            </button>
            <button
              onClick={() => setSelectedCounts({})}
              className="text-slate-500 hover:text-red-400 cursor-pointer transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      <div className="sticky top-4 z-50 mb-10">
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0E1524] border border-white/10 rounded-xl px-6 py-4">
          <div className="flex items-center gap-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">To Recycle</p>
              <p className="text-2xl font-black text-white leading-none">{selectedTotal.toLocaleString()}</p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Payout</p>
              <p className="text-2xl font-black text-emerald-400 leading-none">${payout.toLocaleString()}</p>
            </div>
            <div className="hidden sm:block">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{notice}</p>
            </div>
          </div>

          <button
            onClick={recycleSelected}
            disabled={selectedTotal === 0 || isSubmitting}
            className="px-8 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black uppercase tracking-widest text-xs rounded-lg transition-colors disabled:opacity-20 disabled:pointer-events-none cursor-pointer"
          >
            {isSubmitting ? 'Recycling...' : 'Confirm Recycle'}
          </button>
        </div>
      </div>

      {duplicateRows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
          <p className="text-slate-600 font-black uppercase tracking-[0.3em] text-xs">No duplicates in your collection</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {duplicateRows.map((row) => {
            const key = cardKey(row.id, row.rarity);
            const selected = Math.min(Number(selectedCounts[key] || 0), row.maxRecycle);
            const isFullySelected = selected === row.maxRecycle;
            const visualStackCount = Math.min(row.count - 2, 3);

            return (
              <article
                key={key}
                className={`group relative flex flex-col rounded-2xl border transition-all duration-300 ${
                  selected > 0
                    ? 'border-emerald-500/60 bg-white/5'
                    : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                }`}
              >
                <div className="relative flex items-center justify-center pt-5 pb-3 px-3">
                  <div className="relative w-40 aspect-[2/3.1] transition-transform duration-300 group-hover:-translate-y-1">
                    {visualStackCount >= 0 &&
                      Array.from({ length: visualStackCount + 1 }).map((_, i) =>
                        i !== visualStackCount ? (
                          <div
                            key={i}
                            className="absolute top-0 left-0"
                            style={{
                              transform: `translate(${(i + 1) * 6}px, ${(i + 1) * -5}px) rotate(${(i + 1) * 2.5}deg)`,
                              zIndex: 5 - i,
                              opacity: 0.35
                            }}
                          >
                            <GameCard game={row.game} size="w-40" disableLink />
                          </div>
                        ) : null
                      )}
                    <div className="relative z-10">
                      <GameCard game={row.game} size="w-40" disableLink />
                    </div>
                  </div>
                </div>

                <div className="mt-auto border-t border-white/5 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0">
                      <h2 className="text-sm font-black text-white uppercase truncate">{row.name}</h2>
                      <span className="text-[10px] font-black text-emerald-500 tracking-widest">
                        ${Math.floor(row.price * RECYCLE_RATE).toLocaleString()} / each
                      </span>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Dupes</p>
                      <p className="text-xl font-black text-white leading-none">{row.maxRecycle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center justify-between bg-white/5 rounded-lg border border-white/10 px-1 py-0.5">
                      <button
                        onClick={() => setQty(row, selected - 1)}
                        className="w-8 h-8 flex items-center justify-center font-black text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        −
                      </button>
                      <span className="text-sm font-black text-white tabular-nums">{selected}</span>
                      <button
                        onClick={() => setQty(row, selected + 1)}
                        className="w-8 h-8 flex items-center justify-center font-black text-slate-400 hover:text-white transition cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => setQty(row, isFullySelected ? 0 : row.maxRecycle)}
                      className={`h-10 px-4 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                        isFullySelected
                          ? 'bg-emerald-500 text-slate-950'
                          : 'bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      {isFullySelected ? 'Max ✓' : 'Max'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}