import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  WifiOff,
  Wifi,
  CloudUpload,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  X,
  Database,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export default function OfflineSyncAuthorizationBanner() {
  const {
    isOnline,
    syncQueue = [],
    pendingSyncCount = 0,
    authorizeAndUploadPendingChanges,
    isSyncing,
    lastSyncTime,
  } = useDental();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [dismissedUntilNewItem, setDismissedUntilNewItem] = useState(false);

  const safeSyncQueue = Array.isArray(syncQueue) ? syncQueue : [];
  const count = Number(pendingSyncCount) || safeSyncQueue.length;

  // Si estamos online y no hay nada pendiente en cola, no estorbar
  if (isOnline && count === 0) {
    return null;
  }

  return (
    <>
      {/* BANNER SUPERIOR INFORMATIVO Y DE AUTORIZACIÓN */}
      <div className="w-full z-30 transition-all duration-300">
        {!isOnline ? (
          // ESTADO 1: TOTALMENTE SIN INTERNET / SIN SEÑAL
          <div className="bg-amber-600 text-white px-4 py-2.5 shadow-md flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-amber-700/60 flex items-center justify-center shrink-0 border border-amber-400/30">
                <WifiOff className="w-4 h-4 text-amber-200" />
              </div>
              <div className="min-w-0">
                <p className="font-bold truncate sm:text-xs">
                  Modo Sin Señal / Offline Seguro
                </p>
                <p className="text-[11px] text-amber-100/90 leading-tight">
                  No hay internet. Puedes seguir registrando pacientes, citas, historias y abonos con total normalidad; todo se guarda en este teléfono.
                  {pendingSyncCount > 0 && ` (${pendingSyncCount} cambios en espera de WiFi)`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="bg-amber-800/80 text-amber-100 font-bold px-2 py-1 rounded-md text-[10px] border border-amber-400/30">
                💾 Memoria Local Activa
              </span>
            </div>
          </div>
        ) : (
          // ESTADO 2: HAY INTERNET Y HAY CAMBIOS PENDIENTES QUE REQUIEREN AUTORIZACIÓN
          pendingSyncCount > 0 && (
            <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white px-4 py-3 shadow-lg border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                  <Wifi className="w-4 h-4 text-emerald-300 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-extrabold text-white text-xs sm:text-sm">
                      ¡Señal Disponible! Tienes {pendingSyncCount} {pendingSyncCount === 1 ? 'cambio pendiente' : 'cambios pendientes'}
                    </p>
                    <span className="bg-emerald-400 text-slate-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                      Requiere Autorización
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200/90 mt-0.5">
                    Se guardaron cambios localmente mientras estabas sin conexión. ¿Deseas subirlos ahora a la nube Supabase?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowDetailsModal(true)}
                  className="px-2.5 py-1.5 rounded-xl text-emerald-200 hover:text-white hover:bg-white/10 text-xs font-semibold transition"
                >
                  Ver Cambios
                </button>

                <button
                  type="button"
                  onClick={authorizeAndUploadPendingChanges}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-extrabold rounded-xl shadow-md shadow-emerald-500/20 transition transform active:scale-95"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Subiendo datos...' : 'Autorizar y Subir Datos'}</span>
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* MODAL PARA REVISAR LOS CAMBIOS PENDIENTES ANTES DE AUTORIZAR */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Cambios Pendientes por Subir ({pendingSyncCount})
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Guardados localmente en este dispositivo
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de cambios en cola */}
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {safeSyncQueue.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-bold text-slate-800 block truncate">
                      {item.description || `${item.action.toUpperCase()} en ${item.table}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Tabla: {item.table} • {item.timestamp ? new Date(item.timestamp).toLocaleTimeString('es-VE') : 'Reciente'}
                    </span>
                  </div>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                    Pendiente
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cerrar
              </button>

              <button
                type="button"
                disabled={isSyncing || !isOnline}
                onClick={async () => {
                  setShowDetailsModal(false);
                  await authorizeAndUploadPendingChanges();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-xs font-extrabold rounded-xl shadow-md transition"
              >
                <CloudUpload className="w-4 h-4" />
                <span>{isSyncing ? 'Subiendo...' : 'Sí, Autorizar y Subir Ahora'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
