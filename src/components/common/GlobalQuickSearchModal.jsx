import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDental } from '../../context/DentalContext';
import {
  Search,
  X,
  User,
  Phone,
  Calendar,
  DollarSign,
  AlertTriangle,
  MessageSquare,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function GlobalQuickSearchModal({ isOpen, onClose, onSelectPatient }) {
  const { patients, setActivePatientId } = useDental();
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Si el padre controla isOpen, esto se manejará via context o prop
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const query = searchTerm.toLowerCase().trim();
  const filtered = (patients || []).filter((p) => {
    if (!query) return true;
    const name = String(p.full_name || '').toLowerCase();
    const doc = String(p.document_id || '').toLowerCase();
    const phone = String(p.phone || '').toLowerCase();
    const allergy = (p.allergies || []).join(' ').toLowerCase();
    return name.includes(query) || doc.includes(query) || phone.includes(query) || allergy.includes(query);
  });

  const handleGoToPatient = (patientId) => {
    setActivePatientId(patientId);
    if (onSelectPatient) onSelectPatient(patientId);
    navigate('/doctor');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 pt-16 sm:pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barra de Búsqueda Superior */}
        <div className="relative p-4 border-b border-slate-100 flex items-center gap-3">
          <Search className="w-5 h-5 text-teal-600 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar paciente por nombre, cédula, teléfono o alergia... (Ctrl + K)"
            className="w-full text-sm font-semibold bg-transparent focus:outline-none placeholder:text-slate-400 text-slate-800"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resultados */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="font-semibold text-slate-700">No se encontraron pacientes</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Prueba buscando con otro término o cédula</p>
            </div>
          ) : (
            filtered.map((p) => {
              const hasAlert = (p.allergies?.length > 0) || (p.medical_conditions?.length > 0);
              return (
                <div
                  key={p.id}
                  onClick={() => handleGoToPatient(p.id)}
                  className="p-3 rounded-2xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white text-slate-700 font-extrabold text-xs flex items-center justify-center shrink-0 transition">
                      {p.photo_url ? (
                        <img src={p.photo_url} alt={p.full_name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        p.full_name?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-teal-900 truncate">
                          {p.full_name}
                        </span>
                        {hasAlert && (
                          <span title="Alerta médica activa">
                            <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>{p.document_id}</span>
                        <span>•</span>
                        <span>{p.phone}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[11px] font-bold text-teal-700 opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      <span>Ver Ficha</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie con Atajos */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between font-mono">
          <span>{filtered.length} paciente(s) disponible(s)</span>
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">ESC</kbd>
            <span>para cerrar</span>
          </div>
        </div>
      </div>
    </div>
  );
}
