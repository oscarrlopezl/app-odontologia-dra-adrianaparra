import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import { 
  Settings, 
  Mail, 
  Phone, 
  MapPin, 
  DollarSign, 
  ShieldCheck, 
  Sparkles, 
  Save, 
  Database,
  ExternalLink,
  Plus
} from 'lucide-react';

export default function ClinicSettingsPage() {
  const { settings, updateSettings, promotions, addPromotion, connectedToSupabase } = useDental();

  const [formSettings, setFormSettings] = useState({
    doctor_name: settings?.doctor_name || 'Dra. Adriana Parra',
    doctor_specialty: settings?.doctor_specialty || 'Odontólogo General y Estética Dental',
    doctor_email: settings?.doctor_email || 'dra.adrianaparra@gmail.com',
    clinic_name: settings?.clinic_name || 'Centro Odontológico Especializado Dra. Adriana Parra',
    phone: settings?.phone || '+58 412-1234567',
    address: settings?.address || 'Guacara / Yagua, Edo. Carabobo',
    usd_exchange_rate: settings?.usd_exchange_rate || 40.0,
    schedule: settings?.schedule || 'Lunes a Sábado: 8:00 AM - 5:00 PM',
  });

  const [newPromo, setNewPromo] = useState({
    title: '',
    description: '',
    discount_tag: 'Promoción Especial',
  });

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings({
      ...formSettings,
      usd_exchange_rate: Number(formSettings.usd_exchange_rate),
    });
  };

  const handleAddPromotion = (e) => {
    e.preventDefault();
    if (!newPromo.title.trim() || !newPromo.description.trim()) return;

    addPromotion({
      ...newPromo,
      is_active: true,
    });

    setNewPromo({ title: '', description: '', discount_tag: 'Promoción Especial' });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Ajustes del Consultorio y Configuración"
        subtitle="Datos de contacto de la Dra. Adriana Parra, tasa oficial del día y promociones para pacientes"
      />

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-5xl w-full mx-auto">
        {/* Banner de Supabase & Cuenta de la Doctora */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 rounded-3xl p-6 text-white border border-teal-800/40 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-teal-400" />
                <h3 className="font-extrabold text-lg">Infraestructura y Datos en Supabase</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    connectedToSupabase
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {connectedToSupabase ? 'En línea con Supabase' : 'Modo Demostración / Local'}
                </span>
              </div>
              <p className="text-xs text-slate-300 max-w-xl">
                Todo el almacenamiento en la nube, imágenes y base de datos queda asignado al correo de la Dra. Adriana Parra (<strong>{formSettings.doctor_email}</strong>). El código fuente queda 100% tuyo en tu repositorio de GitHub.
              </p>
            </div>

            <div className="bg-white/10 p-3 rounded-2xl border border-white/10 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo Titular:</span>
              <span className="font-mono text-teal-300 font-bold">{formSettings.doctor_email}</span>
            </div>
          </div>
        </div>

        {/* Formulario de Datos del Consultorio */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs">
          <h4 className="font-extrabold text-slate-800 text-base mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-teal-600" />
            <span>Perfil Profesional y Finanzas</span>
          </h4>

          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nombre del Profesional *
                </label>
                <input
                  type="text"
                  value={formSettings.doctor_name}
                  onChange={(e) => setFormSettings({ ...formSettings, doctor_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Especialidad / Título
                </label>
                <input
                  type="text"
                  value={formSettings.doctor_specialty}
                  onChange={(e) => setFormSettings({ ...formSettings, doctor_specialty: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Correo Electrónico de la Doctora (Supabase) *
                </label>
                <input
                  type="email"
                  value={formSettings.doctor_email}
                  onChange={(e) => setFormSettings({ ...formSettings, doctor_email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Teléfono / WhatsApp de Atención *
                </label>
                <input
                  type="text"
                  value={formSettings.phone}
                  onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-teal-800 uppercase tracking-wider block mb-1">
                  Tasa de Cambio Oficial (1 USD = Bs) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={formSettings.usd_exchange_rate}
                    onChange={(e) => setFormSettings({ ...formSettings, usd_exchange_rate: e.target.value })}
                    className="w-full pl-9 pr-4 py-2.5 text-sm font-extrabold text-teal-900 rounded-xl border border-teal-300 bg-teal-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Nombre Comercial del Consultorio
                </label>
                <input
                  type="text"
                  value={formSettings.clinic_name}
                  onChange={(e) => setFormSettings({ ...formSettings, clinic_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Dirección Física del Consultorio
              </label>
              <input
                type="text"
                value={formSettings.address}
                onChange={(e) => setFormSettings({ ...formSettings, address: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>
            </div>
          </form>
        </div>

        {/* Sección de Promociones para el Portal del Paciente */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>Promociones Activas en el Portal del Paciente</span>
              </h4>
              <p className="text-xs text-slate-700">Estas promociones las ven los pacientes desde su teléfono móvil.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {promotions.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-teal-50/50 border border-teal-200">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-teal-900 text-sm">{p.title}</h5>
                  <span className="bg-teal-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {p.discount_tag}
                  </span>
                </div>
                <p className="text-xs text-slate-700 mt-2">{p.description}</p>
              </div>
            ))}
          </div>

          {/* Formulario rápido para añadir nueva promo */}
          <form onSubmit={handleAddPromotion} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 mt-4">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Publicar Nueva Promoción
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newPromo.title}
                onChange={(e) => setNewPromo({ ...newPromo, title: e.target.value })}
                placeholder="Título de la promoción"
                className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                required
              />
              <input
                type="text"
                value={newPromo.discount_tag}
                onChange={(e) => setNewPromo({ ...newPromo, discount_tag: e.target.value })}
                placeholder="Etiqueta (ej: 20% OFF)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
                required
              />
            </div>
            <textarea
              rows={2}
              value={newPromo.description}
              onChange={(e) => setNewPromo({ ...newPromo, description: e.target.value })}
              placeholder="Descripción del beneficio o tratamiento en oferta..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white"
              required
            ></textarea>

            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 text-white font-bold text-xs rounded-xl hover:bg-teal-700 transition"
            >
              Publicar Promoción
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
