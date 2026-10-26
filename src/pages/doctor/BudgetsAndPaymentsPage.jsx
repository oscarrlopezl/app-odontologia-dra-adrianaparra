import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import PaymentModal from '../../components/doctor/PaymentModal';
import { 
  CreditCard, 
  DollarSign, 
  ArrowUpRight, 
  AlertCircle, 
  Search, 
  User, 
  Plus,
  Receipt,
  CheckCircle2
} from 'lucide-react';

export default function BudgetsAndPaymentsPage() {
  const { patients, budgets, payments, settings } = useDental();
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyDebtors, setOnlyDebtors] = useState(false);
  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState(null);

  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  // Resumen global
  const totalBudgetsUsd = budgets.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  const totalPaymentsUsd = payments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
  const totalPendingUsd = Math.max(0, totalBudgetsUsd - totalPaymentsUsd);

  // Lista consolidada por paciente
  const patientFinancialRows = patients.map((pat) => {
    const patBudgets = budgets.filter((b) => b.patient_id === pat.id);
    const patTotalBudget = patBudgets.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const patPayments = payments.filter((p) => p.patient_id === pat.id);
    const patTotalPaid = patPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
    const patPending = Math.max(0, patTotalBudget - patTotalPaid);

    return {
      patient: pat,
      totalBudget: patTotalBudget,
      totalPaid: patTotalPaid,
      pending: patPending,
      hasDebt: patPending > 0,
      budgetsCount: patBudgets.length,
      paymentsCount: patPayments.length,
    };
  });

  const filteredRows = patientFinancialRows.filter((row) => {
    const matchesSearch =
      row.patient.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      row.patient.document_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDebtors = onlyDebtors ? row.hasDebt : true;
    return matchesSearch && matchesDebtors;
  });

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Control de Presupuestos, Abonos y Deudas"
        subtitle="Monitoreo de cartera financiera, planes de tratamiento por fases y registro de pagos"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">
        {/* Métricas Globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Presupuestado</span>
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ${totalBudgetsUsd.toFixed(2)}
            </h4>
            <p className="text-xs text-slate-700 font-medium mt-1">
              ≈ {(totalBudgetsUsd * exchangeRate).toFixed(2)} Bs ({budgets.length} planes activos)
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Recaudado (Abonos)</span>
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h4 className="text-3xl font-extrabold tracking-tight">
              ${totalPaymentsUsd.toFixed(2)}
            </h4>
            <p className="text-xs text-emerald-100 font-medium mt-1">
              ≈ {(totalPaymentsUsd * exchangeRate).toFixed(2)} Bs ({payments.length} transacciones)
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Saldo Pendiente / Cartera</span>
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <h4 className="text-3xl font-extrabold text-rose-600 tracking-tight">
              ${totalPendingUsd.toFixed(2)}
            </h4>
            <p className="text-xs text-rose-600 font-medium mt-1">
              ≈ {(totalPendingUsd * exchangeRate).toFixed(2)} Bs por cobrar
            </p>
          </div>
        </div>

        {/* Tabla de Estados de Cuenta por Paciente */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h4 className="font-extrabold text-slate-800 text-base">
                Cartera de Tratamientos y Saldos de Pacientes
              </h4>
              <p className="text-xs text-slate-700">Estado de cuenta individual de cada paciente atendido.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar paciente..."
                  className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <button
                onClick={() => setOnlyDebtors(!onlyDebtors)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  onlyDebtors
                    ? 'bg-rose-50 text-rose-700 border border-rose-300'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Solo con Deuda Pendiente</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Paciente</th>
                  <th className="py-3 px-4">Cédula / Teléfono</th>
                  <th className="py-3 px-4 text-right">Presupuesto ($)</th>
                  <th className="py-3 px-4 text-right">Abonado ($)</th>
                  <th className="py-3 px-4 text-right">Saldo Deudor ($)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.patient.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-bold text-slate-800">
                      {row.patient.full_name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono">
                      <span>{row.patient.document_id}</span>
                      <span className="text-slate-300 mx-1.5">•</span>
                      <span>{row.patient.phone}</span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-slate-700">
                      ${row.totalBudget.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ${row.totalPaid.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                      ${row.pending.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.pending === 0 && row.totalBudget > 0 ? (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Solvente
                        </span>
                      ) : row.pending > 0 ? (
                        <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Saldo Pendiente
                        </span>
                      ) : (
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Sin presupuesto
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedPatientForPayment(row.patient)}
                        className="bg-teal-50 hover:bg-teal-100 text-teal-800 font-bold px-3 py-1.5 rounded-lg border border-teal-200 transition text-[11px] inline-flex items-center gap-1"
                      >
                        <DollarSign className="w-3 h-3" />
                        <span>Abonar</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selectedPatientForPayment && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedPatientForPayment(null)}
          patientId={selectedPatientForPayment.id}
          patientName={selectedPatientForPayment.full_name}
        />
      )}
    </div>
  );
}
