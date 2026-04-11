import { FaGithub } from 'react-icons/fa';

const pages = [
  { id: 'packs', label: 'Packs' },
  { id: 'collection', label: 'Collection' },
  { id: 'lab', label: 'Lab' },
  { id: 'market', label: 'Market' }
];

export default function Header({ page, onPageChange }) {
  return (
    <header className="border-b border-white/10 bg-[#050814] px-4 py-4">
      <div className="flex items-center justify-between gap-4">
        <div className="w-28 text-xs font-medium text-slate-500">
          By <a href="https://aloyak.dev" className="text-blue-400 hover:text-blue-300">4loyak!</a>
        </div>

        <nav className="flex justify-center gap-4">
          {pages.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`cursor-pointer px-4 py-2 text-sm font-medium rounded-md transition ${
                page === item.id ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <a
          href="https://github.com/aloyak/steamgacha"
          aria-label="GitHub"
          className="flex h-10 w-10 items-center justify-center rounded-md border border-white/10 text-slate-400 transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          title="GitHub"
        >
          <FaGithub className="h-5 w-5" aria-hidden="true" />
        </a>
      </div>
    </header>
  );
}