import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import Odontogram from './Odontogram';
import BudgetPhaseManager from './BudgetPhaseManager';
import ClinicalHistoryModal from './ClinicalHistoryModal';
import XrayUploaderModal from './XrayUploaderModal';
import PaymentModal from './PaymentModal';
import PatientFormModal from './PatientFormModal';
import PrescriptionModal from '../common/PrescriptionModal';
import {
  User,
  Phone,
  Mail,
  Calendar,
  AlertTriangle,
  HeartPulse,
  FileText,
  Image as ImageIcon,
  CreditCard,
  Plus,
  DollarSign,
  Maximize2,
  Trash2,
  Edit,
  ExternalLink,
  Receipt,
  Sparkles,
  Printer,
  Pill,
} from 'lucide-react';

export default function PatientDetailView({ patient }) {
  const {
    clinicalRecords,
    radiographs,
    payments,
    getPatientFinancials,
    settings,
    deletePatient,
  } = useDental();

  const [activeTab, setActiveTab] = useState('odontograma');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showXrayModal, setShowXrayModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedImageZoom, setSelectedImageZoom] = useState(null);
  const [selectedPrescriptionRecord, setSelectedPrescriptionRecord] = useState(null);

  if (!patient) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
        <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <h4 className="font-bold text-slate-700">Selecciona un paciente del menú lateral</h4>
        <p className="text-xs text-slate-600 mt-1">Haz clic en cualquier paciente para cargar su ficha clínica y odontograma.</p>
      </div>
    );
  }

  const financials = getPatientFinancials(patient.id);
  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  const patientRecords = clinicalRecords
    .filter((r) => r.patient_id === patient.id)
    .sort((a, b) => new Date(b.record_date) - new Date(a.record_date));

  const patientRadios = radiographs
    .filter((r) => r.patient_id === patient.id)
    .sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));

  const patientPayments = payments
    .filter((p) => p.patient_id === patient.id)
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  const tabs = [
    { id: 'odontograma', label: 'Odontograma Digital', icon: Sparkles },
    { id: 'historia', label: `Evolución e Historia (${patientRecords.length})`, icon: FileText },
    { id: 'radiografias', label: `Radiografías (${patientRadios.length})`, icon: ImageIcon },
    { id: 'presupuestos', label: 'Presupuestos y Pagos', icon: CreditCard },
    { id: 'antecedentes', label: 'Datos y Antecedentes', icon: HeartPulse },
  ];

  return (
    <div className="space-y-6">
      {/* Tarjeta de Encabezado del Paciente */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white font-extrabold text-xl flex items-center justify-center shadow-md shadow-teal-500/20">
              {patient.full_name?.slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-extrabold text-slate-900">{patient.full_name}</h3>
                <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono">
                  {patient.document_id}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-700">
                <a
                  href={`https://wa.me/${patient.phone?.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-teal-700 hover:underline font-semibold"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{patient.phone}</span>
                </a>

                {patient.email && (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Mail className="w-3.5 h-3.5 text-slate-700" />
                    <span>{patient.email}</span>
                  </span>
                )}

                {patient.birth_date && (
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-700" />
                    <span>Nacimiento: {patient.birth_date}</span>
                  </span>
                )}
              </div>

              {/* Badges de Condiciones Médicas */}
              {patient.medical_conditions?.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Alerta:
                  </span>
                  {patient.medical_conditions.map((cond, idx) => (
                    <span
                      key={idx}
                      className="bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Resumen Financiero Rápido y Botones */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center gap-4 text-xs">
              <div>
                <span className="text-[10px] text-slate-700 block font-bold uppercase">Total Tratamiento</span>
                <span className="text-sm font-extrabold text-slate-800">${financials.totalBudget.toFixed(2)}</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-emerald-600 block font-bold uppercase">Abonado</span>
                <span className="text-sm font-extrabold text-emerald-600">${financials.totalPaid.toFixed(2)}</span>
              </div>
              <div className="w-px h-8 bg-slate-200"></div>
              <div>
                <span className="text-[10px] text-rose-600 block font-bold uppercase">Debe</span>
                <span className="text-sm font-extrabold text-rose-600">${financials.balanceDue.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
              >
                <DollarSign className="w-4 h-4" />
                <span>Abonar</span>
              </button>

              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl"
                title="Editar paciente"
              >
                <Edit className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  if (confirm(`¿Eliminar la ficha del paciente ${patient.full_name}?`)) {
                    deletePatient(patient.id);
                  }
                }}
                className="p-2 border border-slate-200 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl"
                title="Eliminar paciente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación de la Ficha */}
        <div className="flex items-center gap-2 mt-6 pt-4 border-t border-slate-100 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  isCurrent
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Contenido según la pestaña activa */}
      {activeTab === 'odontograma' && (
        <Odontogram patientId={patient.id} />
      )}

      {activeTab === 'historia' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base">Evolución Clínica y Recetas</h4>
              <p className="text-xs text-slate-700">Historial cronológico de consultas, diagnósticos, procedimientos y prescripción de fármacos.</p>
            </div>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir Consulta / Récipe</span>
            </button>
          </div>

          {patientRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-700 font-bold">No hay consultas registradas para este paciente.</p>
            </div>
          ) : (
            patientRecords.map((record) => (
              <div key={record.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-teal-800 text-xs bg-teal-50 border border-teal-200 px-2.5 py-0.5 rounded-lg">
                      Fecha: {record.record_date}
                    </span>
                    {record.tooth_numbers?.length > 0 && (
                      <span className="text-xs font-semibold text-slate-600">
                        Piezas: {record.tooth_numbers.join(', ')}
                      </span>
                    )}
                  </div>
                  
                  {/* Botón Imprimir Récipe de esta consulta */}
                  {record.prescriptions && (
                    <button
                      onClick={() => setSelectedPrescriptionRecord(record)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg border border-teal-200 transition"
                      title="Ver e Imprimir Récipe Odontológico"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Imprimir Récipe</span>
                    </button>
                  )}
                </div>

                {record.reason && (
                  <div>
                    <span className="text-[10px] font-bold text-slate-700 uppercase block">Motivo:</span>
                    <p className="text-xs text-slate-800 font-medium">{record.reason}</p>
                  </div>
                )}

                {record.diagnosis && (
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase block">Diagnóstico:</span>
                    <p className="text-xs text-slate-800 font-semibold">{record.diagnosis}</p>
                  </div>
                )}

                <div>
                  <span className="text-[10px] font-bold text-slate-700 uppercase block">Procedimiento Realizado:</span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    {record.procedure_performed}
                  </p>
                </div>

                {(record.indications || record.prescriptions) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {record.prescriptions && (
                      <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200/80 text-xs space-y-1">
                        <span className="font-bold text-teal-900 flex items-center gap-1">
                          <Pill className="w-3.5 h-3.5 text-teal-600" />
                          <span>Medicamentos Recetados (Rp):</span>
                        </span>
                        <p className="text-slate-800 whitespace-pre-line font-mono text-[11px]">{record.prescriptions}</p>
                      </div>
                    )}
                    {record.indications && (
                      <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 text-xs space-y-1">
                        <span className="font-bold text-amber-900 block">Indicaciones al Paciente:</span>
                        <p className="text-amber-800 whitespace-pre-line">{record.indications}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'radiografias' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base">Galería de Radiografías y Panorámicas</h4>
              <p className="text-xs text-slate-700">Imágenes diagnósticas almacenadas en la nube de Supabase.</p>
            </div>
            <button
              onClick={() => setShowXrayModal(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition"
            >
              <Plus className="w-4 h-4" />
              <span>Subir Radiografía</span>
            </button>
          </div>

          {patientRadios.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
              <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-700 font-bold">No hay radiografías subidas para este paciente.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {patientRadios.map((rad) => (
                <div
                  key={rad.id}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs group hover:border-teal-300 transition"
                >
                  <div className="relative aspect-video bg-slate-900 flex items-center justify-center overflow-hidden">
                    <img
                      src={rad.image_url}
                      alt={rad.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <button
                      onClick={() => setSelectedImageZoom(rad)}
                      className="absolute bottom-2 right-2 p-2 bg-slate-900/80 text-white rounded-xl backdrop-blur-xs opacity-0 group-hover:opacity-100 transition"
                      title="Ver en pantalla completa"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>
                    <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                      {rad.type}
                    </span>
                  </div>

                  <div className="p-4">
                    <h5 className="font-bold text-slate-800 text-xs truncate">{rad.title}</h5>
                    <span className="text-[10px] text-slate-700 block mt-0.5">Fecha: {rad.taken_at}</span>
                    {rad.notes && <p className="text-[11px] text-slate-700 mt-2 line-clamp-2">{rad.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'presupuestos' && (
        <div className="space-y-6">
          <BudgetPhaseManager
            patientId={patient.id}
            onOpenPaymentModal={() => setShowPaymentModal(true)}
          />

          {/* Historial de Pagos y Abonos Registrados */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
            <h4 className="font-extrabold text-slate-800 text-sm mb-3 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-emerald-600" />
              <span>Historial de Abonos Realizados por el Paciente ({patientPayments.length})</span>
            </h4>

            {patientPayments.length === 0 ? (
              <p className="text-xs text-slate-700">No se han registrado pagos aún.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Concepto</th>
                      <th className="py-2.5 px-3">Método</th>
                      <th className="py-2.5 px-3">Referencia</th>
                      <th className="py-2.5 px-3 text-right">Monto USD</th>
                      <th className="py-2.5 px-3 text-right">Monto Bs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {patientPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {p.payment_date?.split('T')[0]}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">{p.concept}</td>
                        <td className="py-2.5 px-3 capitalize font-medium text-teal-800">
                          {p.payment_method?.replace('_', ' ')}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700">
                          {p.reference}
                        </td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-emerald-600">
                          ${p.amount_usd?.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right text-slate-600 font-medium">
                          {p.amount_bs?.toFixed(2)} Bs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'antecedentes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
          <h4 className="font-extrabold text-slate-800 text-base">Ficha Médica y Contacto de Emergencia</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block">Dirección de Domicilio:</span>
                <p className="text-xs text-slate-800 mt-0.5">{patient.address || 'No especificada'}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block">Contacto de Emergencia:</span>
                <p className="text-xs text-slate-800 font-bold mt-0.5">
                  {patient.emergency_contact_name || 'No especificado'}
                </p>
                <p className="text-xs text-teal-700">{patient.emergency_contact_phone}</p>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block">Código de Acceso Portal Paciente:</span>
                <span className="inline-block mt-1 font-mono font-bold text-sm bg-slate-100 text-slate-800 px-3 py-1 rounded-lg">
                  {patient.access_code}
                </span>
                <p className="text-[11px] text-slate-700 mt-1">El paciente usa su cédula y este código para entrar a su portal móvil.</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-xs font-bold text-rose-600 uppercase block">Condiciones Médicas / Alergias:</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {patient.medical_conditions?.map((c, i) => (
                    <span key={i} className="bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold px-2.5 py-1 rounded-lg">
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block">Notas y Observaciones de la Doctora:</span>
                <p className="text-xs text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {patient.notes || 'Sin antecedentes adicionales.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modales auxiliares */}
      <ClinicalHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        patientId={patient.id}
        patientName={patient.full_name}
      />

      <XrayUploaderModal
        isOpen={showXrayModal}
        onClose={() => setShowXrayModal(false)}
        patientId={patient.id}
        patientName={patient.full_name}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        patientId={patient.id}
        patientName={patient.full_name}
      />

      <PatientFormModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        patientToEdit={patient}
      />

      {/* Modal de Récipe Odontológico para Imprimir */}
      <PrescriptionModal
        isOpen={Boolean(selectedPrescriptionRecord)}
        onClose={() => setSelectedPrescriptionRecord(null)}
        record={selectedPrescriptionRecord}
        patient={patient}
      />

      {/* Modal Zoom de Radiografía */}
      {selectedImageZoom && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImageZoom(null)}
        >
          <div className="max-w-4xl w-full text-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImageZoom.image_url}
              alt={selectedImageZoom.title}
              className="max-h-[80vh] mx-auto rounded-2xl shadow-2xl object-contain border border-slate-800"
            />
            <div className="mt-4 text-white">
              <h4 className="font-bold text-base">{selectedImageZoom.title}</h4>
              <p className="text-xs text-slate-400 mt-1">{selectedImageZoom.notes}</p>
              <button
                onClick={() => setSelectedImageZoom(null)}
                className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
