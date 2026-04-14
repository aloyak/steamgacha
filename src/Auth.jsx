import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { STORAGE_KEYS } from './config';

export default function Auth({ onAuthSuccess }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [shouldMigrate, setShouldMigrate] = useState(true);
  const [hasLocalData, setHasLocalData] = useState(false);

  useEffect(() => {
    const localCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION) || '[]');
    setHasLocalData(localCards.length > 0);
  }, []);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = isSignup 
      ? await supabase.auth.signUp({ 
          email, 
          password, 
          options: { data: { username } } 
        })
      : await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert(error.message);
    } else {
      const user = data?.user || data?.session?.user;
      
      if (isSignup && user && shouldMigrate && hasLocalData) {
        await migrateCollection(user.id);
      }
      
      if (onAuthSuccess) onAuthSuccess();
    }
    setLoading(false);
  };

  const migrateCollection = async (userId) => {
    const localCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION) || '[]');
    if (localCards.length === 0) return;

    const cardsToInsert = localCards.map(card => ({
      owner_id: userId,
      catalog_id: String(card.id),
      rarity: card.rarity
    }));

    const { error } = await supabase.from('card_instances').insert(cardsToInsert);
    
    if (!error) {
      localStorage.removeItem(STORAGE_KEYS.COLLECTION);
    } else {
      console.error("Migration error:", error.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-[#050814] border border-white/10 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-6">
        {isSignup ? 'Sign Up' : 'Log In'}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignup && (
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {isSignup && hasLocalData && (
          <label className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={shouldMigrate}
              onChange={(e) => setShouldMigrate(e.target.checked)}
              className="accent-blue-500"
            />
            <span className="text-xs text-blue-200 uppercase font-black">Transfer local cards to cloud account</span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest rounded-lg transition-all"
        >
          {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <button
        onClick={() => setIsSignup(!isSignup)}
        className="w-full mt-4 text-[10px] uppercase font-black text-slate-500 hover:text-white transition"
      >
        {isSignup ? 'Already have an account? Log in' : "You don't have an account? Create account"}
      </button>
    </div>
  );
}