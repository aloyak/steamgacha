import { useState, useRef } from 'react';

export default function GameCard({ game, size = 'w-80' }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const isCelestial = game.rarity === 'CELESTIAL';

  const rarityThemes = {
    COMMON: {
      wrapper: 'bg-slate-800 border-slate-600 text-slate-400 shadow-xl',
      header: 'bg-slate-900/50 border-slate-600',
      title: 'text-slate-200',
      imageContainer: 'border-slate-600',
      statsBorder: 'border-t border-white/5 pt-4'
    },
    UNCOMMON: {
      wrapper: 'bg-slate-800 border-blue-600/80 text-blue-400 shadow-xl shadow-blue-900/20',
      header: 'bg-blue-900/30 border-blue-500/50',
      title: 'text-blue-100',
      imageContainer: 'border-blue-500/50',
      statsBorder: 'border-t border-blue-500/20 pt-4'
    },
    RARE: {
      wrapper: 'bg-gradient-to-br from-emerald-900 to-slate-900 border-emerald-400 text-emerald-400 shadow-2xl shadow-emerald-900/40',
      header: 'bg-emerald-950/60 border-emerald-500/50',
      title: 'text-emerald-100',
      imageContainer: 'border-emerald-400/60',
      statsBorder: 'border-t border-emerald-500/20 pt-4'
    },
    EPIC: {
      wrapper: 'bg-gradient-to-br from-fuchsia-900 via-purple-900 to-slate-900 border-fuchsia-400 text-fuchsia-400 shadow-2xl shadow-fuchsia-900/50',
      header: 'bg-fuchsia-950/60 border-fuchsia-500/50',
      title: 'text-fuchsia-100',
      imageContainer: 'border-fuchsia-400/60',
      statsBorder: 'border-t border-fuchsia-500/20 pt-4'
    },
    LEGENDARY: {
      wrapper: 'bg-gradient-to-b from-amber-500 via-yellow-700 to-yellow-950 border-amber-300 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      header: 'bg-black/40 border-amber-400/50',
      title: 'text-amber-50',
      imageContainer: 'border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      statsBorder: 'border-t border-amber-500/30 pt-4'
    },
    MYTHIC: {
      wrapper: 'bg-gradient-to-br from-red-600 via-rose-900 to-black border-red-500 text-red-400 shadow-[0_0_30px_rgba(225,29,72,0.7)]',
      header: 'bg-black/50 border-red-500/50',
      title: 'text-red-50',
      imageContainer: 'border-red-500 shadow-[0_0_15px_rgba(225,29,72,0.5)]',
      statsBorder: 'border-t border-red-500/30 pt-4'
    },
    CELESTIAL: {
      wrapper: 'text-white shadow-[0_0_80px_rgba(217,70,239,0.5)] border-transparent',
      header: 'bg-black/30 border-white/20 backdrop-blur-sm',
      title: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] tracking-widest',
      imageContainer: 'border border-white/40 shadow-[0_0_30px_rgba(217,70,239,0.4)] bg-black',
      statsBorder: 'border-t border-white/20 pt-4'
    }
  };

  const currentTheme = rarityThemes[game.rarity] || rarityThemes.COMMON;

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const rotateX = ((y - (rect.height / 2)) / (rect.height / 2)) * -12;
    const rotateY = ((x - (rect.width / 2)) / (rect.width / 2)) * 12;
    
    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY });
    setGlare({ x: px, y: py, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  const getHoloStyle = () => {
    if (game.rarity === 'CELESTIAL') {
      return {
        background: `
          radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.8) 0%, transparent 50%),
          conic-gradient(from ${glare.x * 3}deg at ${glare.x}% ${glare.y}%, rgba(34,211,238,0.5), rgba(217,70,239,0.5), rgba(251,191,36,0.5), rgba(34,211,238,0.5))
        `,
        opacity: glare.opacity === 0 ? 0.3 : glare.opacity, // Maintains an ambient 30% prismatic glow when idle
        mixBlendMode: 'color-dodge',
        transition: 'opacity 0.4s ease'
      };
    }
    if (game.rarity === 'MYTHIC') {
      return {
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,100,100,0.6) 0%, transparent 60%), linear-gradient(${glare.x}deg, transparent 20%, rgba(255,150,150,0.4) 40%, transparent 60%)`,
        opacity: glare.opacity,
        mixBlendMode: 'color-dodge',
        transition: 'opacity 0.4s ease'
      };
    }
    if (game.rarity === 'LEGENDARY') {
      return {
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,215,0,0.7) 0%, transparent 50%), linear-gradient(${110 + glare.x * 0.5}deg, transparent 20%, rgba(255,255,255,0.6) 25%, transparent 30%, transparent 40%, rgba(255,255,255,0.6) 45%, transparent 50%)`,
        opacity: glare.opacity,
        mixBlendMode: 'color-dodge',
        transition: 'opacity 0.4s ease'
      };
    }
    if (game.rarity === 'EPIC') {
      return {
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(217,70,239,0.5) 0%, transparent 60%)`,
        opacity: glare.opacity,
        mixBlendMode: 'screen',
        transition: 'opacity 0.4s ease'
      };
    }
    if (game.rarity === 'RARE') {
       return {
        background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(52,211,153,0.4) 0%, transparent 50%)`,
        opacity: glare.opacity,
        mixBlendMode: 'screen',
        transition: 'opacity 0.4s ease'
      };
    }
    return { opacity: 0, transition: 'opacity 0.4s ease' };
  };

  const formattedPrice = typeof game.price === 'number'
    ? (game.price === 0 ? 'Free' : `$${game.price.toFixed(2)}`)
    : (game.isFree ? 'Free' : 'N/A');

  const developer = game.developer || 'Unknown';

  return (
    <a href={`https://store.steampowered.com/app/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ perspective: '1200px', display: 'block' }} className="group">
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 ? 'transform 0.5s ease' : 'none'
        }}
        className={`${size} aspect-[2/3.1] rounded-xl border-2 relative overflow-hidden flex flex-col transform-gpu cursor-pointer ${currentTheme.wrapper}`}
      >
        {isCelestial && (
          <>
            <div className="absolute inset-0 z-[1] bg-gradient-to-br from-[#050515] via-purple-950 to-[#0a001a]" />
            
            <div className="absolute inset-0 z-[2] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 mix-blend-screen pointer-events-none" />
            
            <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyan-500/40 blur-[50px] rounded-full mix-blend-screen animate-pulse pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-fuchsia-500/40 blur-[50px] rounded-full mix-blend-screen animate-pulse delay-700 pointer-events-none" />
            
            <div 
              className="absolute inset-0 z-[30] pointer-events-none rounded-xl border-[2px] border-transparent" 
              style={{ 
                background: 'linear-gradient(135deg, #22d3ee, #d946ef, #fbbf24) border-box', 
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', 
                WebkitMaskComposite: 'xor', 
                maskComposite: 'exclude' 
              }} 
            />
          </>
        )}

        <div 
          className="absolute inset-0 z-20 pointer-events-none"
          style={getHoloStyle()}
        />

        <div className={`px-4 py-3 flex items-center gap-2 border-b relative z-10 ${currentTheme.header}`}>
          <span className={`text-[10px] ${isCelestial ? 'text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,1)]' : ''}`}>
            {isCelestial ? '✦' : '◈'}
          </span>
          <span className="text-xs font-black tracking-[0.2em] uppercase">
            {game.rarity}
          </span>
        </div>

        <div className="p-3 relative z-10">
          <div className={`relative w-full aspect-video rounded-lg overflow-hidden border shadow-inner bg-black ${currentTheme.imageContainer}`}>
            {isCelestial && (
              <div className="absolute inset-0 z-20 pointer-events-none shadow-[inset_0_0_20px_rgba(255,255,255,0.3)] mix-blend-overlay rounded-lg" />
            )}
            <img 
              src={game.image} 
              className="w-full h-full object-cover pointer-events-none" 
              alt={game.name} 
            />
          </div>
        </div>

        <div className="px-5 pb-6 flex-1 flex flex-col justify-between pointer-events-none relative z-10">
          <div className="mt-2">
            <h3 className={`text-2xl font-bold leading-tight mb-4 italic ${currentTheme.title}`}>
              {game.name}
            </h3>
            <p className="text-xs uppercase tracking-[0.14em] opacity-70 font-semibold">
              {developer}
            </p>
          </div>
          
          <div className={`flex justify-between items-end ${currentTheme.statsBorder}`}>
            <div className="flex flex-col items-center">
              <p className="text-[9px] opacity-60 uppercase font-black tracking-wider mb-1">Rtg</p>
              <p className="font-mono text-base font-bold bg-black/20 px-2 py-0.5 rounded">{game.score}%</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[9px] opacity-60 uppercase font-black tracking-wider mb-1">Cost</p>
              <p className="font-mono text-base font-bold bg-black/20 px-2 py-0.5 rounded">{formattedPrice}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[9px] opacity-60 uppercase font-black tracking-wider mb-1">Pop</p>
              <p className="font-mono text-base font-bold bg-black/20 px-2 py-0.5 rounded">
                {game.reviews >= 1000 ? (game.reviews / 1000).toFixed(1) + 'k' : game.reviews}
              </p>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}