import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import Header from './Header.jsx';
import PacksPage from './pages/Packs.jsx';
import CollectionPage from './pages/Collection.jsx';
import Lab from './pages/Lab.jsx';
import Market from './pages/Market.jsx';
import Auth from './Auth.jsx'; 

export default function App() {
  const [session, setSession] = useState(null);
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

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Header page={page} onPageChange={setPage} session={session} />
      <main className="container mx-auto flex flex-1 flex-col px-4 pt-6">
        {page === 'packs' && <PacksPage session={session} />}
        {page === 'collection' && <CollectionPage session={session} />}
        {page === 'lab' && <Lab session={session} />}
        {page === 'market' && <Market session={session} />}
        {page === 'auth' && <Auth session={session} />}
      </main>
    </div>
  );
}