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
      statsBorder: 'border-t border-white/5'
    },
    UNCOMMON: {
      wrapper: 'bg-slate-800 border-blue-600/80 text-blue-400 shadow-xl shadow-blue-900/20',
      header: 'bg-blue-900/30 border-blue-500/50',
      title: 'text-blue-100',
      imageContainer: 'border-blue-500/50',
      statsBorder: 'border-t border-blue-500/20'
    },
    RARE: {
      wrapper: 'bg-gradient-to-br from-emerald-900 to-slate-900 border-emerald-400 text-emerald-400 shadow-2xl shadow-emerald-900/40',
      header: 'bg-emerald-950/60 border-emerald-500/50',
      title: 'text-emerald-100',
      imageContainer: 'border-emerald-400/60',
      statsBorder: 'border-t border-emerald-500/20'
    },
    EPIC: {
      wrapper: 'bg-gradient-to-br from-fuchsia-900 via-purple-900 to-slate-900 border-fuchsia-400 text-fuchsia-400 shadow-2xl shadow-fuchsia-900/50',
      header: 'bg-fuchsia-950/60 border-fuchsia-500/50',
      title: 'text-fuchsia-100',
      imageContainer: 'border-fuchsia-400/60',
      statsBorder: 'border-t border-fuchsia-500/20'
    },
    LEGENDARY: {
      wrapper: 'bg-gradient-to-b from-amber-500 via-yellow-700 to-yellow-950 border-amber-300 text-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.5)]',
      header: 'bg-black/40 border-amber-400/50',
      title: 'text-amber-50',
      imageContainer: 'border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      statsBorder: 'border-t border-amber-500/30'
    },
    MYTHIC: {
      wrapper: 'bg-gradient-to-br from-red-600 via-rose-900 to-black border-red-500 text-red-400 shadow-[0_0_30px_rgba(225,29,72,0.7)]',
      header: 'bg-black/50 border-red-500/50',
      title: 'text-red-50',
      imageContainer: 'border-red-500 shadow-[0_0_15px_rgba(225,29,72,0.5)]',
      statsBorder: 'border-t border-red-500/30'
    },
    CELESTIAL: {
      wrapper: 'text-white shadow-[0_0_80px_rgba(217,70,239,0.5)] border-transparent',
      header: 'bg-black/30 border-white/20 backdrop-blur-sm',
      title: 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-fuchsia-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.8)] tracking-widest',
      imageContainer: 'border border-white/40 shadow-[0_0_30px_rgba(217,70,239,0.4)] bg-black',
      statsBorder: 'border-t border-white/20'
    },
    UNREAL: {
      wrapper: 'bg-slate-50 text-slate-900 shadow-[0_0_60px_rgba(255,255,255,1),0_0_110px_rgba(56,189,248,0.5)] border-white border-[4px]',
      header: 'bg-white/40 border-blue-200/50 backdrop-blur-xl',
      title: 'text-transparent bg-clip-text bg-gradient-to-br from-slate-900 via-sky-500 to-indigo-900 drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)] tracking-[0.25em] font-[1000] uppercase',
      imageContainer: 'border-2 border-white shadow-[0_15px_35px_rgba(0,0,0,0.12)] bg-white',
      statsBorder: 'border-t border-blue-100/50'
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
          linear-gradient(${glare.x + glare.y}deg, 
            transparent 0%, 
            rgba(255, 255, 255, 0.8) 45%, 
            rgba(186, 230, 253, 0.6) 50%, 
            rgba(255, 255, 255, 0.8) 55%, 
            transparent 100%
          ),
          conic-gradient(from ${glare.x}deg at ${glare.x}% ${glare.y}%, 
            rgba(255, 0, 0, 0.1), 
            rgba(255, 255, 0, 0.1), 
            rgba(0, 255, 0, 0.1), 
            rgba(0, 255, 255, 0.1), 
            rgba(0, 0, 255, 0.1), 
            rgba(255, 0, 255, 0.1), 
            rgba(255, 0, 0, 0.1)
          )
        `,
        opacity: glare.opacity === 0 ? 0.5 : glare.opacity,
        mixBlendMode: 'color-burn',
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

  const developer = game.developer || 'Unknown';
  const powerScore = Number.isFinite(Number(game.prestigeScore))
    ? Math.round(game.prestigeScore * 1000)
    : 'N/A';

  const card = (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 ? 'transform 0.5s ease' : 'none',
        containerType: 'size'
      }}
      className={`${size} aspect-[2/3.1] rounded-[min(4cqw,12px)] border-[min(1cqw,2px)] relative overflow-hidden flex flex-col transform-gpu cursor-pointer ${currentTheme.wrapper}`}
    >
        {game.isRepeatedCelestial && (
          <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-[4px] overflow-hidden rounded-[min(4cqw,12px)] text-center">
            <span className="relative z-10 text-[14cqw] font-black uppercase italic text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              Repeated!
            </span>
          </div>
        )}

        {isSecretRarity && (
          <>
            <div className={`absolute inset-0 z-[1] ${isUnreal ? 'bg-[radial-gradient(circle_at_50%_50%,_#ffffff_0%,_#f0f9ff_100%)]' : 'bg-gradient-to-br from-[#050515] via-purple-950 to-[#0a001a]'}`} />
            
            {isUnreal && (
              <div 
                className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none"
                style={{
                  backgroundImage: `radial-gradient(#0ea5e9 1px, transparent 0)`,
                  backgroundSize: '10px 10px'
                }}
              />
            )}

            <div 
              className="absolute inset-0 z-[30] pointer-events-none rounded-[min(4cqw,12px)] border-[min(1cqw,5px)] border-transparent" 
              style={{ 
                background: isUnreal 
                  ? 'linear-gradient(135deg, #fff, #3b82f6, #fff, #6366f1, #fff) border-box'
                  : 'linear-gradient(135deg, #22d3ee, #d946ef, #fbbf24) border-box', 
                WebkitMask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)', 
                WebkitMaskComposite: 'xor', 
                maskComposite: 'exclude' 
              }} 
            />
          </>
        )}

        <div className="absolute inset-0 z-20 pointer-events-none" style={getHoloStyle()} />

        <div className={`px-[6cqw] py-[4cqw] flex items-center gap-[1.5cqw] border-b relative z-10 flex-shrink-0 ${currentTheme.header}`}>
          <span className={`text-[3cqw] ${isSecretRarity ? (isUnreal ? 'text-blue-500 animate-pulse' : 'text-fuchsia-300') : ''}`}>
            {isSecretRarity ? '✦' : '◈'}
          </span>
          <span className={`text-[4.5cqw] font-black tracking-[0.2em] uppercase truncate ${isUnreal ? 'bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-slate-900 to-indigo-600' : ''}`}>
            {game.rarity}
          </span>
        </div>

        <div className="p-[3cqw] relative z-10 flex-shrink-0">
          <div className={`relative w-full aspect-video rounded-[min(2cqw,8px)] overflow-hidden border bg-black ${currentTheme.imageContainer}`}>
            <img src={game.image} className="w-full h-full object-cover" alt={game.name} />
          </div>
        </div>

        <div className="px-[5cqw] pb-[5cqw] flex-1 flex flex-col justify-between pointer-events-none relative z-10 min-h-0">
          <div className="mt-[2cqw] overflow-hidden">
            <h3 className={`text-[10cqw] leading-[0.9] font-bold italic line-clamp-2 break-words pt-[1cqw] mb-[1cqw] ${currentTheme.title}`}>
              {game.name}
            </h3>
            <p className="text-[5cqw] uppercase tracking-[0.1em] opacity-70 font-semibold truncate pt-[1cqw]">
              {developer}
            </p>
          </div>
          
          <div className={`flex justify-between items-end gap-[1cqw] pt-[3cqw] flex-shrink-0 ${currentTheme.statsBorder}`}>
            {[
              { label: 'Rtg', val: `${game.score}%` },
              { label: 'PWR!', val: powerScore },
              { label: 'Pop', val: game.reviews >= 1000 ? (game.reviews / 1000).toFixed(1) + 'k' : game.reviews }
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <p className="text-[5cqw] opacity-60 uppercase font-black tracking-wider mb-[0.5cqw]">{s.label}</p>
                <p className={`font-mono text-[6cqw] font-bold w-full text-center py-[0.5cqw] rounded-[1cqw] ${isUnreal ? 'bg-blue-50/80 text-blue-900' : 'bg-black/20'}`}>
                  {s.val}
                </p>
              </div>
            ))}
          </div>
        </div>
    </div>
  );

  if (disableLink) {
    return (
      <button type="button" onClick={onClick} disabled={disabled} style={{ perspective: '1200px' }} className="group block text-left disabled:opacity-60 disabled:cursor-not-allowed">
        {card}
      </button>
    );
  }

  return (
    <a href={`https://store.steampowered.com/app/${game.id}`} target="_blank" rel="noopener noreferrer" style={{ perspective: '1200px' }} className="group block">
      {card}
    </a>
  );
}