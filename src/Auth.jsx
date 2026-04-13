import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { STORAGE_KEYS } from './config';

export default function Auth() {
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

    if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username } }
      });

      if (!error && data.user && shouldMigrate) {
        await migrateCollection(data.user.id);
      }
      if (error) alert(error.message);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  const migrateCollection = async (userId) => {
    const localCards = JSON.parse(localStorage.getItem(STORAGE_KEYS.COLLECTION) || '[]');
    if (localCards.length === 0) return;

    const cardsToInsert = localCards.map(card => ({
      owner_id: userId,
      catalog_id: card.id,
      rarity: card.rarity
    }));

    const { error } = await supabase.from('card_instances').insert(cardsToInsert);
    if (!error) {
      // Clear local storage after successful migration to prevent duplicates
      localStorage.removeItem(STORAGE_KEYS.COLLECTION);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl">
      <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-6">
        {isSignup ? 'Create Operative' : 'System Access'}
      </h2>

      <form onSubmit={handleAuth} className="space-y-4">
        {isSignup && (
          <input
            type="text"
            placeholder="Username"
            className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        )}
        <input
          type="email"
          placeholder="Email"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full p-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500 transition-colors"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {isSignup && hasLocalData && (
          <label className="flex items-center gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg cursor-pointer hover:bg-blue-500/20 transition">
            <input
              type="checkbox"
              checked={shouldMigrate}
              onChange={(e) => setShouldMigrate(e.target.checked)}
              className="w-4 h-4 accent-blue-500"
            />
            <span className="text-xs text-blue-200">Sync local collection to cloud account</span>
          </label>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50"
        >
          {loading ? 'Processing...' : isSignup ? 'Sign Up' : 'Log In'}
        </button>
      </form>

      <button
        onClick={() => setIsSignup(!isSignup)}
        className="w-full mt-4 text-xs text-slate-500 hover:text-slate-300 transition"
      >
        {isSignup ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
      </button>
    </div>
  );
}