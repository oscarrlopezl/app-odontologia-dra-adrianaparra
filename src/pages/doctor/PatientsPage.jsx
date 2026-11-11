import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import PatientDetailView from '../../components/doctor/PatientDetailView';
import PatientFormModal from '../../components/doctor/PatientFormModal';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import WhatsAppModal from '../../components/doctor/WhatsAppModal';
import {
  Plus,
  Search,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  ChevronRight,
  ArrowLeft,
  MessageSquare,
  Sparkles,
  Clock,
  Cake,
  Filter
} from 'lucide-react';

export default function PatientsPage() {
  const { patients, activePatientId, setActivePatientId, activePatient, appointments } = useDental();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('todos'); // 'todos' | 'recall' | 'birthday' | 'alert'
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);
  const [mobileView, setMobileView] = useState('list');
  const [showQuickWhatsapp, setShowQuickWhatsapp] = useState(false);
  const [quickWhatsappPatient, setQuickWhatsappPatient] = useState(null);

  // Cálculos para filtros inteligentes
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 - 11
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  const isRecallPending = (patient) => {
    const pApts = (appointments || []).filter(
      (a) => a.patient_id === patient.id || a.patient_name === patient.full_name
    );
    if (pApts.length === 0) return true;
    const lastApt = pApts.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))[0];
    return new Date(lastApt.appointment_date) < sixMonthsAgo;
  };

  const isBirthdayThisMonth = (birthDate) => {
    if (!birthDate) return false;
    const parts = birthDate.split('-');
    if (parts.length >= 2) {
      const bMonth = parseInt(parts[1], 10) - 1;
      return bMonth === currentMonth;
    }
    return false;
  };

  // Contadores
  const recallCount = (patients || []).filter(isRecallPending).length;
  const birthdayCount = (patients || []).filter((p) => isBirthdayThisMonth(p.birth_date)).length;
  const alertCount = (patients || []).filter(
    (p) => (p.allergies?.length > 0) || (p.medical_conditions?.length > 0)
  ).length;

  // Filtrado de pacientes
  const filteredPatients = (patients || []).filter((p) => {
    const term = searchTerm.toLowerCase().trim();
    const nameMatch = p.full_name?.toLowerCase().includes(term);
    const idMatch = p.document_id?.toLowerCase().includes(term);
    const phoneMatch = p.phone?.includes(term);
    const matchesSearch = !term || nameMatch || idMatch || phoneMatch;

    if (!matchesSearch) return false;

    if (activeFilter === 'recall') return isRecallPending(p);
    if (activeFilter === 'birthday') return isBirthdayThisMonth(p.birth_date);
    if (activeFilter === 'alert') {
      return (p.allergies?.length > 0) || (p.medical_conditions?.length > 0);
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Gestión de Pacientes e Historias Clínicas"
        subtitle="Expediente digital, odontograma interactivo, evolución y galería radiográfica"
        actionButton={
          <button
            onClick={() => setShowNewPatientModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        }
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">
        {/* Columna Izquierda: Buscador y Lista de Pacientes */}
        <div className={`lg:col-span-4 space-y-3.5 sm:space-y-4 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'}`}>
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-4 shadow-2xs space-y-3">
            {/* Input de Búsqueda */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cédula o tlf..."
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Píldoras de Filtros Rápidos */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-bold">
              <button
                type="button"
                onClick={() => setActiveFilter('todos')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap ${
                  activeFilter === 'todos'
                    ? 'bg-teal-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Todos ({patients.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('recall')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'recall'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
                title="Pacientes con más de 6 meses sin consulta / Control pendiente"
              >
                <Clock className="w-3 h-3" />
                <span>Control +6m ({recallCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('birthday')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'birthday'
                    ? 'bg-purple-600 text-white shadow-2xs'
                    : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
                }`}
                title="Cumpleañeros del mes actual"
              >
                <Cake className="w-3 h-3" />
                <span>Cumple ({birthdayCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveFilter('alert')}
                className={`px-2.5 py-1 rounded-lg transition whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'alert'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100'
                }`}
                title="Pacientes con alertas médicas o alergias"
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Alertas ({alertCount})</span>
              </button>
            </div>

            <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-semibold border-t border-slate-100 pt-2">
              <span>Registrados: {patients.length}</span>
              <span>Filtrados: {filteredPatients.length}</span>
            </div>
          </div>

          {/* Lista de Tarjetas de Pacientes */}
          <div className="space-y-2 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
            {patients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No hay pacientes registrados</h4>
                <p className="text-xs text-slate-600">Tu consultorio está limpio y listo para empezar a registrar tus pacientes reales.</p>
                <button
                  onClick={() => setShowNewPatientModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Primer Paciente</span>
                </button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-600 font-semibold">No se encontraron pacientes con este filtro.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setActiveFilter('todos');
                  }}
                  className="mt-2 text-xs font-bold text-teal-700 underline"
                >
                  Restablecer filtros
                </button>
              </div>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = pat.id === activePatientId;
                const hasAlert = (pat.allergies?.length > 0) || (pat.medical_conditions?.length > 0);
                const hasRecall = isRecallPending(pat);
                const hasBirthday = isBirthdayThisMonth(pat.birth_date);

                return (
                  <div
                    key={pat.id}
                    onClick={() => {
                      setActivePatientId(pat.id);
                      setMobileView('detail');
                    }}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 overflow-hidden ${
                          isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {pat.photo_url ? (
                          <img src={pat.photo_url} alt={pat.full_name} className="w-full h-full object-cover" />
                        ) : (
                          pat.full_name?.slice(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{pat.full_name}</h4>
                          {hasAlert && (
                            <span title="Posee alerta médica">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            </span>
                          )}
                          {hasBirthday && (
                            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-md font-bold" title="¡Cumpleaños este mes!">
                              🎂 Cumple
                            </span>
                          )}
                          {hasRecall && (
                            <span className="text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md font-bold" title="Más de 6 meses sin consulta">
                              ⏱️ +6m
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                          <span>{pat.document_id}</span>
                          <span>•</span>
                          <span>{pat.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePatientId(pat.id);
                          setQuickWhatsappPatient(pat);
                          setShowQuickWhatsapp(true);
                        }}
                        className="p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 transition"
                        title="Enviar mensaje por WhatsApp a este paciente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>

                      <ChevronRight
                        className={`w-4 h-4 transition ${
                          isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-300'
                        }`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle Completo del Paciente Seleccionado */}
        <div className={`lg:col-span-8 ${mobileView === 'list' ? 'hidden lg:block' : 'block'}`}>
          {/* Botón Volver a la Lista en vista Móvil */}
          <div className="lg:hidden mb-3.5 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setMobileView('list')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-xl border border-slate-200 text-xs font-bold shadow-2xs transition active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 text-teal-600" />
              <span>← Volver a la Lista</span>
            </button>

            <button
              type="button"
              onClick={() => setShowNewPatientModal(true)}
              className="inline-flex items-center gap-1 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nuevo</span>
            </button>
          </div>

          <PatientDetailView patient={activePatient} />
        </div>
      </div>

      <PatientFormModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
      />

      {/* Modal de WhatsApp Rápido */}
      {showQuickWhatsapp && (quickWhatsappPatient || activePatient) && (
        <WhatsAppModal
          isOpen={showQuickWhatsapp}
          onClose={() => {
            setShowQuickWhatsapp(false);
            setQuickWhatsappPatient(null);
          }}
          patient={quickWhatsappPatient || activePatient}
          initialTab={
            isBirthdayThisMonth(quickWhatsappPatient?.birth_date || activePatient?.birth_date)
              ? 'libre'
              : 'cita'
          }
        />
      )}
    </div>
  );
}
