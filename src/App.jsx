import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import {
  hydrateLocalCollectionFromCloud,
  loadLocalCollection,
  syncLocalCollectionToCloud
} from './collectionSync';
import { STORAGE_KEYS } from './config';
import Header from './Header.jsx';
import PacksPage from './pages/Packs.jsx';
import CollectionPage from './pages/Collection.jsx';
import Lab from './pages/Lab.jsx';
import Market from './pages/Market.jsx';
import Recycling from './pages/Recycling.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import Arcana from './pages/Arcana.jsx';
import Auth from './Auth.jsx'; 
import {
  hasLocalMoney,
  getMoney,
  MONEY_CHANGED_EVENT,
  hydrateLocalMoneyFromCloud,
  syncLocalMoneyToCloud
} from './economy';

const AUTO_SYNC_INTERVAL_MS = 120000;

export default function App() {
  const [session, setSession] = useState(null);
  const [page, setPage] = useState('packs');
  const [isBootstrapSyncing, setIsBootstrapSyncing] = useState(false);
  const [money, setMoneyState] = useState(() => getMoney());
  const [isPackOpening, setIsPackOpening] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const refreshMoney = (event) => {
      if (typeof event?.detail === 'number') {
        setMoneyState(event.detail);
        return;
      }

      setMoneyState(getMoney());
    };

    window.addEventListener(MONEY_CHANGED_EVENT, refreshMoney);
    window.addEventListener('storage', refreshMoney);

    return () => {
      window.removeEventListener(MONEY_CHANGED_EVENT, refreshMoney);
      window.removeEventListener('storage', refreshMoney);
    };
  }, []);

  useEffect(() => {
    if (!session) {
      setIsBootstrapSyncing(false);
      return;
    }

    const hasPendingNewAccountMigration =
      localStorage.getItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION) === '1';

    let cancelled = false;

    const bootstrapSync = async () => {
      setIsBootstrapSyncing(true);

      try {
        if (hasPendingNewAccountMigration) {
          await syncLocalCollectionToCloud(session);
          if (hasLocalMoney()) {
            await syncLocalMoneyToCloud(session);
          }
          localStorage.removeItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION);
        }

        // Login should always hydrate local cache from cloud as the source of truth.
        await hydrateLocalCollectionFromCloud(session);
        await hydrateLocalMoneyFromCloud(session);
      } catch (error) {
        if (!cancelled) {
          console.error('Session bootstrap sync failed:', error);
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapSyncing(false);
        }
      }
    };

    bootstrapSync();

    const timer = setInterval(async () => {
      try {
        await syncLocalCollectionToCloud(session);
        await syncLocalMoneyToCloud(session);
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session]);

  const canAccessArcana = () => {
    const collection = loadLocalCollection();
    const hasMythic = collection.some((card) => card.rarity === 'MYTHIC');
    return collection.length >= 150 && hasMythic;
  };

  const handlePageChange = (nextPage) => {
    if (nextPage === 'arcana' && !canAccessArcana()) {
      return;
    }

    if (nextPage !== 'packs') {
      setIsPackOpening(false);
    }

    setPage(nextPage);
  };

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Header 
        page={page} 
        onPageChange={handlePageChange} 
        session={session} 
        money={money}
        hidden={page === 'packs' && isPackOpening}
      />
      <main className="container mx-auto flex flex-1 flex-col px-4 pt-6">
        {session && isBootstrapSyncing ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Collection...</p>
          </div>
        ) : (
          <>
        {page === 'packs' && <PacksPage session={session} onOpeningChange={setIsPackOpening} />}
        {page === 'collection' && <CollectionPage />}
        {page === 'lab' && <Lab session={session} />}
        {page === 'market' && <Market session={session} />}
        {page === 'recycling' && <Recycling session={session} />}
        {page === 'arcana' && <Arcana />}
        {page === 'leaderboard' && <Leaderboard />}
        {page === 'auth' && <Auth onAuthSuccess={() => setPage('packs')} />}
          </>
        )}
      </main>
    </div>
  );
}