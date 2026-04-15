import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { syncLocalCollectionToCloud } from './collectionSync';
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
      return;
    }

    if (localStorage.getItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION) === '1') {
      syncLocalCollectionToCloud(session)
        .then(() => {
          localStorage.removeItem(STORAGE_KEYS.PENDING_NEW_ACCOUNT_MIGRATION);
        })
        .catch((error) => {
          console.error('Pending new-account migration failed:', error);
        });
    }

    const timer = setInterval(async () => {
      try {
        await syncLocalCollectionToCloud(session);
      } catch (error) {
        console.error('Auto sync failed:', error);
      }
    }, AUTO_SYNC_INTERVAL_MS);

    return () => clearInterval(timer);
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
        {page === 'packs' && <PacksPage session={session} />}
        {page === 'collection' && <CollectionPage />}
        {page === 'lab' && <Lab session={session} />}
        {page === 'market' && <Market session={session} />}
        {page === 'auth' && <Auth session={session} onAuthSuccess={() => setPage('packs')} />}
      </main>
    </div>
  );
}