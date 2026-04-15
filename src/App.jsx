import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import {
  hydrateLocalCollectionFromCloud,
  syncLocalCollectionToCloud
} from './collectionSync';
import { STORAGE_KEYS } from './config';
import Header from './Header.jsx';
import PacksPage from './pages/Packs.jsx';
import CollectionPage from './pages/Collection.jsx';
import Lab from './pages/Lab.jsx';
import Market from './pages/Market.jsx';
import Auth from './Auth.jsx'; 

const AUTO_SYNC_INTERVAL_MS = 120000;

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [page, setPage] = useState('packs');
  const [isBootstrapSyncing, setIsBootstrapSyncing] = useState(false);

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
    if (session) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [session]);

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
          localStorage.removeItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION);
        }

        // Login should always hydrate local cache from cloud as the source of truth.
        await hydrateLocalCollectionFromCloud(session);
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
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [session]);

  async function fetchProfile() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (!error) setProfile(data);
  }

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Header 
        page={page} 
        onPageChange={setPage} 
        session={session} 
        money={profile?.balance || 0} 
      />
      <main className="container mx-auto flex flex-1 flex-col px-4 pt-6">
        {session && isBootstrapSyncing ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400 animate-pulse">Syncing Collection...</p>
          </div>
        ) : (
          <>
        {page === 'packs' && <PacksPage session={session} />}
        {page === 'collection' && <CollectionPage />}
        {page === 'lab' && <Lab session={session} />}
        {page === 'market' && <Market session={session} />}
        {page === 'auth' && <Auth onAuthSuccess={() => setPage('packs')} />}
          </>
        )}
      </main>
    </div>
  );
}