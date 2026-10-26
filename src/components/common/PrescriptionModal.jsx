import React from 'react';
import { useDental } from '../../context/DentalContext';
import { Printer, X, Pill, Stethoscope, AlertCircle, ShieldCheck } from 'lucide-react';

export default function PrescriptionModal({ isOpen, onClose, record, patient }) {
  const { settings } = useDental();

  if (!isOpen || !record || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        {/* Barra Superior con Botón Imprimir */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 print:hidden">
          <div className="flex items-center gap-2">
            <Pill className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-800">Récipe e Indicaciones Médicas</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / Guardar PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-600 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* FORMATO DEL RÉCIPE ODONTOLÓGICO (Listo para Imprimir) */}
        <div className="mt-4 p-6 border border-slate-200 rounded-2xl bg-white shadow-2xs space-y-6 print:border-none print:shadow-none print:p-0">
          {/* Membrete de la Doctora */}
          <div className="flex items-center justify-between border-b-2 border-teal-600 pb-4">
            <div className="flex items-center gap-3">
              {settings?.logo_url ? (
                <img
                  src={settings.logo_url}
                  alt="Logo Consultorio"
                  className="w-12 h-12 object-contain rounded-xl"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-2xl">
                  🦷
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-base text-slate-900 leading-tight">
                  {settings?.doctor_name || 'Dra. Adriana Parra'}
                </h4>
                <p className="text-[11px] text-teal-700 font-bold">
                  {settings?.doctor_specialty || 'Odontólogo General y Estética Dental'}
                </p>
                <p className="text-[10px] text-slate-700">
                  {settings?.clinic_name || 'Centro Odontológico'} • {settings?.address || 'Guacara / Yagua'}
                </p>
              </div>
            </div>

            <div className="text-right text-[11px] text-slate-700">
              <span className="font-bold text-slate-800 block">RÉCIPE ODONTOLÓGICO</span>
              <span>Fecha: {record.record_date}</span>
            </div>
          </div>

          {/* Datos del Paciente */}
          <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl text-xs border border-slate-200">
            <div>
              <span className="text-slate-700 block font-semibold text-[10px] uppercase">Paciente:</span>
              <strong className="text-slate-800">{patient.full_name}</strong>
            </div>
            <div>
              <span className="text-slate-700 block font-semibold text-[10px] uppercase">Cédula / Teléfono:</span>
              <span className="text-slate-800 font-mono font-medium">{patient.document_id} • {patient.phone}</span>
            </div>
            {patient.medical_conditions?.length > 0 && (
              <div className="col-span-2 text-rose-600 font-bold text-[11px]">
                ⚠️ Alertas médicas: {patient.medical_conditions.join(', ')}
              </div>
            )}
          </div>

          {/* Diagnóstico */}
          {record.diagnosis && (
            <div className="text-xs">
              <span className="text-[10px] font-bold text-slate-700 uppercase block mb-0.5">Diagnóstico Clínico:</span>
              <p className="font-semibold text-slate-800 bg-teal-50/50 p-2 rounded-lg border border-teal-100">
                {record.diagnosis}
              </p>
            </div>
          )}

          {/* Rp / Prescripción Farmacológica */}
          <div className="space-y-2">
            <span className="text-sm font-extrabold text-teal-900 flex items-center gap-1.5">
              <span>Rp. / Prescripción Médica:</span>
            </span>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-900 whitespace-pre-line leading-relaxed font-mono font-medium">
              {record.prescriptions || 'Sin prescripción farmacológica para esta cita.'}
            </div>
          </div>

          {/* Indicaciones Generales */}
          {record.indications && (
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 block">Indicaciones al Paciente:</span>
              <p className="text-xs text-slate-700 bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 whitespace-pre-line">
                {record.indications}
              </p>
            </div>
          )}

          {/* Firma y Sello de la Doctora */}
          <div className="pt-8 flex justify-end">
            <div className="text-center w-56 border-t border-slate-400 pt-2">
              <span className="font-extrabold text-xs text-slate-900 block">{settings?.doctor_name || 'Dra. Adriana Parra'}</span>
              <span className="text-[10px] text-slate-700 block">Odontólogo</span>
              <span className="text-[10px] text-teal-700 font-semibold block">{settings?.phone || ''}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end print:hidden">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
