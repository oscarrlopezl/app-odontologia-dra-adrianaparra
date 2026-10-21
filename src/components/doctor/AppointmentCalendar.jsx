import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Phone, 
  Plus, 
  CheckCircle, 
  PlayCircle, 
  XCircle, 
  Sparkles,
  Filter,
  X
} from 'lucide-react';

const TREATMENT_DURATIONS = [
  { name: 'Consulta General / Diagnóstico', defaultDuration: 30, color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { name: 'Limpieza / Profilaxis Ultrasónica', defaultDuration: 30, color: 'bg-emerald-100 text-emerald-800 border-emerald-300' },
  { name: 'Resina / Restauración Estética', defaultDuration: 45, color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { name: 'Endodoncia (Tratamiento de Conducto)', defaultDuration: 90, color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { name: 'Exodoncia / Cirugía de Cordales', defaultDuration: 60, color: 'bg-rose-100 text-rose-800 border-rose-300' },
  { name: 'Prótesis / Impresión Definitiva', defaultDuration: 45, color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { name: 'Blanqueamiento Dental LED', defaultDuration: 45, color: 'bg-teal-100 text-teal-800 border-teal-300' },
  { name: 'Control / Retiro de Puntos', defaultDuration: 20, color: 'bg-slate-100 text-slate-800 border-slate-300' },
];

export default function AppointmentCalendar() {
  const { appointments, addAppointment, updateAppointmentStatus, patients } = useDental();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('todos');
  const [showNewAptModal, setShowNewAptModal] = useState(false);

  // Formulario de nueva cita
  const [formData, setFormData] = useState({
    patient_id: '',
    patient_name: '',
    patient_phone: '',
    appointment_date: new Date().toISOString().split('T')[0],
    start_time: '09:00',
    duration_minutes: 30,
    treatment_type: TREATMENT_DURATIONS[0].name,
    notes: '',
  });

  const filteredAppointments = appointments.filter((apt) => {
    const matchesDate = apt.appointment_date === selectedDate;
    const matchesStatus = statusFilter === 'todos' || apt.status === statusFilter;
    return matchesDate && matchesStatus;
  }).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const handlePatientSelect = (patId) => {
    if (!patId) {
      setFormData({ ...formData, patient_id: '', patient_name: '', patient_phone: '' });
      return;
    }
    const found = patients.find((p) => p.id === patId);
    if (found) {
      setFormData({
        ...formData,
        patient_id: found.id,
        patient_name: found.full_name,
        patient_phone: found.phone,
      });
    }
  };

  const handleTreatmentChange = (treatmentName) => {
    const found = TREATMENT_DURATIONS.find((t) => t.name === treatmentName);
    setFormData({
      ...formData,
      treatment_type: treatmentName,
      duration_minutes: found ? found.defaultDuration : 30,
    });
  };

  const handleCreateAppointment = (e) => {
    e.preventDefault();
    if (!formData.patient_name.trim() || !formData.patient_phone.trim()) return;

    addAppointment({
      ...formData,
      status: 'programada',
      is_online_request: false,
    });

    setShowNewAptModal(false);
  };

  const getStatusBadge = (status) => {
    const badges = {
      programada: { label: 'Programada', class: 'bg-slate-100 text-slate-700' },
      confirmada: { label: 'Confirmada', class: 'bg-blue-100 text-blue-800' },
      en_espera: { label: 'En Sala de Espera', class: 'bg-amber-100 text-amber-800' },
      en_sillon: { label: 'En Sillón Dental 🪑', class: 'bg-emerald-100 text-emerald-800 font-extrabold' },
      completada: { label: 'Completada', class: 'bg-teal-100 text-teal-800' },
      cancelada: { label: 'Cancelada', class: 'bg-rose-100 text-rose-800' },
    };
    const b = badges[status] || badges.programada;
    return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${b.class}`}>{b.label}</span>;
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtros y Controles de la Agenda */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <CalendarIcon className="w-4 h-4 text-teal-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {['todos', 'programada', 'confirmada', 'en_sillon', 'completada'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg capitalize transition ${
                  statusFilter === st ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {st.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowNewAptModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      {/* Lista / Timeline de Citas */}
      <div className="space-y-3">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
            <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="font-bold text-slate-700 text-sm">No hay citas para este día</h4>
            <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
              Puedes agendar una cita seleccionando el paciente y la duración del tratamiento.
            </p>
            <button
              onClick={() => setShowNewAptModal(true)}
              className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 hover:bg-teal-100 transition"
            >
              Agendar Cita Ahora
            </button>
          </div>
        ) : (
          filteredAppointments.map((apt) => {
            const treatmentConfig = TREATMENT_DURATIONS.find((t) => t.name === apt.treatment_type);

            return (
              <div
                key={apt.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 hover:border-teal-300 transition-all shadow-2xs flex flex-wrap items-center justify-between gap-4"
              >
                {/* Horario y Duración */}
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex flex-col items-center justify-center shrink-0">
                    <span className="text-sm font-extrabold text-teal-900">{apt.start_time}</span>
                    <span className="text-[10px] font-bold text-teal-600 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {apt.duration_minutes}m
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-sm">{apt.patient_name}</h4>
                      {getStatusBadge(apt.status)}
                      {apt.is_online_request && (
                        <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" /> Web
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-700">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-700" /> {apt.patient_phone}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="font-semibold text-teal-700">{apt.treatment_type}</span>
                    </div>

                    {apt.notes && <p className="text-[11px] text-slate-700 mt-1 italic">"{apt.notes}"</p>}
                  </div>
                </div>

                {/* Acciones de Estado del Sillón */}
                <div className="flex items-center gap-2">
                  {apt.status === 'programada' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'confirmada')}
                      className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-xs font-bold hover:bg-blue-100 transition"
                    >
                      Confirmar Cita
                    </button>
                  )}

                  {apt.status !== 'en_sillon' && apt.status !== 'completada' && apt.status !== 'cancelada' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'en_sillon')}
                      className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-extrabold hover:bg-emerald-100 transition flex items-center gap-1.5"
                    >
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Pasar a Sillón</span>
                    </button>
                  )}

                  {apt.status === 'en_sillon' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'completada')}
                      className="px-3 py-1.5 rounded-xl border border-teal-300 bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Tratamiento Finalizado</span>
                    </button>
                  )}

                  {apt.status !== 'cancelada' && apt.status !== 'completada' && (
                    <button
                      onClick={() => updateAppointmentStatus(apt.id, 'cancelada')}
                      className="p-1.5 text-slate-600 hover:text-rose-600 rounded-lg"
                      title="Cancelar Cita"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal para Crear Cita */}
      {showNewAptModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Agendar Cita Odontológica</h3>
                <p className="text-xs text-slate-700">Dra. Adriana Parra - Control de Tiempos de Sillón</p>
              </div>
              <button onClick={() => setShowNewAptModal(false)} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Seleccionar Paciente Registrado
                </label>
                <select
                  value={formData.patient_id}
                  onChange={(e) => handlePatientSelect(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">-- Paciente Nuevo / No Registrado --</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({p.document_id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Nombre del Paciente *
                  </label>
                  <input
                    type="text"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="text"
                    value={formData.patient_phone}
                    onChange={(e) => setFormData({ ...formData, patient_phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Tipo de Tratamiento (Asigna duración automática)
                </label>
                <select
                  value={formData.treatment_type}
                  onChange={(e) => handleTreatmentChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {TREATMENT_DURATIONS.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} ({t.defaultDuration} min)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={formData.appointment_date}
                    onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                    Duración (min) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="10"
                    value={formData.duration_minutes}
                    onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Notas de la Cita
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Instrucciones previas, materiales a preparar..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewAptModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition"
                >
                  Confirmar y Guardar Cita
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
