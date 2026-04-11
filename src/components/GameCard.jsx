import { useState, useRef } from 'react';

export default function GameCard({ game, size = 'w-80', disableLink = false, onClick, disabled = false }) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const isCelestial = game.rarity === 'CELESTIAL';
  const isUnreal = game.rarity === 'UNREAL';
  const isSecretRarity = isCelestial || isUnreal;

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
    },
    UNREAL: {
      wrapper: 'bg-white text-slate-900 shadow-[0_0_50px_rgba(255,255,255,0.9),0_0_100px_rgba(56,189,248,0.4)] border-white border-[3px]',
      header: 'bg-white/90 border-slate-200 backdrop-blur-md',
      title: 'text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-sky-600 to-slate-800 drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] tracking-[0.2em] font-black',
      imageContainer: 'border-2 border-slate-100 shadow-[0_10px_30px_rgba(0,0,0,0.1)] bg-white',
      statsBorder: 'border-t border-slate-100 pt-4'
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
        opacity: glare.opacity === 0 ? 0.3 : glare.opacity,
        mixBlendMode: 'color-dodge',
        transition: 'opacity 0.4s ease'
      };
    }
    if (game.rarity === 'UNREAL') {
      return {
        background: `
          radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,1) 0%, rgba(186,230,253,0.5) 35%, transparent 70%),
          linear-gradient(${glare.x * 2}deg, transparent 10%, rgba(255,255,255,0.9) 25%, transparent 40%),
          conic-gradient(from ${glare.y}deg at ${glare.x}% ${glare.y}%, rgba(255,0,255,0.15), rgba(0,255,255,0.15), rgba(255,255,0,0.15), rgba(255,0,255,0.15))
        `,
        opacity: glare.opacity === 0 ? 0.45 : glare.opacity,
        mixBlendMode: 'overlay',
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

  const card = (
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
        {game.isRepeatedCelestial && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] overflow-hidden rounded-xl">
            <div className="absolute w-[160%] h-4 bg-red-400 rotate-60 shadow-[0_0_25px_rgba(220,38,38,1)]" />
            <div className="absolute w-[160%] h-4 bg-red-400 -rotate-60 shadow-[0_0_25px_rgba(220,38,38,1)]" />
            
            <span className="relative z-10 text-4xl font-black uppercase italic tracking-tighter text-white drop-shadow-[0_8px_12px_rgba(0,0,0,0.9)]">
              Repeated!
            </span>
          </div>
        )}

        {isSecretRarity && (
          <>
            <div className={`absolute inset-0 z-[1] ${isUnreal ? 'bg-gradient-to-br from-white via-slate-50 to-sky-50' : 'bg-gradient-to-br from-[#050515] via-purple-950 to-[#0a001a]'}`} />

            <div className={`absolute inset-0 z-[2] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-60 pointer-events-none ${isUnreal ? 'mix-blend-multiply' : 'mix-blend-screen'}`} />
           
            <div className={`absolute -top-12 -left-12 w-48 h-48 blur-[50px] rounded-full mix-blend-screen animate-pulse pointer-events-none ${isUnreal ? 'bg-sky-400/20' : 'bg-cyan-500/40'}`} />
            <div className={`absolute -bottom-12 -right-12 w-48 h-48 blur-[50px] rounded-full mix-blend-screen animate-pulse delay-700 pointer-events-none ${isUnreal ? 'bg-indigo-400/20' : 'bg-fuchsia-500/40'}`} />
           
            <div 
              className="absolute inset-0 z-[30] pointer-events-none rounded-xl border-[2px] border-transparent" 
              style={{ 
                background: isUnreal 
                  ? 'linear-gradient(135deg, #e2e8f0, #bae6fd, #ffffff) border-box'
                  : 'linear-gradient(135deg, #22d3ee, #d946ef, #fbbf24) border-box', 
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
          <span className={`text-[10px] ${isSecretRarity ? (isUnreal ? 'text-sky-500 drop-shadow-[0_0_5px_rgba(56,189,248,0.5)]' : 'text-fuchsia-300 drop-shadow-[0_0_5px_rgba(217,70,239,1)]') : ''}`}>
            {isSecretRarity ? '✦' : '◈'}
          </span>
          <span className="text-xs font-black tracking-[0.2em] uppercase">
            {game.rarity}
          </span>
        </div>

        <div className="p-3 relative z-10">
          <div className={`relative w-full aspect-video rounded-lg overflow-hidden border shadow-inner bg-black ${currentTheme.imageContainer}`}>
            {isSecretRarity && (
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
              <p className={`font-mono text-base font-bold px-2 py-0.5 rounded ${isUnreal ? 'bg-slate-100' : 'bg-black/20'}`}>{game.score}%</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[9px] opacity-60 uppercase font-black tracking-wider mb-1">Cost</p>
              <p className={`font-mono text-base font-bold px-2 py-0.5 rounded ${isUnreal ? 'bg-slate-100' : 'bg-black/20'}`}>{formattedPrice}</p>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-[9px] opacity-60 uppercase font-black tracking-wider mb-1">Pop</p>
              <p className={`font-mono text-base font-bold px-2 py-0.5 rounded ${isUnreal ? 'bg-slate-100' : 'bg-black/20'}`}>
                {game.reviews >= 1000 ? (game.reviews / 1000).toFixed(1) + 'k' : game.reviews}
              </p>
            </div>
          </div>
        </div>
    </div>
  );

  if (disableLink) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        style={{ perspective: '1200px', display: 'block' }}
        className="group text-left disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {card}
      </button>
    );
  }

  return (
    <a href={`https://store.steampowered.com/app/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ perspective: '1200px', display: 'block' }} className="group">
      {card}
    </a>
  );
}