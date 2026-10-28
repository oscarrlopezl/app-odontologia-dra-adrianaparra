import React from 'react';
import { useDental } from '../../context/DentalContext';
import { 
  DollarSign, 
  Clock, 
  Wifi, 
  WifiOff, 
  Cloud, 
  RefreshCw, 
  HardDrive, 
  Download,
  ShieldCheck,
  Database
} from 'lucide-react';

export default function DoctorHeader({ title, subtitle, actionButton }) {
  const { 
    settings, 
    isSyncing, 
    isOnline, 
    pendingSyncCount, 
    syncPendingQueue, 
    lastSyncTime,
    exportLocalBackup,
    bcvInfo,
    isUpdatingBcv,
    syncBcvRate,
    refreshCloudData,
  } = useDental();

  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const today = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-4 py-3.5 sm:px-8 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-base sm:text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* INDICADOR DOBLE GUARDADO (A PRUEBA DE APAGONES Y CAÍDAS DE WIFI) */}
          <div className="flex items-center gap-2">
            {isOnline ? (
              pendingSyncCount > 0 ? (
                <button
                  onClick={syncPendingQueue}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs"
                  title="Haz clic para subir los datos pendientes a la nube"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-amber-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{pendingSyncCount} pendientes</span>
                  <span className="bg-amber-200 text-amber-900 text-[10px] px-1.5 py-0.2 rounded-full font-extrabold">
                    Subir a Nube
                  </span>
                </button>
              ) : (
                <button
                  onClick={refreshCloudData}
                  disabled={isSyncing}
                  className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 px-3 py-1.5 rounded-xl text-xs font-semibold shadow-2xs transition active:scale-95"
                  title={`Guardado doble activo (Memoria PC + Nube Supabase). Última sync: ${lastSyncTime || 'Al día'}. Haz clic para refrescar datos de la nube.`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <Database className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>Doble Guardado: PC + Nube</span>
                </button>
              )
            ) : (
              <div
                className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs"
                title="Sin internet. Tus datos están 100% a salvo en el disco duro de la PC. Se subirán al volver la luz/wifi."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Modo Local Seguro (Sin Wifi)</span>
              </div>
            )}

            {/* Botón para Descargar Respaldo JSON en 1 Clic */}
            <button
              onClick={exportLocalBackup}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition border border-slate-200"
              title="Descargar copia de seguridad completa (.JSON) a tu disco duro o pendrive"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Copia Pendrive</span>
            </button>
          </div>

          {/* Tasa Oficial BCV USD / Bs Automática */}
          <div 
            className="flex items-center gap-2 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200/80 px-3 py-1.5 rounded-xl shadow-2xs"
            title={`Fuente: ${bcvInfo?.source || 'BCV Oficial'} | Fecha: ${bcvInfo?.date || 'Hoy'}. Sincronización automática activa cada 30 min.`}
          >
            <span className="text-sm select-none">🇻🇪</span>
            <div className="text-xs">
              <span className="text-slate-600 font-medium">Tasa BCV: </span>
              <span className="font-extrabold text-teal-950">1 USD = {exchangeRate.toFixed(2)} Bs</span>
            </div>

            <button
              onClick={() => syncBcvRate(true)}
              disabled={isUpdatingBcv}
              className="ml-1 p-1 text-teal-700 hover:text-teal-900 hover:bg-teal-100 rounded-lg transition"
              title="Haz clic para consultar y actualizar la tasa oficial del BCV ahora mismo"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isUpdatingBcv ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          {actionButton}
        </div>
      </div>
    </header>
  );
}
