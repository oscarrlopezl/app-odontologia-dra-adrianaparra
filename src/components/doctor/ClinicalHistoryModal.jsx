import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { FileText, Stethoscope, Pill, Calendar, X, AlertCircle } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Nueva Nota de Evolución Clínica</h3>
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
              Diagnóstico Clínico
            </label>
            <input
              type="text"
              value={formData.diagnosis}
              onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
              placeholder="Ej: Pulpitis irreversible sintomática, Gingivitis, Caries oclusal..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Procedimiento Realizado *
            </label>
            <textarea
              rows={3}
              value={formData.procedure_performed}
              onChange={(e) => setFormData({ ...formData, procedure_performed: e.target.value })}
              placeholder="Detalla minuciosamente el tratamiento: anestesia empleada, aislamiento, técnica, materiales y pulido..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Indicaciones al Paciente
              </label>
              <textarea
                rows={2}
                value={formData.indications}
                onChange={(e) => setFormData({ ...formData, indications: e.target.value })}
                placeholder="Dieta blanda, no masticar duro, técnica de cepillado..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Receta Médica / Prescripciones
              </label>
              <textarea
                rows={2}
                value={formData.prescriptions}
                onChange={(e) => setFormData({ ...formData, prescriptions: e.target.value })}
                placeholder="Ej: Amoxicilina 500mg c/8h x 7 días, Ibuprofeno 400mg c/8h..."
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              ></textarea>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Notas Internas de la Dra. (Privadas)
            </label>
            <input
              type="text"
              value={formData.doctor_notes}
              onChange={(e) => setFormData({ ...formData, doctor_notes: e.target.value })}
              placeholder="Recordar probar tono A2 en la próxima sesión, evaluar selle..."
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
              Guardar en Historia Clínica
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
