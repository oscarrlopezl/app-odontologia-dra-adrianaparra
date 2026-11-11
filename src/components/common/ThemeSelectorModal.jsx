import React from 'react';
import { useDental } from '../../context/DentalContext';
import { THEME_CONFIGS } from '../../lib/themeService';
import {
  Palette,
  X,
  Check,
  Calendar,
  Sparkles,
  Snowflake,
  Sun,
  Moon,
  Heart,
  Info
} from 'lucide-react';

export default function ThemeSelectorModal({ isOpen, onClose }) {
  const {
    currentTheme,
    themeMode,
    isSnowActive,
    setThemeModeAndSelection,
    toggleSnowEffect,
    showToast,
  } = useDental();

  if (!isOpen) return null;

  const themesList = Object.values(THEME_CONFIGS);

  const handleSelectTheme = (themeId) => {
    // Si selecciona un tema directamente, se pasa a modo manual o se guarda
    setThemeModeAndSelection('manual', themeId);
    showToast(`Tema visual cambiado a: ${THEME_CONFIGS[themeId]?.name}`, 'success');
  };

  const handleToggleAuto = () => {
    const newMode = themeMode === 'auto' ? 'manual' : 'auto';
    setThemeModeAndSelection(newMode, currentTheme?.id);
    if (newMode === 'auto') {
      showToast('🗓️ Sincronización automática con el calendario activada.', 'success');
    } else {
      showToast('🎨 Modo manual activo: el tema no cambiará con las fechas.', 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white flex items-center justify-between border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 text-xl shadow-inner">
              <Palette className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold flex items-center gap-2">
                <span>Temas Visuales y Conmemorativos</span>
                <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-bold">
                  {currentTheme?.shortName || 'Navidad'}
                </span>
              </h3>
              <p className="text-xs text-teal-200/90 mt-0.5">
                Adapta los colores y la ambientación de la app al calendario festivo
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Opción 1: Control de Cambio Automático por Fechas */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-teal-700" />
                <h4 className="font-extrabold text-xs sm:text-sm text-teal-950">
                  Cambio Automático por Calendario (Recomendado)
                </h4>
              </div>
              <p className="text-xs text-teal-800 leading-relaxed">
                Cuando esté activo, la app colocará automáticamente el tema <strong>Navideño 🎄</strong> en Noviembre-Enero, <strong>San Valentín 💖</strong> en Febrero, y el <strong>Clásico Clínico 💎</strong> el resto del año.
              </p>
            </div>

            <button
              type="button"
              onClick={handleToggleAuto}
              className={`px-4 py-2 rounded-xl text-xs font-black transition shadow-sm shrink-0 flex items-center justify-center gap-2 ${
                themeMode === 'auto'
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
                  : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-300'
              }`}
            >
              {themeMode === 'auto' ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Automático: ACTIVO</span>
                </>
              ) : (
                <span>Activar Automático</span>
              )}
            </button>
          </div>

          {/* Opción 2: Efecto Nieve para Navidad */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-cyan-100 text-cyan-800">
                <Snowflake className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-xs text-slate-800">Copos de Nieve Flotantes</h5>
                <p className="text-[11px] text-slate-500">
                  Animación suave y ligera en el fondo (no interfiere con botones ni clics).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleSnowEffect}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                isSnowActive
                  ? 'bg-cyan-600 text-white border-cyan-600'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
            >
              {isSnowActive ? 'Nieve ON' : 'Pausada'}
            </button>
          </div>

          {/* Grilla de Temas Disponibles */}
          <div>
            <h4 className="font-extrabold text-xs text-slate-700 uppercase tracking-wider mb-3">
              Catálogo de Temas Conmemorativos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {themesList.map((item) => {
                const isCurrent = currentTheme?.id === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTheme(item.id)}
                    className={`p-3.5 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 relative cursor-pointer ${
                      isCurrent
                        ? 'bg-gradient-to-br from-slate-900 to-slate-800 text-white border-teal-500 ring-2 ring-teal-500/30 shadow-lg'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{item.emoji}</span>
                        <div>
                          <h5 className={`font-black text-xs ${isCurrent ? 'text-white' : 'text-slate-900'}`}>
                            {item.name}
                          </h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                              isCurrent
                                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}
                          >
                            {item.seasonRangeText}
                          </span>
                        </div>
                      </div>

                      {isCurrent && (
                        <span className="p-1 rounded-full bg-emerald-500 text-slate-950 font-bold shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <p className={`text-[11px] leading-relaxed ${isCurrent ? 'text-slate-300' : 'text-slate-500'}`}>
                      {item.description}
                    </p>

                    {/* Muestrario de Colores */}
                    <div className="flex items-center gap-1.5 pt-1">
                      <span className="text-[10px] font-bold opacity-70">Acentos:</span>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: item.colors.festiveAccent }}
                        />
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-2xs"
                          style={{ backgroundColor: item.colors.festiveGold }}
                        />
                        <span className="w-3.5 h-3.5 rounded-full bg-slate-900 border border-white/20 shadow-2xs" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-[11px] text-slate-500">
            {themeMode === 'auto'
              ? '🗓️ En modo automático, la app cambiará sola de tema en cada época festiva.'
              : '🎨 Estás usando un tema fijado manualmente.'}
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition active:scale-95"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
