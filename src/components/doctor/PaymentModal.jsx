import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { DollarSign, CreditCard, Banknote, Landmark, Smartphone, X, AlertCircle } from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, patientId, patientName, defaultBudgetId = null }) {
  const { registerPayment, settings, budgets, bcvInfo } = useDental();
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const [amountUsd, setAmountUsd] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [reference, setReference] = useState('');
  const [concept, setConcept] = useState('Abono a tratamiento dental');
  const [selectedBudgetId, setSelectedBudgetId] = useState(defaultBudgetId || '');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const patientBudgets = budgets.filter((b) => b.patient_id === patientId);
  const calculatedBs = amountUsd ? (Number(amountUsd) * exchangeRate).toFixed(2) : '0.00';

  const paymentMethods = [
    { id: 'efectivo_usd', label: 'Efectivo USD ($)', icon: Banknote },
    { id: 'pago_movil', label: 'Pago Móvil (Bs)', icon: Smartphone },
    { id: 'zelle', label: 'Zelle ($)', icon: Landmark },
    { id: 'punto_venta', label: 'Punto de Venta (Bs)', icon: CreditCard },
    { id: 'transferencia', label: 'Transferencia Bancaria', icon: Landmark },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountUsd || Number(amountUsd) <= 0) {
      setError('Por favor introduce un monto válido en USD');
      return;
    }

    try {
      await registerPayment({
        patient_id: patientId,
        budget_id: selectedBudgetId || null,
        amount_usd: Number(amountUsd),
        amount_bs: Number(calculatedBs),
        payment_method: paymentMethod,
        reference: reference.trim() || 'N/A',
        concept: concept.trim() || 'Abono',
      });

      onClose();
    } catch (err) {
      setError(`Error al registrar pago: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-extrabold text-slate-800">Registrar Pago o Abono</h3>
            <p className="text-xs text-slate-700">Paciente: <strong className="text-teal-700">{patientName}</strong></p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Monto en Dólares con conversión automática a Bolívares */}
          <div className="bg-gradient-to-br from-teal-50 to-slate-50 p-4 rounded-2xl border border-teal-200">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Monto del Abono (USD $)
              </label>
              <span className="text-[11px] font-semibold text-slate-700">
                Tasa: 1 USD = {exchangeRate.toFixed(2)} Bs
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-700">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-3 text-2xl font-extrabold text-slate-900 bg-white rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs"
                required
                autoFocus
              />
            </div>

            <div className="mt-2 text-right">
              <span className="text-xs text-slate-700 font-medium">Equivalente en moneda nacional: </span>
              <span className="text-sm font-extrabold text-teal-800">{calculatedBs} Bs</span>
            </div>
          </div>

          {/* Método de Pago */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((m) => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold text-left transition ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/20'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0 text-teal-600" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presupuesto Asociado */}
          {patientBudgets.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Asociar a Presupuesto
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Abono general / Sin presupuesto específico</option>
                {patientBudgets.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.title} (Total: ${b.total_amount?.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Referencia / Número de Comprobante
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ej: Ref 0414-9988-74125 o Efectivo entregado en caja"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Concepto del Pago
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="Ej: Abono Fase 1 (Saneamiento y Profilaxis)"
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
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
              className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition"
            >
              Ingresar Pago a Caja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
