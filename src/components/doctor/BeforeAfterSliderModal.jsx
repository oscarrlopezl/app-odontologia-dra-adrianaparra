import React, { useState, useRef, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  Sparkles,
  X,
  Upload,
  ArrowRightLeft,
  Download,
  Image as ImageIcon,
  Check,
  Maximize2
} from 'lucide-react';

export default function BeforeAfterSliderModal({ isOpen, onClose, patient }) {
  const { settings, showToast } = useDental();

  // Estados de imágenes (Por defecto plantillas de estética dental para demostración)
  const [beforeImage, setBeforeImage] = useState(
    'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?auto=format&fit=crop&w=800&q=80'
  );
  const [afterImage, setAfterImage] = useState(
    'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80'
  );
  const [treatmentTitle, setTreatmentTitle] = useState('Diseño de Sonrisa & Aclaramiento Dental');
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);

  if (!isOpen) return null;

  const handleSliderMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  };

  const handleTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handleSliderMove(e.touches[0].clientX);
    }
  };

  const handleFileUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (target === 'before') {
        setBeforeImage(event.target.result);
        showToast('Foto del "Antes" cargada con éxito.');
      } else {
        setAfterImage(event.target.result);
        showToast('Foto del "Después" cargada con éxito.');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                Comparador Estético "Antes y Después"
              </h3>
              <p className="text-xs text-slate-600">
                Paciente: <strong className="text-teal-700">{patient?.full_name || 'Paciente'}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Título del Caso Clínico */}
        <div className="mt-3.5">
          <input
            type="text"
            value={treatmentTitle}
            onChange={(e) => setTreatmentTitle(e.target.value)}
            placeholder="Título del procedimiento (ej: Aclaramiento en Sillón 35% + Resinas Anteriores)"
            className="w-full px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Contenedor del Slider Interactivo */}
        <div className="mt-4">
          <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            onTouchMove={handleTouchMove}
            className="relative w-full h-72 sm:h-96 rounded-2xl overflow-hidden select-none cursor-ew-resize border border-slate-200 shadow-md bg-slate-950"
          >
            {/* Imagen del Después (Fondo completo) */}
            <img
              src={afterImage}
              alt="Después"
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
            />
            <span className="absolute bottom-3 right-3 bg-slate-950/80 text-emerald-300 font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-xs pointer-events-none backdrop-blur-xs">
              ✨ Después (Resultado)
            </span>

            {/* Imagen del Antes (Superpuesta con clip-path dinámico) */}
            <div
              className="absolute inset-0 overflow-hidden pointer-events-none"
              style={{ width: `${sliderPos}%` }}
            >
              <img
                src={beforeImage}
                alt="Antes"
                className="absolute inset-0 w-full h-full object-cover"
                style={{
                  width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%',
                  maxWidth: 'none',
                }}
              />
              <span className="absolute bottom-3 left-3 bg-slate-950/80 text-amber-300 font-extrabold text-[10px] tracking-wider px-2.5 py-1 rounded-lg uppercase shadow-xs backdrop-blur-xs">
                📸 Antes (Inicio)
              </span>
            </div>

            {/* Línea Divisoria y Agarrador Deslizante */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-[0_0_10px_rgba(0,0,0,0.5)] flex items-center justify-center pointer-events-none"
              style={{ left: `${sliderPos}%` }}
            >
              <div className="w-8 h-8 rounded-full bg-white text-slate-800 shadow-lg border-2 border-teal-600 flex items-center justify-center -ml-0.5 pointer-events-auto active:scale-95 transition">
                <ArrowRightLeft className="w-4 h-4 text-teal-700" />
              </div>
            </div>

            {/* Marca de Agua / Branding del Consultorio */}
            <div className="absolute top-3 left-3 bg-slate-900/85 backdrop-blur-xs px-3 py-1.5 rounded-xl text-white flex items-center gap-2 pointer-events-none border border-white/10 shadow-sm">
              <span className="text-xs">🦷</span>
              <div className="leading-tight text-left">
                <span className="block font-black text-[11px] text-white">
                  {settings?.doctor_name || 'Dra. Adriana Parra'}
                </span>
                <span className="block text-[9px] text-teal-300 font-semibold">
                  Odontología Especializada
                </span>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-700 mt-2">
            ↔️ Desliza la barra central con el dedo o el mouse para revelar el cambio estético.
          </p>
        </div>

        {/* Botones para Subir Propias Fotos */}
        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
          <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-teal-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 hover:text-teal-700 bg-slate-50 transition">
            <Upload className="w-4 h-4 text-teal-600" />
            <span>Subir Foto "Antes"</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'before')}
              className="hidden"
            />
          </label>

          <label className="flex items-center justify-center gap-2 p-2.5 border border-dashed border-slate-300 hover:border-teal-500 rounded-xl cursor-pointer text-xs font-bold text-slate-700 hover:text-teal-700 bg-slate-50 transition">
            <Upload className="w-4 h-4 text-emerald-600" />
            <span>Subir Foto "Después"</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'after')}
              className="hidden"
            />
          </label>
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end gap-2.5 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            Cerrar Comparador
          </button>
        </div>
      </div>
    </div>
  );
}
