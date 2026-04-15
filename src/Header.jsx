import { FaGithub, FaSignOutAlt } from 'react-icons/fa';
import { useMemo, useState } from 'react';
import { supabase } from './supabaseClient';
import CursorPopup from './components/Popup';
import { syncLocalCollectionToCloud } from './collectionSync';
import { STORAGE_KEYS } from './config';

const pages = [
  { id: 'packs', label: 'Packs' },
  { id: 'collection', label: 'Collection' },
  { id: 'lab', label: 'Lab' },
  { id: 'market', label: 'Market' }
];

export default function Header({ page, onPageChange, session, money = 0, collection = [] }) {
  const [arcanaHover, setArcanaHover] = useState({ open: false, x: 0, y: 0 });
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const username = session?.user?.user_metadata?.username || 'Guest';

  const handleLogout = async () => {
    setIsLoggingOut(true);
    let syncSucceeded = true;
    
    try {
      if (session) {
        await syncLocalCollectionToCloud(session);
      }
    } catch (err) {
      console.error("Final sync during logout failed:", err);
      syncSucceeded = false;
    } finally {
      await supabase.auth.signOut();

      if (syncSucceeded) {
        localStorage.removeItem(STORAGE_KEYS.PACKS_REMAINING);
        localStorage.removeItem(STORAGE_KEYS.PACKS_RESET);
        localStorage.removeItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION);
        localStorage.removeItem('steam_money');
      }

      setIsLoggingOut(false);
      onPageChange('packs');
    }
  };

  const canAccessArcana = useMemo(() => {
    const uniqueIds = new Set(collection.map((c) => c.id || c.catalog_id)).size;
    const hasMythic = collection.some((c) => c.rarity === 'MYTHIC');
    return uniqueIds >= 150 && hasMythic;
  }, [collection]);

  return (
    <header className="border-b border-white/10 bg-[#050814] px-4 py-4">
      <div className="relative flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/aloyak/steamgacha"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            <FaGithub className="h-5 w-5" />
          </a>
          <div className="rounded-md border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5">
            <p className="text-[10px] uppercase tracking-widest text-emerald-300/80">Balance</p>
            <p className="text-sm font-bold text-emerald-200">${money.toLocaleString()}</p>
          </div>
        </div>

        <nav className="absolute left-1/2 -translate-x-1/2 flex gap-2">
          {pages.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition cursor-pointer ${
                page === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          
          <div
            className="relative"
            onMouseEnter={(e) => setArcanaHover({ open: !canAccessArcana, x: e.clientX, y: e.clientY })}
            onMouseMove={(e) => setArcanaHover(prev => ({ ...prev, x: e.clientX, y: e.clientY }))}
            onMouseLeave={() => setArcanaHover({ open: false, x: 0, y: 0 })}
          >
            <button
              disabled={!canAccessArcana}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                !canAccessArcana ? 'opacity-30 cursor-not-allowed' : 'text-slate-400 hover:text-white'
              }`}
            >
              Arcana
            </button>
            <CursorPopup open={arcanaHover.open} x={arcanaHover.x} y={arcanaHover.y}>
              <div className="max-w-[180px] p-1">
                <p className="font-bold text-white text-xs uppercase tracking-tighter">Locked</p>
                <p className="mt-1 text-[10px] text-slate-400">Need 150 unique cards & 1 Mythic.</p>
              </div>
            </CursorPopup>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <div className="flex items-center gap-3 pl-3 pr-1 py-1 bg-white/5 border border-white/10 rounded-lg">
              <div className="text-right">
                <p className="text-[10px] uppercase text-slate-500 font-bold leading-none">Account</p>
                <p className="text-xs font-bold text-white">{username}</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="p-2 text-slate-500 hover:text-rose-400 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isLoggingOut ? (
                  <div className="w-4 h-4 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FaSignOutAlt />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={() => onPageChange('auth')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition-all cursor-pointer shadow-lg shadow-blue-900/20"
            >
              Log In - Sign Up
            </button>
          )}
        </div>
      </div>
    </header>
  );
}