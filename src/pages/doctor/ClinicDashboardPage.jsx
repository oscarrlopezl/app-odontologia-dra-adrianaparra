import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  Package,
  Activity,
  ArrowUpRight,
  Clock,
  Sparkles,
  Receipt,
  HeartPulse,
  Plus
} from 'lucide-react';

export default function ClinicDashboardPage() {
  const {
    patients,
    budgets,
    payments,
    appointments,
    cashEntries,
    inventory,
    lowStockCount,
    settings,
    bcvInfo,
  } = useDental();

  const navigate = useNavigate();
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  // Totales Financieros
  const totalBudgetsUsd = (budgets || []).reduce(
    (acc, b) => acc + (Number(b.total_amount) || 0),
    0
  );
  const totalPaidUsd = (payments || []).reduce(
    (acc, p) => acc + (Number(p.amount_usd) || 0),
    0
  );
  const totalPendingUsd = Math.max(0, totalBudgetsUsd - totalPaidUsd);

  // Totales por método de pago
  const paymentByMethod = (payments || []).reduce((acc, curr) => {
    const m = curr.payment_method || 'otro';
    acc[m] = (acc[m] || 0) + (Number(curr.amount_usd) || 0);
    return acc;
  }, {});

  // Pacientes que tienen más de 6 meses sin consulta registrada
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  const recallPatients = (patients || []).filter((p) => {
    const pApts = (appointments || []).filter(
      (a) => a.patient_id === p.id || a.patient_name === p.full_name
    );
    if (pApts.length === 0) return true; // Nunca ha tenido cita formal
    const lastApt = pApts.sort((a, b) => new Date(b.appointment_date) - new Date(a.appointment_date))[0];
    return new Date(lastApt.appointment_date) < sixMonthsAgo;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Panel Gerencial & Métricas del Consultorio"
        subtitle="Control ejecutivo de ingresos en $ y Bs, efectividad de cobros, agenda y estado general de la clínica"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
        
        {/* Banner Superior de Bienvenida y Tasa en Vivo */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-3xl p-6 text-white border border-teal-800/40 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-teal-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>🇻🇪</span>
              <span>Centro Odontológico Especializado Dra. Adriana Parra</span>
            </span>
            <h2 className="text-xl sm:text-2xl font-black">
              Resumen Clínico & Administrativo
            </h2>
            <p className="text-xs text-slate-300">
              Guacara / Yagua, Edo. Carabobo • Tasa Oficial BCV: <strong className="text-amber-300 font-mono">Bs. {exchangeRate.toFixed(2)} / USD</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/doctor')}
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>Ver Pacientes</span>
            </button>
            <button
              onClick={() => navigate('/doctor/citas')}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl border border-white/15 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>Ver Agenda</span>
            </button>
          </div>
        </div>

        {/* 1. Métricas Financieras Principales (3 Columnas) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Facturado en Presupuestos</span>
              <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                $
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
              ${totalBudgetsUsd.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ≈ {(totalBudgetsUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </div>
            <div className="text-[11px] text-teal-700 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>{budgets?.length || 0} presupuestos registrados</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Total Cobrado / Abonos</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                ✓
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-mono">
              ${totalPaidUsd.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ≈ {(totalPaidUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </div>
            <div className="text-[11px] text-emerald-800 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>{payments?.length || 0} pagos ingresados a caja</span>
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Cuentas por Cobrar (Deuda)</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                !
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-600 font-mono">
              ${totalPendingUsd.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ≈ {(totalPendingUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
            </div>
            <div className="text-[11px] text-rose-700 font-bold flex items-center gap-1 pt-1 border-t border-slate-100">
              <span>Saldo pendiente de tratamientos</span>
            </div>
          </div>
        </div>

        {/* 2. Métricas Operativas y Alertas Clínicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Pacientes Registrados</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{patients?.length || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Citas en Agenda</span>
              <span className="text-2xl font-black text-slate-900 block mt-0.5">{appointments?.length || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase">Control Semestral Pendiente</span>
              <span className="text-2xl font-black text-amber-700 block mt-0.5">{recallPatients?.length || 0}</span>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className={`p-4 rounded-3xl border shadow-2xs flex items-center justify-between transition ${
            lowStockCount > 0 ? 'bg-rose-50/70 border-rose-200' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className="text-[11px] font-bold text-rose-900 uppercase">Insumos Críticos</span>
              <span className="text-2xl font-black text-rose-700 block mt-0.5">{lowStockCount} por reponer</span>
            </div>
            <button
              onClick={() => navigate('/doctor/inventario')}
              className="p-2 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-800 transition"
              title="Ir al inventario"
            >
              <Package className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 3. Desglose de Pagos por Canal & Acciones de Fidelización */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Métodos de Pago Ingresados */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-teal-600" />
              <span>Distribución de Ingresos por Canal</span>
            </h4>

            <div className="space-y-3">
              {[
                { label: 'Efectivo USD ($)', key: 'efectivo_usd', icon: '💵', color: 'bg-emerald-500' },
                { label: 'Pago Móvil (Bs)', key: 'pago_movil', icon: '📱', color: 'bg-teal-500' },
                { label: 'Pago Mixto ($ + Bs)', key: 'pago_mixto', icon: '🔄', color: 'bg-indigo-500' },
                { label: 'Zelle ($)', key: 'zelle', icon: '🏛️', color: 'bg-purple-500' },
                { label: 'Punto de Venta (Bs)', key: 'punto_venta', icon: '💳', color: 'bg-amber-500' },
              ].map((m) => {
                const amount = paymentByMethod[m.key] || 0;
                const pct = totalPaidUsd > 0 ? ((amount / totalPaidUsd) * 100).toFixed(0) : 0;

                return (
                  <div key={m.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </span>
                      <span className="font-mono font-bold text-slate-900">
                        ${amount.toFixed(2)} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${m.color} rounded-full transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pacientes para Reactivar (Llenar Agenda con Limpiezas / Control Semestral) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Reactivación de Pacientes (+6 meses)</span>
              </h4>
              <span className="text-[10px] bg-amber-100 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                {recallPatients.length} pacientes
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Pacientes que requieren su control y tartrectomía (limpieza) semestral para prevenir caries o sarro:
            </p>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recallPatients.slice(0, 5).map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 rounded-2xl border border-slate-200 flex items-center justify-between gap-2 text-xs transition"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 truncate">{p.full_name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{p.phone}</div>
                  </div>

                  <button
                    onClick={() => {
                      navigate('/doctor');
                    }}
                    className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[11px] font-bold shrink-0 transition"
                  >
                    Ver Ficha
                  </button>
                </div>
              ))}

              {recallPatients.length === 0 && (
                <div className="p-6 text-center text-slate-500 text-xs">
                  <CheckCircle2 className="w-7 h-7 text-emerald-500 mx-auto mb-1.5" />
                  <p className="font-bold text-slate-800">¡Todos los pacientes están al día!</p>
                  <p className="text-[11px] text-slate-400">No hay pacientes con más de 6 meses sin consulta.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
