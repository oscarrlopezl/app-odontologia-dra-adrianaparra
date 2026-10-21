import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { User, Phone, Mail, IdCard, AlertTriangle, HeartPulse, X } from 'lucide-react';

export default function PatientFormModal({ isOpen, onClose, patientToEdit = null }) {
  const { addPatient, updatePatient } = useDental();

  const [formData, setFormData] = useState({
    full_name: patientToEdit?.full_name || '',
    document_id: patientToEdit?.document_id || '',
    phone: patientToEdit?.phone || '',
    email: patientToEdit?.email || '',
    birth_date: patientToEdit?.birth_date || '',
    address: patientToEdit?.address || '',
    emergency_contact_name: patientToEdit?.emergency_contact_name || '',
    emergency_contact_phone: patientToEdit?.emergency_contact_phone || '',
    medical_conditions: patientToEdit?.medical_conditions?.join(', ') || '',
    notes: patientToEdit?.notes || '',
    access_code: patientToEdit?.access_code || '',
  });

  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (!formData.full_name.trim()) errs.full_name = 'El nombre completo es obligatorio';
    if (!formData.document_id.trim()) errs.document_id = 'La cédula es requerida';
    if (!formData.phone.trim()) errs.phone = 'El teléfono es requerido';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const conditionsArray = formData.medical_conditions
      ? formData.medical_conditions.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      medical_conditions: conditionsArray,
      access_code: formData.access_code || formData.document_id.replace(/\D/g, '').slice(-4) || '1234',
    };

    if (patientToEdit) {
      updatePatient(patientToEdit.id, payload);
    } else {
      addPatient(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">
              {patientToEdit ? 'Editar Ficha de Paciente' : 'Nuevo Paciente (Apertura de Expediente)'}
            </h3>
            <p className="text-xs text-slate-700">Dra. Adriana Parra - Registro Clínico y de Contacto</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Nombre y Apellidos *
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="Ej: Carmen Elena Rodríguez"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  errors.full_name ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.full_name && <p className="text-[11px] text-rose-500 mt-1">{errors.full_name}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Cédula de Identidad *
              </label>
              <input
                type="text"
                value={formData.document_id}
                onChange={(e) => setFormData({ ...formData, document_id: e.target.value })}
                placeholder="Ej: V-18765432"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  errors.document_id ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.document_id && <p className="text-[11px] text-rose-500 mt-1">{errors.document_id}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Teléfono / WhatsApp *
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Ej: 0414-1234567"
                className={`w-full px-3.5 py-2.5 text-sm rounded-xl border ${
                  errors.phone ? 'border-rose-500 bg-rose-50' : 'border-slate-200 bg-slate-50'
                } focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500`}
              />
              {errors.phone && <p className="text-[11px] text-rose-500 mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="paciente@correo.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Fecha de Nacimiento
              </label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Código Clave Portal Paciente
              </label>
              <input
                type="text"
                value={formData.access_code}
                onChange={(e) => setFormData({ ...formData, access_code: e.target.value })}
                placeholder="Últimos 4 dígitos de cédula"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Dirección de Residencia
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ej: Urb. Malavé Villalba, Sector 2, Guacara"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Contacto de Emergencia */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Contacto de Emergencia
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                placeholder="Nombre del familiar / contacto"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <input
                type="text"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                placeholder="Teléfono del familiar"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Alertas Médicas */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Condiciones Médicas y Alergias (Separadas por coma)
            </label>
            <input
              type="text"
              value={formData.medical_conditions}
              onChange={(e) => setFormData({ ...formData, medical_conditions: e.target.value })}
              placeholder="Ej: Alergia a Penicilina, Hipertensión, Diabético, Asma"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Observaciones Clínicas / Antecedentes Odontológicos
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Notas generales para el expediente..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            ></textarea>
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
              {patientToEdit ? 'Guardar Cambios' : 'Registrar Paciente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
