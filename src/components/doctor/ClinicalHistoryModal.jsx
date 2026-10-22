import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { FileText, Stethoscope, Pill, Calendar, X, AlertCircle, Sparkles, Plus } from 'lucide-react';

const COMMON_PRESCRIPTIONS = [
  'Amoxicilina 500mg: 1 cápsula cada 8 horas por 7 días.',
  'Amoxicilina + Ác. Clavulánico 875/125mg: 1 tableta cada 12 horas por 7 días.',
  'Ibuprofeno 400mg: 1 tableta cada 8 horas por 3 días con las comidas.',
  'Ketoprofeno 100mg: 1 cápsula cada 12 horas por 3 días si hay dolor moderado.',
  'Dexketoprofeno 25mg: 1 sobre o comprimido cada 8 horas por 3 días.',
  'Enjuague Bucal con Clorhexidina al 0.12%: Enjuagues de 30 segundos cada 12 horas por 7 días.',
];

const COMMON_INDICATIONS = [
  'Dieta blanda y fría durante las primeras 24 horas.',
  'No realizar esfuerzo físico ni levantar peso por 48 horas.',
  'No escupir, no usar pitillos/pajillas, no enjuagarse con fuerza hoy.',
  'Aplicar hielo local indirecto en la mejilla por 15 minutos cada hora.',
  'Cepillado suave en la zona intervenida con técnica de Bass.',
  'Evitar exposición directa al sol o al calor de la cocina.',
];

export default function ClinicalHistoryModal({ isOpen, onClose, patientId, patientName }) {
  const { addClinicalRecord } = useDental();

  const [formData, setFormData] = useState({
    record_date: new Date().toISOString().split('T')[0],
    reason: '',
    diagnosis: '',
    procedure_performed: '',
    tooth_numbers: '',
    indications: '',
    prescriptions: '',
    doctor_notes: '',
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.procedure_performed.trim()) {
      setError('Debes especificar el procedimiento realizado');
      return;
    }

    const toothArray = formData.tooth_numbers
      ? formData.tooth_numbers
          .split(',')
          .map((t) => parseInt(t.trim(), 10))
          .filter((n) => !isNaN(n))
      : [];

    addClinicalRecord({
      patient_id: patientId,
      ...formData,
      tooth_numbers: toothArray,
    });

    onClose();
  };

  const addPrescriptionPreset = (text) => {
    setFormData((prev) => ({
      ...prev,
      prescriptions: prev.prescriptions ? `${prev.prescriptions}\n• ${text}` : `• ${text}`,
    }));
  };

  const addIndicationPreset = (text) => {
    setFormData((prev) => ({
      ...prev,
      indications: prev.indications ? `${prev.indications}\n• ${text}` : `• ${text}`,
    }));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Nueva Consulta y Récipe Odontológico</h3>
            <p className="text-xs text-slate-700">Paciente: <strong className="text-teal-700">{patientName}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Fecha de Consulta *
              </label>
              <input
                type="date"
                value={formData.record_date}
                onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Piezas Dentales Tratadas (Opcional)
              </label>
              <input
                type="text"
                value={formData.tooth_numbers}
                onChange={(e) => setFormData({ ...formData, tooth_numbers: e.target.value })}
                placeholder="Ej: 14, 15, 21"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Motivo de Consulta / Síntomas
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Ej: Dolor espontáneo nocturno, sangrado de encías, control periódico..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Diagnóstico Clínico Odontológico
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Ej: Pulpitis irreversible sintomática, Gingivitis marginal, Caries oclusal profunda..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Procedimiento Realizado en el Sillón *
            </label>
            <textarea
              rows={3}
              value={formData.procedure_performed}
              onChange={(e) => setFormData({ ...formData, procedure_performed: e.target.value })}
              placeholder="Detalla minuciosamente el tratamiento: anestesia empleada, aislamiento absoluto/relativo, técnica, resina, sellador o endodoncia..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          {/* Sección de Récipe y Prescripción Médica */}
          <div className="p-4 bg-teal-50/50 rounded-2xl border border-teal-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Rp. / Receta Médica y Fármacos</span>
              </label>
              <span className="text-[11px] text-teal-700 font-semibold">
                Haz clic en los medicamentos rápidos para añadirlos:
              </span>
            </div>

            {/* Chips de Medicamentos Dentales Habituales */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESCRIPTIONS.map((presc, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => addPrescriptionPreset(presc)}
                  className="text-[11px] font-semibold bg-white text-slate-700 hover:text-teal-800 hover:bg-teal-100/70 border border-teal-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-teal-600" />
                  <span>{presc.split(':')[0]}</span>
                </button>
              ))}
            </div>

            <textarea
              rows={3}
              value={formData.prescriptions}
              onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
              placeholder="Detalle de fármacos recetados, miligramos, frecuencia y días de tratamiento..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-teal-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            ></textarea>
          </div>

          {/* Indicaciones Post-Tratamiento */}
          <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Indicaciones y Cuidados para el Paciente</span>
              </label>
              <span className="text-[11px] text-amber-700 font-semibold">
                Cuidados rápidos:
              </span>
            </div>

            {/* Chips de Indicaciones Habituales */}
            <div className="flex flex-wrap gap-1.5">
              {COMMON_INDICATIONS.map((ind, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => addIndicationPreset(ind)}
                  className="text-[11px] font-semibold bg-white text-slate-700 hover:text-amber-800 hover:bg-amber-100/70 border border-amber-200 px-2.5 py-1 rounded-lg transition flex items-center gap-1 shadow-2xs"
                >
                  <Plus className="w-3 h-3 text-amber-600" />
                  <span>{ind.split(' ')[0]} {ind.split(' ')[1]}...</span>
                </button>
              ))}
            </div>

            <textarea
              rows={2}
              value={formData.indications}
              onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
              placeholder="Instrucciones post-operatorias, cuidados de higiene, alimentos permitidos y prohibidos..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-amber-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            ></textarea>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Notas Internas de la Dra. Adriana (Privadas para el consultorio)
            </label>
            <input
              type="text"
              value={formData.doctor_notes}
              onChange={(e) => setFormData({ ...formData, doctor_notes: e.target.value })}
              placeholder="Ej: Paciente toleró muy bien el procedimiento, evaluar en 15 días tono de esmalte..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition"
            >
              Guardar Consulta y Récipe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
