import React, { useState, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  X,
  Phone,
  Send,
  Calendar,
  HeartPulse,
  Receipt,
  Pill,
  MessageSquare,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  AlertCircle,
  FileText,
  FileCheck
} from 'lucide-react';
import {
  cleanVenezuelanPhone,
  buildWhatsAppLink,
  getAppointmentReminderText,
  getPostTreatmentCareText,
  getBudgetReminderText,
  getPrescriptionText,
  getConsultationReportText,
  getMedicalJustificationText,
  getCustomMessageText,
  POST_TREATMENT_TYPES,
} from '../../lib/whatsappService';

export default function WhatsAppModal({
  isOpen,
  onClose,
  patient,
  appointment = null,
  budget = null,
  consultationRecord = null,
  initialTab = 'cita', // 'cita', 'cuidados', 'presupuesto', 'recipe', 'libre'
}) {
  const { settings, appointments, budgets, clinicalRecords, getPatientFinancials, showToast } = useDental();

  const [activeTab, setActiveTab] = useState(initialTab);
  const [recipientPhone, setRecipientPhone] = useState(patient?.phone || appointment?.patient_phone || '');
  const [messageText, setMessageText] = useState('');
  const [copied, setCopied] = useState(false);

  // Opciones para cuidados post-tratamiento
  const [careType, setCareType] = useState('cirugia');
  const [customCareNotes, setCustomCareNotes] = useState('');
  const [daysOff, setDaysOff] = useState('24 horas');

  // Cita seleccionada (por defecto la prop o la más próxima del paciente)
  const [selectedAppointment, setSelectedAppointment] = useState(appointment);

  // Presupuesto seleccionado
  const [selectedBudget, setSelectedBudget] = useState(budget);

  // Inicializar teléfono y cita cuando abre el modal o cambia el paciente
  useEffect(() => {
    if (patient) {
      setRecipientPhone(patient.phone || '');
      
      // Buscar última cita o próxima cita si no vino por prop
      if (!appointment) {
        const patientApts = appointments
          .filter((a) => a.patient_id === patient.id || a.patient_name === patient.full_name)
          .sort((a, b) => b.appointment_date.localeCompare(a.appointment_date));
        if (patientApts.length > 0) {
          setSelectedAppointment(patientApts[0]);
        }
      } else {
        setSelectedAppointment(appointment);
      }

      // Buscar presupuesto si no vino por prop
      if (!budget) {
        const pBudgets = budgets.filter((b) => b.patient_id === patient.id);
        if (pBudgets.length > 0) {
          setSelectedBudget(pBudgets[0]);
        }
      } else {
        setSelectedBudget(budget);
      }
    }
    setActiveTab(initialTab);
  }, [patient, appointment, budget, initialTab, isOpen]);

  // Actualizar el texto según la pestaña activa
  useEffect(() => {
    if (!isOpen || !patient) return;

    if (activeTab === 'cita') {
      const text = getAppointmentReminderText({
        patient,
        appointment: selectedAppointment,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'cuidados') {
      const text = getPostTreatmentCareText({
        patient,
        careType,
        customNotes: customCareNotes,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'presupuesto') {
      const financials = getPatientFinancials(patient.id);
      const text = getBudgetReminderText({
        patient,
        budget: selectedBudget,
        financials,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'recipe') {
      const text = getPrescriptionText({
        patient,
        record: consultationRecord,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'informe') {
      const recordToUse = consultationRecord || clinicalRecords.filter((r) => r.patient_id === patient.id)[0];
      const text = getConsultationReportText({
        patient,
        record: recordToUse,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'constancia') {
      const recordToUse = consultationRecord || clinicalRecords.filter((r) => r.patient_id === patient.id)[0];
      const text = getMedicalJustificationText({
        patient,
        record: recordToUse,
        daysOff,
        settings,
      });
      setMessageText(text);
    } else if (activeTab === 'libre') {
      const text = getCustomMessageText({
        patient,
        messageText: '',
        settings,
      });
      setMessageText(text);
    }
  }, [activeTab, careType, customCareNotes, daysOff, selectedAppointment, selectedBudget, consultationRecord, patient, settings, isOpen]);

  if (!isOpen || !patient) return null;

  const cleanPhone = cleanVenezuelanPhone(recipientPhone);
  const isValidPhone = cleanPhone && cleanPhone.length >= 10;

  const handleSendWhatsApp = () => {
    if (!isValidPhone) {
      alert('Por favor ingresa un número de teléfono válido para el paciente (ej: 0414-1234567 o 0412-1234567)');
      return;
    }
    const url = buildWhatsAppLink(cleanPhone, messageText);
    window.open(url, '_blank');
    if (showToast) {
      showToast('Abriendo WhatsApp con el mensaje...', 'success');
    }
    onClose();
  };

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      if (showToast) showToast('Texto copiado al portapapeles', 'info');
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Error al copiar texto:', err);
    }
  };

  const insertEmoji = (emoji) => {
    setMessageText((prev) => prev + ' ' + emoji);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Encabezado Superior */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-700 to-teal-800 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/25 shadow-xs">
              <span className="text-2xl">💬</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold truncate">
                  Mensaje WhatsApp al Paciente
                </h3>
                <span className="bg-emerald-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  Directo
                </span>
              </div>
              <p className="text-xs text-emerald-100 truncate">
                Dra. Adriana Parra • Envío directo a {patient.full_name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition shrink-0"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Teléfono del Paciente */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-slate-700">WhatsApp del Paciente:</span>
            <input
              type="text"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              placeholder="Ej: 0412-1234567"
              className="px-3 py-1 bg-white border border-slate-300 rounded-lg font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs flex-1 max-w-xs"
            />
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {isValidPhone ? (
              <span className="text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded-md flex items-center gap-1 font-mono">
                <Check className="w-3 h-3" /> +{cleanPhone}
              </span>
            ) : (
              <span className="text-rose-600 bg-rose-50 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Número incompleto
              </span>
            )}
          </div>
        </div>

        {/* Pestañas de Plantillas Odontológicas */}
        <div className="px-5 sm:px-6 pt-3 flex items-center gap-1.5 border-b border-slate-200 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('cita')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'cita'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>Recordar Cita</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cuidados')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'cuidados'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span>Cuidados Post-Tratamiento</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presupuesto')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'presupuesto'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Receipt className="w-4 h-4 text-teal-600" />
            <span>Presupuesto y Cobro</span>
          </button>

          {consultationRecord && (
            <button
              type="button"
              onClick={() => setActiveTab('recipe')}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
                activeTab === 'recipe'
                  ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Pill className="w-4 h-4 text-purple-600" />
              <span>Récipe e Indicaciones</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('informe')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'informe'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4 text-cyan-600" />
            <span>Informe de Consulta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('constancia')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'constancia'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-4 h-4 text-amber-600" />
            <span>Constancia / Reposo</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('libre')}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition whitespace-nowrap border-b-2 ${
              activeTab === 'libre'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-blue-600" />
            <span>Mensaje Personalizado</span>
          </button>
        </div>

        {/* Controles Dinámicos según la plantilla */}
        <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
          
          {/* Selector para Cuidados Post-Tratamiento */}
          {activeTab === 'cuidados' && (
            <div className="p-3.5 bg-rose-50/60 border border-rose-200/80 rounded-2xl space-y-3">
              <label className="text-xs font-bold text-slate-800 block">
                Selecciona el Procedimiento Realizado:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {POST_TREATMENT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setCareType(type.id)}
                    className={`text-left p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between ${
                      careType === type.id
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-rose-300'
                    }`}
                  >
                    <span className="truncate">{type.title}</span>
                    {careType === type.id && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ))}
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Nota adicional personalizada de la Doctora (Opcional):
                </label>
                <input
                  type="text"
                  value={customCareNotes}
                  onChange={(e) => setCustomCareNotes(e.target.value)}
                  placeholder="Ej: Recuerda colocarte la férula al dormir / Aplicar Clorhexidina al 0.12%"
                  className="w-full px-3 py-2 text-xs bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>
          )}

          {/* Selector de Tiempo de Reposo para Constancia */}
          {activeTab === 'constancia' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
              <label className="text-xs font-bold text-amber-950 block">
                Tiempo de Reposo Médico Sugerido:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {['24 horas', '48 horas', '3 días', '5 días', 'Reposo por el resto del día'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDaysOff(opt)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition ${
                      daysOff === opt
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-amber-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de Cita si tiene varias */}
          {activeTab === 'cita' && !appointment && (
            <div className="flex items-center justify-between p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs">
              <span className="font-semibold text-emerald-950">
                {selectedAppointment
                  ? `Cita cargada: ${selectedAppointment.appointment_date} a las ${selectedAppointment.start_time} (${selectedAppointment.treatment_type})`
                  : 'No hay citas registradas en la agenda para este paciente.'}
              </span>
            </div>
          )}

          {/* Editor del Mensaje / Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span className="flex items-center gap-1.5">
                <span>Contenido del Mensaje para WhatsApp:</span>
                <span className="text-[11px] text-slate-400 font-normal">(Puedes editar o agregar lo que gustes)</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {messageText.length} caracteres
              </span>
            </div>

            <div className="relative rounded-2xl border-2 border-emerald-500/40 focus-within:border-emerald-600 transition shadow-inner bg-slate-50">
              <textarea
                rows={9}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full p-4 text-xs font-sans text-slate-800 bg-transparent focus:outline-none resize-y leading-relaxed font-medium"
                placeholder="Escribe el mensaje aquí..."
              />
            </div>

            {/* Barra de Emojis Rápidos para Odontología */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-700 mr-1">Insertar emoji:</span>
              {['🦷', '📅', '⏰', '🩹', '💊', '✨', '🪥', '📍', '💵', '💳', '⭐', '👍', '🙏'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => insertEmoji(emoji)}
                  className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-sm shadow-2xs transition active:scale-95"
                  title={`Insertar ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pie de Acciones */}
        <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/80 rounded-b-3xl flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 transition"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              disabled={!isValidPhone || !messageText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-emerald-600/30 transition transform active:scale-98"
            >
              <Send className="w-4 h-4" />
              <span>Enviar por WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
