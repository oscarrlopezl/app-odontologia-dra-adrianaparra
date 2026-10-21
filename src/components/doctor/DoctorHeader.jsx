import React from 'react';
import { useDental } from '../../context/DentalContext';
import { DollarSign, Clock, UserCheck, ShieldCheck, RefreshCw } from 'lucide-react';

export default function DoctorHeader({ title, subtitle, actionButton }) {
  const { settings, isSyncing } = useDental();
  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  const today = new Date().toLocaleDateString('es-VE', {
    weekday: 'long',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-slate-700 mt-0.5">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-4">
          {/* Tasa del Día USD / Bs */}
          <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-3 py-1.5 rounded-xl shadow-2xs">
            <DollarSign className="w-4 h-4 text-teal-700" />
            <div className="text-xs">
              <span className="text-slate-700 font-medium">Tasa oficial: </span>
              <span className="font-extrabold text-teal-900">1 USD = {exchangeRate.toFixed(2)} Bs</span>
            </div>
          </div>

          {/* Fecha */}
          <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs text-slate-600 font-medium capitalize">
            <Clock className="w-3.5 h-3.5 text-slate-700" />
            <span>{today}</span>
          </div>

          {isSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-teal-600 animate-pulse font-medium">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Sincronizando...</span>
            </div>
          )}

          {actionButton}
        </div>
      </div>
    </header>
  );
}
