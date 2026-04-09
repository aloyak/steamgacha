import { useState } from 'react';
import Header from './Header.jsx';
import PacksPage from './Packs.jsx';
import CollectionPage from './Collection.jsx';

export default function App() {
  const [page, setPage] = useState('packs');

  return (
    <div className="flex min-h-screen flex-col text-slate-100">
      <Header page={page} onPageChange={setPage} />
      <main className="flex-1 p-6">
        {page === 'packs' ? <PacksPage /> : <CollectionPage />}
      </main>
    </div>
  );
}