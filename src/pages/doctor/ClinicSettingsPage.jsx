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
  Plus,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  X,
  KeyRound
} from 'lucide-react';

export default function ClinicSettingsPage() {
  const { 
    settings, 
    updateSettings, 
    promotions, 
    addPromotion, 
    connectedToSupabase, 
    showToast,
    bcvInfo,
    isUpdatingBcv,
    syncBcvRate,
    clearAllDemoData
  } = useDental();

  const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [formSettings, setFormSettings] = useState({
    doctor_name: settings?.doctor_name || 'Dra. Adriana Parra',
    doctor_specialty: settings?.doctor_specialty || 'Odontólogo General y Estética Dental',
    doctor_email: settings?.doctor_email || 'dra.adrianaparra@gmail.com',
    clinic_name: settings?.clinic_name || 'Centro Odontológico Especializado Dra. Adriana Parra',
    phone: settings?.phone || '+58 412-1234567',
    whatsapp_phone: settings?.whatsapp_phone || settings?.phone || '+58 412-1234567',
    doctor_pin: settings?.doctor_pin || '1234',
    address: settings?.address || 'Guacara / Yagua, Edo. Carabobo',
    usd_exchange_rate: settings?.usd_exchange_rate || 883.40,
    schedule: settings?.schedule || 'Lunes a Sábado: 8:00 AM - 5:00 PM',
    logo_url: settings?.logo_url || '',
    pago_movil_banco: settings?.pago_movil_banco || 'Banesco',
    pago_movil_telefono: settings?.pago_movil_telefono || settings?.whatsapp_phone || '+58 412-1234567',
    pago_movil_cedula: settings?.pago_movil_cedula || 'V-12345678',
    zelle_email: settings?.zelle_email || '',
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

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('Por favor selecciona una imagen válida (PNG, JPG, SVG)', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const logoDataUrl = reader.result;
        setFormSettings((prev) => ({ ...prev, logo_url: logoDataUrl }));
        updateSettings({ logo_url: logoDataUrl });
        showToast('¡Logo de la Dra. Adriana Parra cargado exitosamente!');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setFormSettings((prev) => ({ ...prev, logo_url: '' }));
    updateSettings({ logo_url: '' });
    showToast('Logo removido. Se usará el ícono dental estándar.');
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
        subtitle="Datos de contacto de la Dra. Adriana Parra, logotipo, tasa del día y promociones"
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

        {/* GESTIÓN DEL LOGOTIPO DE LA DOCTORA */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <span>Logotipo Oficial del Consultorio</span>
              </h4>
              <p className="text-xs text-slate-700 mt-0.5">
                Este logo se mostrará en el menú lateral, en el portal del paciente y en los récipes médicos impresos.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {/* Visualizador del Logo actual */}
            <div className="w-24 h-24 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center overflow-hidden shrink-0">
              {formSettings.logo_url ? (
                <img
                  src={formSettings.logo_url}
                  alt="Logo Doctora"
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <div className="text-center p-2">
                  <span className="text-3xl block">🦷</span>
                  <span className="text-[9px] text-slate-600 font-semibold block mt-1">Sin logo</span>
                </div>
              )}
            </div>

            {/* Controles de Carga */}
            <div className="flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 cursor-pointer transition">
                  <Upload className="w-4 h-4" />
                  <span>{formSettings.logo_url ? 'Cambiar Logotipo' : 'Subir Logotipo de la Doctora'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>

                {formSettings.logo_url && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold border border-rose-200 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-slate-700">
                Formato recomendado: PNG transparente o JPG (máximo 2MB). Cuando lo tengas, dale al botón verde y se actualiza al instante.
              </p>
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
                  Teléfono Fijo / Consultorio
                </label>
                <input
                  type="text"
                  value={formSettings.phone}
                  onChange={(e) => setFormSettings({ ...formSettings, phone: e.target.value })}
                  placeholder="Ej: 0245-1234567"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  WhatsApp Oficial de la Doctora *
                </label>
                <input
                  type="text"
                  value={formSettings.whatsapp_phone}
                  onChange={(e) => setFormSettings({ ...formSettings, whatsapp_phone: e.target.value })}
                  placeholder="Ej: +58 412 1234567 o 04121234567"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-emerald-300 bg-emerald-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-950"
                  required
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-[10px] text-slate-700">Enlace directo para pacientes en el portal.</p>
                  {formSettings.whatsapp_phone && (
                    <a
                      href={`https://wa.me/${formSettings.whatsapp_phone.replace(/\D/g, '')}?text=Hola%20Dra.%20Adriana%2C%20le%20escribo%20desde%20su%20portal%20odontol%C3%B3gico`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Probar enlace WhatsApp</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Clave / PIN de Acceso al Panel de la Doctora *
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={formSettings.doctor_pin}
                    onChange={(e) => setFormSettings({ ...formSettings, doctor_pin: e.target.value })}
                    placeholder="Ej: 1234"
                    className="w-full pl-9 pr-4 py-2.5 text-xs font-mono font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-700 mt-1">
                  Protege tu panel clínico en cualquier teléfono o PC.
                </p>
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
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[11px] text-slate-700">
                    Fuente: {bcvInfo?.source || 'BCV Oficial'}
                  </span>
                  <button
                    type="button"
                    onClick={async () => {
                      await syncBcvRate(true);
                      if (bcvInfo?.rate) {
                        setFormSettings((prev) => ({ ...prev, usd_exchange_rate: bcvInfo.rate }));
                      }
                    }}
                    disabled={isUpdatingBcv}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal-100 hover:bg-teal-200 text-teal-900 rounded-lg text-[11px] font-bold transition border border-teal-300"
                  >
                    <RefreshCw className={`w-3 h-3 ${isUpdatingBcv ? 'animate-spin' : ''}`} />
                    <span>Actualizar con BCV</span>
                  </button>
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

            {/* Datos para Pago Móvil / WhatsApp */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Datos Bancarios y Pago Móvil (Se incluyen automáticamente al enviar presupuestos por WhatsApp)</span>
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Banco de Pago Móvil
                  </label>
                  <input
                    type="text"
                    value={formSettings.pago_movil_banco || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, pago_movil_banco: e.target.value })}
                    placeholder="Ej: Banesco / Banco de Venezuela"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Teléfono Pago Móvil
                  </label>
                  <input
                    type="text"
                    value={formSettings.pago_movil_telefono || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, pago_movil_telefono: e.target.value })}
                    placeholder="Ej: 0412-1234567"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    Cédula / RIF del Titular
                  </label>
                  <input
                    type="text"
                    value={formSettings.pago_movil_cedula || ''}
                    onChange={(e) => setFormSettings({ ...formSettings, pago_movil_cedula: e.target.value })}
                    placeholder="Ej: V-12345678"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
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

        {/* Zona de Gestión y Puesta en Marcha (Empezar desde Cero) */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-rose-200/90 shadow-2xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="max-w-xl">
              <h4 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <span>Base de Datos: Iniciar Consultorio en Blanco</span>
              </h4>
              <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                ¿Ya probaste la aplicación y deseas comenzar con tus pacientes reales?
                Este botón vacía todos los pacientes, presupuestos, pagos y citas de prueba tanto de la memoria local como de la nube Supabase.
                Tu configuración, logo oficial, WhatsApp y tasa de cambio se mantendrán intactos.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowClearConfirmModal(true)}
              className="inline-flex items-center gap-2 px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-2xl text-xs font-bold transition shadow-2xs hover:shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Vaciar Pacientes de Prueba y Empezar en Blanco</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmación para Vaciar Pacientes de Prueba */}
      {showClearConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="text-lg font-extrabold text-slate-900">
                ¿Vaciar datos de prueba y empezar desde cero?
              </h3>
              <p className="text-xs text-slate-700 leading-relaxed">
                Se eliminarán los pacientes ficticios (Carlos Méndez, Valentina Rivas, etc.), sus odontogramas e historiales de muestra. 
                <br /><br />
                Tu consultorio quedará completamente en blanco y listo para ingresar tus pacientes reales.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowClearConfirmModal(false)}
                disabled={isClearing}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={async () => {
                  setIsClearing(true);
                  await clearAllDemoData();
                  setIsClearing(false);
                  setShowClearConfirmModal(false);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-rose-600/20 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Vaciando...' : 'Sí, vaciar y empezar'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
