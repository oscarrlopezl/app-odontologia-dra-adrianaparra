import React, { useMemo } from 'react';

/**
 * Efecto visual de copos de nieve flotantes para temporada navideña 🎄❄️
 * - 100% acelerado por GPU (CSS transform3d)
 * - pointer-events: none (no bloquea clics ni interfiere con la app)
 * - Suave, elegante y profesional para el consultorio odontológico
 */
export default function SnowEffect({ isEnabled = true }) {
  if (!isEnabled) return null;

  // Generamos un conjunto fijo de copos con variaciones orgánicas
  const snowflakes = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${(i * 3.6 + (i % 5) * 1.5) % 100}%`,
      animationDuration: `${7 + (i % 7) * 2}s`,
      animationDelay: `${(i % 10) * 0.8}s`,
      size: 4 + (i % 5) * 2, // 4px a 12px
      opacity: 0.35 + (i % 4) * 0.18, // 0.35 a 0.89
      swayDuration: `${3 + (i % 4)}s`,
      isSparkle: i % 6 === 0,
    }));
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden z-20 select-none"
    >
      <style>{`
        @keyframes snowfall {
          0% {
            transform: translate3d(0, -20px, 0);
          }
          100% {
            transform: translate3d(0, 105vh, 0);
          }
        }
        @keyframes snowSway {
          0%, 100% {
            margin-left: 0px;
          }
          50% {
            margin-left: 24px;
          }
        }
        .snow-particle {
          position: absolute;
          top: -20px;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.4) 70%, transparent 100%);
          border-radius: 9999px;
          animation-name: snowfall;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        .snow-inner-sway {
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          animation-name: snowSway;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }
      `}</style>

      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snow-particle shadow-2xs"
          style={{
            left: flake.left,
            width: `${flake.size}px`,
            height: `${flake.size}px`,
            opacity: flake.opacity,
            animationDuration: flake.animationDuration,
            animationDelay: flake.animationDelay,
            boxShadow: flake.isSparkle
              ? '0 0 6px 2px rgba(254, 240, 138, 0.7)' // Toque dorado festivo
              : '0 0 4px 1px rgba(255, 255, 255, 0.6)',
          }}
        >
          <div
            className="snow-inner-sway"
            style={{
              animationDuration: flake.swayDuration,
            }}
          />
        </div>
      ))}
    </div>
  );
}
