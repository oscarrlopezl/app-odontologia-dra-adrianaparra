import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  Sparkles,
  Palette,
  Snowflake,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  Calendar,
  Gift,
  Heart,
} from 'lucide-react';

export default function SeasonalThemeBanner({ onOpenThemeSelector, onOpenWhatsAppGreeting }) {
  const { currentTheme, themeMode, isSnowActive, toggleSnowEffect, activePatient, patients } = useDental();
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('dra_parra_seasonal_banner_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimized = () => {
    const next = !isMinimized;
    setIsMinimized(next);
    try {
      localStorage.setItem('dra_parra_seasonal_banner_minimized', String(next));
    } catch {
      // ignore
    }
  };

  const isChristmas = currentTheme?.id === 'christmas';
  const isSeasonal = currentTheme?.isSeasonal;

  // Si no es un tema estacional y el usuario no lo tiene activo, no mostrar el banner grande
  if (!isSeasonal && !isChristmas) return null;

  if (isMinimized) {
    return (
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-rose-950 text-white px-4 py-1.5 border-b border-emerald-500/30 flex items-center justify-between text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="text-base">🎄</span>
          <span className="font-extrabold text-[11px] text-amber-300">
            {currentTheme?.badgeText || 'Navidad 2026'}:
          </span>
          <span className="text-[11px] text-slate-200 hidden sm:inline">
            ¡Felices Fiestas les desea la Dra. Adriana Parra! ✨
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isChristmas && (
            <button
              type="button"
              onClick={toggleSnowEffect}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition flex items-center gap-1 ${
                isSnowActive
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/40'
                  : 'bg-white/10 text-slate-300 border-white/20'
              }`}
              title="Activar o pausar copos de nieve"
            >
              <Snowflake className="w-3 h-3" />
              <span>{isSnowActive ? 'Nieve ON' : 'Nieve OFF'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenThemeSelector}
            className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1 transition"
          >
            <Palette className="w-3 h-3" />
            <span className="hidden xs:inline">Temas</span>
          </button>

          <button
            type="button"
            onClick={toggleMinimized}
            className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-white transition"
            title="Expandir felicitación navideña"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-rose-950 via-slate-900 to-emerald-950 text-white border-b-2 border-emerald-500/40 px-3.5 py-2.5 sm:px-6 sm:py-3 shadow-md">
      {/* Luces decorativas superiores (Simulación visual festiva) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-400 via-emerald-500 via-blue-400 to-red-500 opacity-80" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400 to-rose-600 flex items-center justify-center text-lg shadow-md shrink-0 border border-amber-300/40">
            {currentTheme?.emoji || '🎄'}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-xs sm:text-sm text-white flex items-center gap-1.5 tracking-tight">
                <span>{currentTheme?.greeting || '¡Feliz Navidad y Próspero Año Nuevo!'}</span>
              </h3>
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider">
                {themeMode === 'auto' ? '🗓️ Tema Automático por Fecha' : '🎨 Personalizado'}
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/90 mt-0.5 leading-snug">
              Consultorio Odontológico Especializado Dra. Adriana Parra — Cuidando la sonrisa de Guacara y Carabobo en estas fiestas. 🎅🦷✨
            </p>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* Botón WhatsApp Navideño */}
          <button
            type="button"
            onClick={onOpenWhatsAppGreeting}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-900/30 transition active:scale-95"
            title="Enviar mensaje navideño de felicitación a un paciente por WhatsApp"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Navideño</span>
          </button>

          {/* Toggle Nieve */}
          {isChristmas && (
            <button
              type="button"
              onClick={toggleSnowEffect}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold border transition ${
                isSnowActive
                  ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50 hover:bg-cyan-500/30'
                  : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
              }`}
              title="Encender o pausar la nieve flotante"
            >
              <Snowflake className={`w-3.5 h-3.5 ${isSnowActive ? 'text-cyan-300' : 'text-slate-400'}`} />
              <span>{isSnowActive ? 'Nieve ON' : 'Pausar Nieve'}</span>
            </button>
          )}

          {/* Selector de Temas */}
          <button
            type="button"
            onClick={onOpenThemeSelector}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition"
            title="Elegir otro tema visual"
          >
            <Palette className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden xs:inline">Cambiar Tema</span>
          </button>

          {/* Minimizar */}
          <button
            type="button"
            onClick={toggleMinimized}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
            title="Minimizar banner"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
