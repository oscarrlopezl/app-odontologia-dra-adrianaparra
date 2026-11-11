import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  Database,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  X,
  Server,
  Key,
  ShieldCheck,
  Upload,
  Download,
  Copy,
  Check,
  Zap,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function SupabaseSyncDiagnosticModal({ isOpen, onClose }) {
  const {
    connectedToSupabase,
    supabaseHealth,
    checkSupabaseConnectionHealth,
    syncAllLocalToCloud,
    refreshCloudData,
    isSyncing,
    lastSyncTime,
    pendingSyncCount,
    syncQueue,
    patients,
    budgets,
    appointments,
    exportLocalBackup,
    importFromBackupData,
    showToast,
    saveCustomSupabaseConfig,
    resetCustomSupabaseConfig,
    activeSupabaseConfig,
  } = useDental();

  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showConfigFields, setShowConfigFields] = useState(false);
  const [customUrl, setCustomUrl] = useState(activeSupabaseConfig?.url || '');
  const [customKey, setCustomKey] = useState(activeSupabaseConfig?.key || '');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [isPushingAll, setIsPushingAll] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportArea, setShowImportArea] = useState(false);

  if (!isOpen) return null;

  const handleRunTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await checkSupabaseConnectionHealth(customUrl || null, customKey || null);
      setTestResult(res);
      if (res.success) {
        showToast('¡Conexión con Supabase verificada con éxito!', 'success');
      } else {
        showToast(res.message || 'Fallo de conexión con Supabase', 'warning');
      }
    } catch (err) {
      setTestResult({
        success: false,
        status: 'ERROR',
        message: err.message || 'Error al probar conexión',
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveCredentials = () => {
    if (!customUrl.trim() || !customKey.trim()) {
      showToast('Por favor introduce la URL y la Clave de Supabase', 'error');
      return;
    }
    saveCustomSupabaseConfig(customUrl.trim(), customKey.trim());
    showToast('Credenciales de Supabase actualizadas.', 'success');
    handleRunTest();
  };

  const handleResetDefaults = () => {
    resetCustomSupabaseConfig();
    setCustomUrl(activeSupabaseConfig?.defaultUrl || '');
    setCustomKey(activeSupabaseConfig?.defaultKey || '');
    showToast('Valores por defecto restablecidos.', 'info');
    handleRunTest();
  };

  const handleSyncAll = async () => {
    setIsPushingAll(true);
    try {
      await syncAllLocalToCloud();
      showToast('Todas las fichas locales se enviaron a la nube.', 'success');
    } catch (err) {
      showToast(`Error al sincronizar: ${err.message}`, 'error');
    } finally {
      setIsPushingAll(false);
    }
  };

  const handleImportJson = () => {
    if (!importText.trim()) {
      showToast('Pega el contenido JSON del respaldo para importar', 'warning');
      return;
    }
    try {
      const parsed = JSON.parse(importText);
      const res = importFromBackupData(parsed);
      if (res.success) {
        showToast(`¡Importación exitosa! ${res.patientsCount || 0} pacientes fusionados.`, 'success');
        setImportText('');
        setShowImportArea(false);
      } else {
        showToast(res.error || 'Formato de respaldo no válido', 'error');
      }
    } catch {
      showToast('El texto ingresado no es un JSON válido', 'error');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        const res = importFromBackupData(parsed);
        if (res.success) {
          showToast(`¡Archivo importado! ${res.patientsCount || 0} pacientes fusionados.`, 'success');
        } else {
          showToast(res.error || 'Archivo de respaldo no compatible', 'error');
        }
      } catch {
        showToast('Error al leer el archivo JSON', 'error');
      }
    };
    reader.readAsText(file);
  };

  const isPaused =
    supabaseHealth?.status === 'PAUSED_OR_NXDOMAIN' ||
    testResult?.status === 'PAUSED_OR_NXDOMAIN';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera del Modal */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${connectedToSupabase ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'}`}>
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                Diagnóstico de Sincronización Multi-Dispositivo
              </h3>
              <p className="text-[11px] text-teal-300 font-medium">
                Conexión en la Nube (Supabase) • Teléfono 📱 &amp; PC 💻
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Modal con Scroll */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* 1. Tarjeta de Estado Actual */}
          <div
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              connectedToSupabase
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                : 'bg-amber-50/90 border-amber-300 text-amber-950'
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">
                  {connectedToSupabase ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm sm:text-base">
                    {connectedToSupabase
                      ? 'Nube de Supabase Activa y Sincronizada'
                      : 'La Nube está Desconectada o Pausada'}
                  </h4>
                  <p className="text-xs mt-1 text-slate-700 leading-relaxed">
                    {connectedToSupabase
                      ? 'Todos los datos ingresados en este dispositivo se reflejan en tiempo real en los demás equipos donde abras la aplicación.'
                      : 'Tus registros se encuentran seguros en la memoria de este equipo, pero NO se están sincronizando con tus otros dispositivos hasta que se reactive la conexión con Supabase.'}
                  </p>
                  {supabaseHealth?.message && (
                    <div className="mt-2 text-[11px] font-mono bg-white/80 p-2 rounded-xl border border-slate-200/80 text-slate-800">
                      <strong>Diagnóstico:</strong> {supabaseHealth.message}
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleRunTest}
                disabled={isTesting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-xl text-xs font-bold shadow-2xs transition active:scale-95 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-teal-600 ${isTesting ? 'animate-spin' : ''}`} />
                <span>{isTesting ? 'Comprobando...' : 'Probar Conexión'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold border ${testResult.success ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* 2. Alerta y Solución Si el Proyecto está Pausado */}
          {!connectedToSupabase && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 text-white border border-indigo-800/50 shadow-md space-y-3">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-extrabold uppercase tracking-wider">
                <Zap className="w-4 h-4 text-amber-400" />
                <span>¿Por qué no sincroniza y cómo resolverlo en 1 minuto?</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                Supabase pausa automáticamente los proyectos gratuitos tras 7 días sin actividad por ahorro de recursos. Cuando se pausa, el dominio deja de responder (<code className="text-amber-300 font-mono">NXDOMAIN</code>).
              </p>
              <div className="bg-white/10 p-3.5 rounded-xl border border-white/10 space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <span className="bg-teal-500 text-slate-950 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">1</span>
                  <span>Inicia sesión en tu panel de Supabase:</span>
                </div>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold rounded-xl text-xs transition shadow-md shadow-emerald-500/20 ml-7"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir Panel de Supabase (Reanudar Proyecto)</span>
                </a>
                <div className="flex items-start gap-2 pt-1">
                  <span className="bg-teal-500 text-slate-950 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">2</span>
                  <span>Ubica tu proyecto y presiona el botón verde <strong>"Restore project" / "Resume"</strong>. En 1 minuto vuelve a quedar en línea.</span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <span className="bg-teal-500 text-slate-950 font-extrabold w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px]">3</span>
                  <span>Vuelve a esta ventana y presiona <strong>"Probar Conexión"</strong>. ¡Tus dispositivos se sincronizarán al instante!</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Resumen de Registros en Este Dispositivo */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Pacientes</span>
              <span className="text-lg font-extrabold text-slate-800">{patients?.length || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Presupuestos</span>
              <span className="text-lg font-extrabold text-slate-800">{budgets?.length || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Citas en Agenda</span>
              <span className="text-lg font-extrabold text-slate-800">{appointments?.length || 0}</span>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <span className="block text-[10px] text-slate-500 font-bold uppercase">Pendientes Subir</span>
              <span className={`text-lg font-extrabold ${pendingSyncCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {pendingSyncCount}
              </span>
            </div>
          </div>

          {/* 4. Solución Alternativa Inmediata: Transferencia Directa Teléfono <-> PC (Sin Internet / Sin Nube) */}
          <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-extrabold text-xs sm:text-sm text-slate-800 flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-teal-600" />
                  <span>Transferencia Directa entre Dispositivos (Respaldo Manual)</span>
                </h5>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  ¿Necesitas tus pacientes de la PC en tu teléfono de inmediato sin esperar por Supabase?
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={exportLocalBackup}
                className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition"
                title="Descargar copia de seguridad con todas tus fichas"
              >
                <Download className="w-3.5 h-3.5 text-teal-600" />
                <span>1. Descargar Fichas (PC / Teléfono)</span>
              </button>

              <label className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md shadow-teal-600/20 transition cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>2. Importar Archivo en el otro equipo</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => setShowImportArea(!showImportArea)}
                className="px-2.5 py-2 text-slate-600 hover:text-slate-900 text-xs font-semibold rounded-xl"
              >
                {showImportArea ? 'Ocultar texto' : 'Pegar texto directo'}
              </button>
            </div>

            {showImportArea && (
              <div className="pt-2 space-y-2">
                <textarea
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  placeholder="Pega aquí el contenido JSON de tu respaldo..."
                  className="w-full h-24 p-2.5 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 outline-hidden"
                ></textarea>
                <button
                  onClick={handleImportJson}
                  className="px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl"
                >
                  Procesar y Fusionar Fichas
                </button>
              </div>
            )}
          </div>

          {/* 5. Configuración Avanzada de URL y Clave Supabase */}
          <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/60 space-y-3">
            <button
              onClick={() => setShowConfigFields(!showConfigFields)}
              className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900"
            >
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Configurar Nueva URL o Claves de Supabase (Avanzado)</span>
              </span>
              <span className="text-[11px] text-teal-600">
                {showConfigFields ? 'Ocultar campos' : 'Ver campos'}
              </span>
            </button>

            {showConfigFields && (
              <div className="space-y-3 pt-2 text-xs border-t border-slate-200">
                <p className="text-[11px] text-slate-500">
                  Si creaste un proyecto nuevo en Supabase o cambiaste de cuenta, puedes ingresar aquí la nueva URL y Clave Anon para que este equipo se conecte de inmediato:
                </p>
                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    URL de Supabase (Project URL):
                  </label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://tu-proyecto.supabase.co"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 text-[11px]">
                    Clave API (Anon Key o Service Role):
                  </label>
                  <input
                    type="password"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500 outline-hidden"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleSaveCredentials}
                    className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    Guardar y Conectar
                  </button>
                  <button
                    onClick={handleResetDefaults}
                    className="px-3 py-1.5 text-slate-600 hover:text-slate-900 text-xs font-medium"
                  >
                    Restablecer Oficiales
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pie del Modal con Acciones Rápidas */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="text-[11px] text-slate-500">
            Última sync: <strong>{lastSyncTime || 'Sin sincronizar aún'}</strong>
          </div>

          <div className="flex items-center gap-2">
            {connectedToSupabase && (
              <button
                onClick={handleSyncAll}
                disabled={isPushingAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs"
                title="Subir todas las fichas de este equipo a la nube Supabase"
              >
                <Upload className={`w-3.5 h-3.5 ${isPushingAll ? 'animate-bounce' : ''}`} />
                <span>{isPushingAll ? 'Subiendo...' : 'Subir Todo a la Nube'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
