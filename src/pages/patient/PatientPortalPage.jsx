import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import PrescriptionModal from '../../components/common/PrescriptionModal';
import {
  Calendar,
  CreditCard,
  Image as ImageIcon,
  Clock,
  Sparkles,
  Phone,
  CheckCircle2,
  Circle,
  FileText,
  DollarSign,
  AlertCircle,
  ChevronRight,
  Maximize2,
  Send,
  User,
  Heart,
  HelpCircle,
  LogOut,
  Landmark,
  Smartphone,
  Pill,
  Printer,
  WifiOff
} from 'lucide-react';

export default function PatientPortalPage() {
  const {
    patients,
    activePatientId,
    setActivePatientId,
    budgets,
    payments,
    clinicalRecords,
    radiographs,
    promotions,
    addAppointment,
    settings,
    showToast,
    isOnline,
  } = useDental();

  // Paciente logueado (por defecto toma el primero o el activo, con selector para demo)
  const [currentPatientId, setCurrentPatientId] = useState(activePatientId || patients[0]?.id || '');
  const [activeTab, setActiveTab] = useState('tratamiento'); // tratamiento, estado_cuenta, radiografias, agendar, promos
  const [selectedImageZoom, setSelectedImageZoom] = useState(null);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Formulario de agendar cita desde la web
  const [bookingForm, setBookingForm] = useState({
    date: '',
    timePreference: 'manana',
    reason: '',
  });
  const [bookingSent, setBookingSent] = useState(false);

  const currentPatient = patients.find((p) => p.id === currentPatientId) || patients[0];
  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  // Presupuesto y fases del paciente
  const patientBudgets = budgets.filter((b) => b.patient_id === currentPatient?.id);
  const mainBudget = patientBudgets[0];

  // Pagos del paciente
  const patientPayments = payments
    .filter((p) => p.patient_id === currentPatient?.id)
    .sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date));

  const totalPaidUsd = patientPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
  const totalBudgetUsd = mainBudget?.total_amount || 0;
  const balanceDueUsd = Math.max(0, totalBudgetUsd - totalPaidUsd);

  // Historias clínicas y recetas del paciente
  const patientRecords = clinicalRecords
    .filter((r) => r.patient_id === currentPatient?.id)
    .sort((a, b) => new Date(b.record_date) - new Date(a.record_date));

  // Radiografías del paciente
  const patientRadios = radiographs
    .filter((r) => r.patient_id === currentPatient?.id)
    .sort((a, b) => new Date(b.taken_at) - new Date(a.taken_at));

  const handleBookingSubmit = (e) => {
    e.preventDefault();
    if (!bookingForm.date || !bookingForm.reason.trim()) return;

    addAppointment({
      patient_id: currentPatient.id,
      patient_name: currentPatient.full_name,
      patient_phone: currentPatient.phone,
      appointment_date: bookingForm.date,
      start_time: bookingForm.timePreference === 'manana' ? '09:00' : '14:30',
      duration_minutes: 45,
      treatment_type: bookingForm.reason,
      status: 'programada',
      notes: `Solicitud en línea (Preferencia: ${bookingForm.timePreference})`,
      is_online_request: true,
    });

    setBookingSent(true);
    showToast('¡Tu solicitud de cita fue enviada al consultorio de la Dra. Adriana Parra!');
  };

  const navItems = [
    { id: 'tratamiento', label: 'Mi Tratamiento', icon: Heart },
    { id: 'estado_cuenta', label: 'Estado de Cuenta', icon: CreditCard },
    { id: 'radiografias', label: 'Radiografías', icon: ImageIcon },
    { id: 'agendar', label: 'Agendar Cita', icon: Calendar },
    { id: 'promos', label: 'Promociones', icon: Sparkles },
  ];

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center selection:bg-teal-500 selection:text-white">
      {/* Contenedor tipo pantalla móvil / responsive */}
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col shadow-2xl relative pb-20 border-x border-slate-200">
        {/* Barra Superior de la Clínica con Soporte de Logo */}
        <header className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-5 rounded-b-3xl shadow-lg relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-2xl p-1.5 shadow-md flex items-center justify-center">
                <img
                  src={settings.logo_url || "/logo-dra-adrianaparra.png"}
                  alt="Logo Consultorio"
                  className="max-h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="font-extrabold text-sm tracking-tight">{settings.doctor_name}</h1>
                <p className="text-[11px] text-teal-200">{settings.clinic_name || 'Portal Privado del Paciente'}</p>
              </div>
            </div>

            <a
              href={`https://wa.me/${(settings.whatsapp_phone || settings.phone)?.replace(/\D/g, '')}?text=Hola%20Dra.%20Adriana%2C%20le%20escribo%20desde%20el%20portal%20de%20pacientes%20de%20parte%20de%20${encodeURIComponent(currentPatient?.full_name || 'Paciente')}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 text-xs font-bold"
              title="Escribir al WhatsApp de la Dra. Adriana Parra"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>WhatsApp Dra.</span>
            </a>
          </div>

          {/* Tarjeta del Paciente Activo */}
          <div className="mt-4 p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white text-teal-800 font-extrabold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                {currentPatient?.photo_url ? (
                  <img
                    src={currentPatient.photo_url}
                    alt={currentPatient.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  currentPatient?.full_name?.slice(0, 2).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="font-bold text-xs leading-tight">{currentPatient?.full_name}</h2>
                <span className="text-[10px] text-teal-200 font-mono">CI: {currentPatient?.document_id}</span>
              </div>
            </div>

            {/* Selector de Paciente para pruebas/demo */}
            <select
              value={currentPatientId}
              onChange={(e) => setCurrentPatientId(e.target.value)}
              className="bg-teal-900/60 border border-teal-500/30 text-white text-[10px] rounded-lg px-2 py-1 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id} className="text-slate-900 bg-white">
                  {p.full_name.split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        </header>

        {/* Banner de Modo Offline Seguro */}
        {!isOnline && (
          <div className="bg-amber-600 text-white text-[10px] font-bold py-1.5 px-4 text-center flex items-center justify-center gap-1.5 shadow-xs">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Sin internet • Visualizando datos guardados localmente en tu teléfono</span>
          </div>
        )}

        {/* Contenido Principal según Pestaña */}
        <main className="flex-1 p-5 space-y-5">
          {/* TAB 1: MI TRATAMIENTO EN CURSO */}
          {activeTab === 'tratamiento' && (
            <div className="space-y-4">
              {/* Tarjeta Resumen del Plan */}
              <div className="bg-gradient-to-br from-teal-50 to-emerald-50/50 p-4 rounded-2xl border border-teal-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-teal-900">Tratamiento Odontológico</span>
                  <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {mainBudget?.status?.toUpperCase() || 'EN CURSO'}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">
                  {mainBudget?.title || 'Valoración y Saneamiento Dental'}
                </h3>
                <p className="text-[11px] text-slate-700 mt-1">
                  Atendido por la {settings.doctor_name} en {settings.address}.
                </p>
              </div>

              {/* Fases del Tratamiento */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Etapas de tu Tratamiento
                </h4>

                {mainBudget?.phases?.map((phase) => {
                  const isDone = phase.status === 'completada';
                  return (
                    <div
                      key={phase.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isDone ? 'bg-teal-50/40 border-teal-200' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-md bg-teal-600 text-white text-[10px] font-extrabold flex items-center justify-center">
                            {phase.phase_number}
                          </span>
                          <span className="font-bold text-xs text-slate-800">{phase.title}</span>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            isDone ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {phase.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="space-y-1.5 pl-7">
                        {phase.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            {it.completed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            ) : (
                              <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            )}
                            <span className={it.completed ? 'line-through text-slate-600' : 'text-slate-700 font-medium'}>
                              {it.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* SECCIÓN CLAVE: LO QUE LA DOCTORA LE RECETÓ (HISTORIAL MÉDICO Y RÉCIPES) */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-teal-600" />
                    <span>Récipes e Indicaciones de la Dra.</span>
                  </h4>
                  <span className="text-[10px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                    {patientRecords.filter(r => r.prescriptions).length} recetas
                  </span>
                </div>

                {patientRecords.length === 0 ? (
                  <p className="text-xs text-slate-700 italic">No tienes recetas médicas emitidas aún.</p>
                ) : (
                  patientRecords.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 bg-gradient-to-br from-teal-50/60 to-white rounded-2xl border border-teal-200 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-teal-100 pb-2">
                        <div>
                          <span className="text-xs font-bold text-teal-900 block">
                            Consulta del {rec.record_date}
                          </span>
                          {rec.diagnosis && (
                            <span className="text-[11px] text-teal-700 font-semibold">{rec.diagnosis}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedPrescription(rec)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-[11px] font-bold rounded-lg shadow-sm flex items-center gap-1 transition"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Ver Récipe</span>
                        </button>
                      </div>

                      {/* Procedimiento Realizado */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-700 uppercase block">Procedimiento:</span>
                        <p className="text-xs text-slate-800 font-medium">{rec.procedure_performed}</p>
                      </div>

                      {/* Medicamentos Recetados (Rp) */}
                      {rec.prescriptions && (
                        <div className="p-3 bg-white rounded-xl border border-teal-100 shadow-2xs">
                          <span className="text-[10px] font-extrabold text-teal-900 uppercase block mb-1 flex items-center gap-1">
                            <span>💊 Medicamentos que debes tomar:</span>
                          </span>
                          <p className="text-xs text-slate-800 whitespace-pre-line font-mono font-medium leading-relaxed">
                            {rec.prescriptions}
                          </p>
                        </div>
                      )}

                      {/* Cuidados e Indicaciones */}
                      {rec.indications && (
                        <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
                          <span className="text-[10px] font-bold text-amber-900 block mb-0.5">
                            💡 Cuidados e Indicaciones de la Doctora:
                          </span>
                          <p className="text-xs text-amber-900 whitespace-pre-line">
                            {rec.indications}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 2: ESTADO DE CUENTA TRANSPARENTE */}
          {activeTab === 'estado_cuenta' && (
            <div className="space-y-4">
              <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-3">
                <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block">
                  Estado de Cuenta Transparente
                </span>

                <div className="flex items-end justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Saldo Pendiente</span>
                    <h3 className="text-3xl font-extrabold text-white">${balanceDueUsd.toFixed(2)}</h3>
                    <span className="text-xs text-teal-300 block">
                      ≈ {(balanceDueUsd * exchangeRate).toFixed(2)} Bs
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-emerald-400 block">Total Abonado</span>
                    <span className="text-lg font-bold text-emerald-400">${totalPaidUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-400 block">
                      de ${totalBudgetUsd.toFixed(2)}
                    </span>
                  </div>
                </div>

                {balanceDueUsd === 0 && totalBudgetUsd > 0 && (
                  <div className="bg-emerald-500/20 text-emerald-300 p-2 rounded-xl text-xs font-bold text-center border border-emerald-500/30">
                    🎉 ¡Te encuentras totalmente solvente con tu tratamiento!
                  </div>
                )}
              </div>

              {/* Datos para Pagar */}
              <div className="p-4 bg-teal-50 rounded-2xl border border-teal-200 space-y-2">
                <h4 className="text-xs font-bold text-teal-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-teal-700" />
                  <span>Métodos de Pago Aceptados</span>
                </h4>
                <div className="text-xs text-slate-700 space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-teal-100">
                    <span className="font-semibold">💵 Efectivo USD</span>
                    <span className="text-teal-700 font-bold">En Consultorio</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-teal-100">
                    <span className="font-semibold">📱 Pago Móvil</span>
                    <span className="text-teal-700 font-mono font-bold">Tasa Oficial BCV: {exchangeRate.toFixed(2)} Bs</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-white rounded-xl border border-teal-100">
                    <span className="font-semibold">🏦 Zelle</span>
                    <span className="text-teal-700 font-bold">Consultar con la Dra.</span>
                  </div>
                </div>
              </div>

              {/* Desglose de Abonos Realizados */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Historial de tus Abonos
                </h4>
                {patientPayments.length === 0 ? (
                  <p className="text-xs text-slate-700 italic">No registras abonos aún.</p>
                ) : (
                  patientPayments.map((p) => (
                    <div key={p.id} className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between shadow-2xs">
                      <div>
                        <h5 className="font-bold text-xs text-slate-800">{p.concept}</h5>
                        <span className="text-[10px] text-slate-700 block font-mono">
                          {p.payment_date?.split('T')[0]} • {p.payment_method?.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-extrabold text-emerald-600 text-sm block">
                          +${p.amount_usd?.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-slate-700 font-medium">
                          {p.amount_bs?.toFixed(2)} Bs
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: RADIOGRAFÍAS Y FOTOS */}
          {activeTab === 'radiografias' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Tus Estudios Radiográficos</h3>
                <p className="text-xs text-slate-700">Panorámicas y fotografías tomadas durante tus consultas.</p>
              </div>

              {patientRadios.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <ImageIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-700">Aún no tienes radiografías en tu expediente.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {patientRadios.map((rad) => (
                    <div
                      key={rad.id}
                      onClick={() => setSelectedImageZoom(rad)}
                      className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs cursor-pointer group"
                    >
                      <div className="relative aspect-video bg-slate-900">
                        <img
                          src={rad.image_url}
                          alt={rad.title}
                          className="w-full h-full object-cover group-hover:opacity-90 transition"
                        />
                        <span className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Maximize2 className="w-3 h-3" /> Ver completa
                        </span>
                        <span className="absolute top-2 left-2 bg-teal-600 text-white text-[9px] font-bold px-2 py-0.5 rounded uppercase">
                          {rad.type}
                        </span>
                      </div>
                      <div className="p-3">
                        <h4 className="font-bold text-xs text-slate-800">{rad.title}</h4>
                        <span className="text-[10px] text-slate-700 block">Fecha: {rad.taken_at}</span>
                        {rad.notes && <p className="text-[11px] text-slate-700 mt-1 italic">{rad.notes}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AGENDAR CITA EN LÍNEA */}
          {activeTab === 'agendar' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-4 rounded-2xl">
                <h3 className="font-extrabold text-sm">Solicita tu Próxima Cita</h3>
                <p className="text-xs text-teal-100 mt-0.5">
                  La Dra. Adriana Parra te confirmará el turno directamente por WhatsApp.
                </p>
              </div>

              {bookingSent ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center space-y-2">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                  <h4 className="font-bold text-emerald-900 text-sm">¡Solicitud Registrada con Éxito!</h4>
                  <p className="text-xs text-emerald-700">
                    Tu solicitud ya aparece en la agenda de la doctora. Te contactaremos al {currentPatient?.phone}.
                  </p>
                  <button
                    onClick={() => {
                      setBookingSent(false);
                      setBookingForm({ date: '', timePreference: 'manana', reason: '' });
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl"
                  >
                    Hacer otra solicitud
                  </button>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Fecha Tentativa Deseada *
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Horario Preferido
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, timePreference: 'manana' })}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          bookingForm.timePreference === 'manana'
                            ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        ☀️ Turno Mañana (8am - 12pm)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingForm({ ...bookingForm, timePreference: 'tarde' })}
                        className={`py-2 text-xs font-bold rounded-xl border transition ${
                          bookingForm.timePreference === 'tarde'
                            ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        🌤️ Turno Tarde (1pm - 5pm)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                      Motivo de la Cita *
                    </label>
                    <textarea
                      rows={3}
                      value={bookingForm.reason}
                      onChange={(e) => setBookingForm({ ...bookingForm, reason: e.target.value })}
                      placeholder="Ej: Molestia en muela, continuación de resina, limpieza o revisión general..."
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500"
                      required
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Solicitud de Cita</span>
                  </button>

                  <div className="relative flex items-center justify-center my-3">
                    <div className="border-t border-slate-200 w-full"></div>
                    <span className="bg-white px-2.5 text-[10px] text-slate-700 font-bold uppercase tracking-wider absolute">O por WhatsApp directo</span>
                  </div>

                  <a
                    href={`https://wa.me/${(settings.whatsapp_phone || settings.phone)?.replace(/\D/g, '')}?text=Hola%20Dra.%20Adriana%2C%20quisiera%20agendar%20una%20cita%20odontol%C3%B3gica%20a%20nombre%20de%20${encodeURIComponent(currentPatient?.full_name || 'Paciente')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Escribir al WhatsApp de la Dra. Adriana</span>
                  </a>
                </form>
              )}
            </div>
          )}

          {/* TAB 5: PROMOCIONES Y BENEFICIOS */}
          {activeTab === 'promos' && (
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">Promociones y Cuidados Dentales</h3>
                <p className="text-xs text-slate-700">Beneficios exclusivos para nuestros pacientes.</p>
              </div>

              <div className="space-y-3">
                {promotions.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 bg-gradient-to-br from-teal-50 via-white to-emerald-50/40 rounded-2xl border border-teal-200 shadow-2xs space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="bg-teal-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                        {p.discount_tag}
                      </span>
                      {p.valid_until && (
                        <span className="text-[10px] text-slate-700 font-medium">Hasta: {p.valid_until}</span>
                      )}
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{p.title}</h4>
                    <p className="text-xs text-slate-700">{p.description}</p>
                    <button
                      onClick={() => setActiveTab('agendar')}
                      className="text-xs font-bold text-teal-700 hover:underline flex items-center gap-1 pt-1"
                    >
                      <span>Aprovechar promoción y agendar</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Consejos de la Doctora */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-1.5">
                <h5 className="font-bold text-slate-800">Consejo de la Dra. Adriana:</h5>
                <p>
                  Recuerda cambiar tu cepillo dental cada 3 meses o después de un resfriado. El uso de hilo dental una vez al día previene el 80% de las caries interproximales.
                </p>
              </div>
            </div>
          )}
        </main>

        {/* Barra de Navegación Inferior Móvil (Sticky Bottom) */}
        <nav className="fixed bottom-0 w-full max-w-md bg-white border-t border-slate-200 px-2 py-2 flex items-center justify-around z-40 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 py-1 px-2 rounded-xl transition ${
                  isSelected ? 'text-teal-700 font-extrabold' : 'text-slate-600 hover:text-slate-700'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-teal-600 stroke-[2.5]' : ''}`} />
                <span className="text-[10px] leading-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Modal de Récipe Odontológico para el Paciente */}
        <PrescriptionModal
          isOpen={Boolean(selectedPrescription)}
          onClose={() => setSelectedPrescription(null)}
          record={selectedPrescription}
          patient={currentPatient}
        />

        {/* Modal Zoom de Radiografía */}
        {selectedImageZoom && (
          <div
            className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImageZoom(null)}
          >
            <div className="max-w-md w-full text-center" onClick={(e) => e.stopPropagation()}>
              <img
                src={selectedImageZoom.image_url}
                alt={selectedImageZoom.title}
                className="max-h-[70vh] mx-auto rounded-2xl object-contain border border-slate-800"
              />
              <div className="mt-4 text-white">
                <h4 className="font-bold text-sm">{selectedImageZoom.title}</h4>
                <p className="text-xs text-slate-400 mt-1">{selectedImageZoom.notes}</p>
                <button
                  onClick={() => setSelectedImageZoom(null)}
                  className="mt-3 px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Botón Flotante de WhatsApp para Pacientes */}
        <a
          href={`https://wa.me/${(settings.whatsapp_phone || settings.phone)?.replace(/\D/g, '')}?text=Hola%20Dra.%20Adriana%2C%20le%20escribo%20desde%20su%20portal%20odontol%C3%B3gico%20de%20parte%20de%20${encodeURIComponent(currentPatient?.full_name || 'Paciente')}`}
          target="_blank"
          rel="noreferrer"
          className="fixed bottom-20 right-4 sm:right-6 z-40 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-full shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-all hover:scale-105 border-2 border-white"
          title="Escribir por WhatsApp a la Dra. Adriana Parra"
        >
          <Phone className="w-4 h-4" />
          <span className="text-xs font-extrabold tracking-tight">WhatsApp Dra.</span>
        </a>
      </div>
    </div>
  );
}
