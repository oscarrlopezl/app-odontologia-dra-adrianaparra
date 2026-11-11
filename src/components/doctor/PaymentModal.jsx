import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Landmark,
  Smartphone,
  X,
  AlertCircle,
  Calculator,
  CheckCircle2,
  ArrowRightLeft,
  Coins
} from 'lucide-react';

export default function PaymentModal({ isOpen, onClose, patientId, patientName, defaultBudgetId = null }) {
  const { registerPayment, settings, budgets, bcvInfo } = useDental();
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const [mode, setMode] = useState('simple'); // 'simple' | 'mixto'
  const [amountUsd, setAmountUsd] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pago_movil');
  const [reference, setReference] = useState('');
  const [concept, setConcept] = useState('Abono a tratamiento dental');
  const [selectedBudgetId, setSelectedBudgetId] = useState(defaultBudgetId || '');
  const [error, setError] = useState('');

  // Estados para Calculadora de Pagos Mixtos y Vuelto
  const [mixedCashUsd, setMixedCashUsd] = useState('');
  const [mixedPagoMovilBs, setMixedPagoMovilBs] = useState('');
  const [mixedPuntoBs, setMixedPuntoBs] = useState('');
  const [mixedZelleUsd, setMixedZelleUsd] = useState('');
  const [vueltoCurrency, setVueltoCurrency] = useState('bs'); // 'usd' | 'bs'

  if (!isOpen) return null;

  const patientBudgets = budgets.filter((b) => b.patient_id === patientId);
  const targetChargeUsd = Number(amountUsd) || 0;
  const targetChargeBs = targetChargeUsd * exchangeRate;

  // Cálculos en modo mixto
  const valCashUsd = Number(mixedCashUsd) || 0;
  const valPagoMovilBs = Number(mixedPagoMovilBs) || 0;
  const valPuntoBs = Number(mixedPuntoBs) || 0;
  const valZelleUsd = Number(mixedZelleUsd) || 0;

  const receivedInUsd = valCashUsd + valZelleUsd + ((valPagoMovilBs + valPuntoBs) / exchangeRate);
  const receivedInBs = (valCashUsd + valZelleUsd) * exchangeRate + valPagoMovilBs + valPuntoBs;

  const differenceUsd = receivedInUsd - targetChargeUsd;
  const differenceBs = receivedInBs - targetChargeBs;

  const paymentMethods = [
    { id: 'efectivo_usd', label: 'Efectivo USD ($)', icon: Banknote },
    { id: 'pago_movil', label: 'Pago Móvil (Bs)', icon: Smartphone },
    { id: 'zelle', label: 'Zelle ($)', icon: Landmark },
    { id: 'punto_venta', label: 'Punto de Venta (Bs)', icon: CreditCard },
    { id: 'transferencia', label: 'Transferencia Bancaria', icon: Landmark },
  ];

  const handleQuickBill = (billUsd) => {
    setMixedCashUsd(billUsd.toString());
  };

  const handleQuickPayFullBs = () => {
    setMixedPagoMovilBs(targetChargeBs.toFixed(2));
    setMixedCashUsd('');
    setMixedPuntoBs('');
    setMixedZelleUsd('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amountUsd || Number(amountUsd) <= 0) {
      setError('Por favor introduce un monto válido a cobrar en USD');
      return;
    }

    try {
      let finalMethod = paymentMethod;
      let finalRef = reference.trim() || 'N/A';
      let finalConcept = concept.trim() || 'Abono dental';

      if (mode === 'mixto') {
        const parts = [];
        if (valCashUsd > 0) parts.push(`$${valCashUsd} Efectivo`);
        if (valPagoMovilBs > 0) parts.push(`${valPagoMovilBs.toFixed(2)} Bs Pago Móvil`);
        if (valPuntoBs > 0) parts.push(`${valPuntoBs.toFixed(2)} Bs Punto`);
        if (valZelleUsd > 0) parts.push(`$${valZelleUsd} Zelle`);

        finalMethod = 'pago_mixto';
        finalRef = reference.trim() || (parts.length > 0 ? parts.join(' + ') : 'Pago Mixto');
        
        let vueltoMsg = '';
        if (differenceUsd > 0.01) {
          vueltoMsg = vueltoCurrency === 'bs' 
            ? ` (Vuelto: ${differenceBs.toFixed(2)} Bs)` 
            : ` (Vuelto: $${differenceUsd.toFixed(2)})`;
        }

        finalConcept = `${concept.trim()} [${parts.join(' + ')}${vueltoMsg}]`;
      }

      await registerPayment({
        patient_id: patientId,
        budget_id: selectedBudgetId || null,
        amount_usd: Number(amountUsd),
        amount_bs: Number(targetChargeBs.toFixed(2)),
        payment_method: finalMethod,
        reference: finalRef,
        concept: finalConcept,
      });

      onClose();
    } catch (err) {
      setError(`Error al registrar pago: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-extrabold text-slate-800">Registrar Pago o Abono</h3>
            <p className="text-xs text-slate-600">Paciente: <strong className="text-teal-700">{patientName}</strong></p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Modo: Pago Simple vs Pago Mixto / Calculadora de Vuelto */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mt-4 border border-slate-200">
          <button
            type="button"
            onClick={() => setMode('simple')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'simple'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Banknote className="w-3.5 h-3.5 text-teal-600" />
            <span>Pago Simple</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('mixto')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              mode === 'mixto'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-amber-300" />
            <span>Pago Mixto & Vuelto (🇻🇪)</span>
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Monto Total a Cobrar */}
          <div className="bg-gradient-to-br from-teal-50/80 to-slate-50 p-3.5 sm:p-4 rounded-2xl border border-teal-200">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Monto a Cobrar (USD $)
              </label>
              <span className="text-[11px] font-semibold text-slate-600 font-mono">
                1 USD = {exchangeRate.toFixed(2)} Bs (BCV)
              </span>
            </div>

            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountUsd}
                onChange={(e) => setAmountUsd(e.target.value)}
                placeholder="0.00"
                className="w-full pl-8 pr-4 py-2.5 text-2xl font-extrabold text-slate-900 bg-white rounded-xl border border-teal-300 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs font-mono"
                required
                autoFocus
              />
            </div>

            <div className="mt-2 text-right text-xs">
              <span className="text-slate-600 font-medium">Equivalente en Bolívares: </span>
              <strong className="text-teal-800 font-mono font-bold text-sm">
                {targetChargeBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
              </strong>
            </div>
          </div>

          {/* MODO SIMPLE: Selector clásico de método único */}
          {mode === 'simple' && (
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
          )}

          {/* MODO MIXTO: Desglose exacto y Calculadora de Vuelto */}
          {mode === 'mixto' && (
            <div className="space-y-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-amber-500" />
                  <span>Desglose de lo Recibido</span>
                </span>
                <button
                  type="button"
                  onClick={handleQuickPayFullBs}
                  className="text-[11px] font-bold text-teal-700 hover:text-teal-900 underline"
                >
                  Pagar todo por Pago Móvil
                </button>
              </div>

              {/* Botones rápidos de billetes comunes en Venezuela */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-500 font-medium">Billetes USD:</span>
                {[10, 20, 50, 100].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => handleQuickBill(b)}
                    className="px-2 py-0.5 bg-white border border-slate-300 hover:border-teal-500 rounded-lg font-mono font-bold text-slate-700 text-[11px] transition shadow-2xs"
                  >
                    ${b}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    💵 Efectivo USD ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedCashUsd}
                    onChange={(e) => setMixedCashUsd(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    📱 Pago Móvil (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedPagoMovilBs}
                    onChange={(e) => setMixedPagoMovilBs(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    💳 Punto / Tarjeta (Bs)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedPuntoBs}
                    onChange={(e) => setMixedPuntoBs(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">
                    🏛️ Zelle ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={mixedZelleUsd}
                    onChange={(e) => setMixedZelleUsd(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              {/* Panel de Resultado de Vuelto / Saldo */}
              <div className="pt-2 border-t border-slate-200">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-600">Total Recibido:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${receivedInUsd.toFixed(2)} USD ≈ {receivedInBs.toFixed(2)} Bs
                  </span>
                </div>

                {targetChargeUsd > 0 && (
                  <div className="mt-2 p-2.5 rounded-xl border text-center transition">
                    {differenceUsd > 0.01 ? (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-extrabold text-xs">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>¡VUELTO AL PACIENTE!</span>
                        </div>
                        <div className="text-base font-black text-emerald-700 font-mono">
                          {vueltoCurrency === 'bs' 
                            ? `${differenceBs.toFixed(2)} Bs` 
                            : `$${differenceUsd.toFixed(2)} USD`}
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <span className="text-[10px] text-slate-500">Dar vuelto en:</span>
                          <button
                            type="button"
                            onClick={() => setVueltoCurrency('bs')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${vueltoCurrency === 'bs' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                          >
                            Bolívares ({differenceBs.toFixed(2)} Bs)
                          </button>
                          <button
                            type="button"
                            onClick={() => setVueltoCurrency('usd')}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${vueltoCurrency === 'usd' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}
                          >
                            Dólares (${differenceUsd.toFixed(2)})
                          </button>
                        </div>
                      </div>
                    ) : differenceUsd < -0.01 ? (
                      <div className="text-rose-700 font-bold text-xs space-y-0.5">
                        <div>⚠️ Monto incompleto</div>
                        <div className="text-[11px] font-mono">
                          Faltan por cobrar: ${Math.abs(differenceUsd).toFixed(2)} USD ({Math.abs(differenceBs).toFixed(2)} Bs)
                        </div>
                      </div>
                    ) : (
                      <div className="text-teal-800 font-bold text-xs flex items-center justify-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>Pago Exacto y Completo</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Presupuesto Asociado */}
          {patientBudgets.length > 0 && (
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Asociar a Presupuesto
              </label>
              <select
                value={selectedBudgetId}
                onChange={(e) => setSelectedBudgetId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              placeholder="Ej: Ref 0414-9988-74125 o Efectivo entregado en consultorio"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Ingresar Pago a Caja</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
