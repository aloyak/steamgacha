import { useState, useRef } from 'react';

export default function BoosterPack({
  onClick,
  title = "STEAM",
  series = "SERIES 2026",
  disabled = false,
  className = '',
  packClassName = ''
}) {
  const containerRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -12;
    const rotateY = ((x - rect.width / 2) / (rect.width / 2)) * 12;
    setTilt({ x: rotateX, y: rotateY });
  };

  return (
    <div
      className={`relative group ${disabled ? 'cursor-wait' : 'cursor-pointer'} ${className}`}
      style={{ perspective: '1200px' }}
      onMouseMove={disabled ? undefined : handleMouseMove}
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      onClick={disabled ? undefined : onClick}
    >
      <div className="absolute -inset-10 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-500/25 transition-all duration-700" />

      <div
        ref={containerRef}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
          transition: tilt.x === 0 ? 'transform 0.8s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
        }}
        className={`relative transform-gpu ${packClassName}`}
      >
        <img
          src="/packs/boosterpack_standard.png"
          alt={`${title} Booster Pack`}
          className="w-75 drop-shadow-[0_50px_100px_rgba(0,0,0,0.8)]"
        />

        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-[-100%] w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] group-hover:animate-shine" />
        </div>
      </div>
    </div>
  );
}