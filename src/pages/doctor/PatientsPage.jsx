import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import PatientDetailView from '../../components/doctor/PatientDetailView';
import PatientFormModal from '../../components/doctor/PatientFormModal';
import { Search, Plus, User, Phone, AlertTriangle, ChevronRight } from 'lucide-react';

export default function PatientsPage() {
  const { patients, activePatientId, setActivePatientId, activePatient } = useDental();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewPatientModal, setShowNewPatientModal] = useState(false);

  const filteredPatients = patients.filter((p) => {
    const term = searchTerm.toLowerCase();
    const nameMatch = p.full_name?.toLowerCase().includes(term);
    const idMatch = p.document_id?.toLowerCase().includes(term);
    const phoneMatch = p.phone?.includes(term);
    return nameMatch || idMatch || phoneMatch;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Gestión de Pacientes e Historias Clínicas"
        subtitle="Expediente digital, odontograma interactivo, evolución y galería radiográfica"
        actionButton={
          <button
            onClick={() => setShowNewPatientModal(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        }
      />

      <div className="flex-1 p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Buscador y Lista de Pacientes (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-700" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, cédula o tlf..."
                className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-between mt-3 px-1 text-[11px] text-slate-700 font-semibold">
              <span>Registrados: {patients.length} pacientes</span>
              <span>Filtrados: {filteredPatients.length}</span>
            </div>
          </div>

          {/* Lista de Tarjetas de Pacientes */}
          <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
            {patients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-3xl border border-dashed border-slate-300 space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800">No hay pacientes registrados</h4>
                <p className="text-xs text-slate-700">Tu consultorio está limpio y listo para empezar a registrar tus pacientes reales.</p>
                <button
                  onClick={() => setShowNewPatientModal(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Registrar Primer Paciente</span>
                </button>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-700">No se encontraron pacientes con esa búsqueda.</p>
              </div>
            ) : (
              filteredPatients.map((pat) => {
                const isSelected = pat.id === activePatientId;
                const hasAlert = pat.medical_conditions?.length > 0;

                return (
                  <div
                    key={pat.id}
                    onClick={() => setActivePatientId(pat.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
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
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-800 truncate">{pat.full_name}</h4>
                          {hasAlert && (
                            <span title="Posee alerta médica">
                              <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-700 mt-0.5 font-mono">
                          <span>{pat.document_id}</span>
                          <span>•</span>
                          <span>{pat.phone}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition ${
                        isSelected ? 'text-teal-600 translate-x-0.5' : 'text-slate-300'
                      }`}
                    />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Columna Derecha: Detalle Completo del Paciente Seleccionado (8 cols) */}
        <div className="lg:col-span-8">
          <PatientDetailView patient={activePatient} />
        </div>
      </div>

      <PatientFormModal
        isOpen={showNewPatientModal}
        onClose={() => setShowNewPatientModal(false)}
      />
    </div>
  );
}
