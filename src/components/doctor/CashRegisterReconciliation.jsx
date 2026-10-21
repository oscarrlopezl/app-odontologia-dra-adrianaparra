import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  Printer, 
  Calendar, 
  TrendingUp, 
  PieChart,
  FileSpreadsheet,
  X
} from 'lucide-react';

export default function CashRegisterReconciliation() {
  const { cashEntries, addCashEntry, settings } = useDental();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Formulario de gasto / egreso
  const [expenseForm, setExpenseForm] = useState({
    type: 'egreso',
    category: 'insumos',
    description: '',
    amount_usd: '',
    payment_method: 'efectivo_usd',
    reference: '',
  });

  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  // Filtrar movimientos por fecha seleccionada
  const dailyEntries = cashEntries.filter((e) => e.entry_date === selectedDate);

  // Cálculos de ingresos y egresos
  const totalIngresosUsd = dailyEntries
    .filter((e) => e.type === 'ingreso')
    .reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);

  const totalEgresosUsd = dailyEntries
    .filter((e) => e.type === 'egreso')
    .reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);

  const balanceNetoUsd = totalIngresosUsd - totalEgresosUsd;
  const balanceNetoBs = balanceNetoUsd * exchangeRate;

  // Desglose por método de pago para el día
  const methodTotals = dailyEntries.reduce((acc, curr) => {
    const method = curr.payment_method;
    if (!acc[method]) acc[method] = { ingresosUsd: 0, egresosUsd: 0 };
    if (curr.type === 'ingreso') acc[method].ingresosUsd += Number(curr.amount_usd) || 0;
    if (curr.type === 'egreso') acc[method].egresosUsd += Number(curr.amount_usd) || 0;
    return acc;
  }, {});

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.description.trim() || !expenseForm.amount_usd) return;

    addCashEntry({
      ...expenseForm,
      amount_usd: Number(expenseForm.amount_usd),
      entry_date: selectedDate,
    });

    setExpenseForm({
      type: 'egreso',
      category: 'insumos',
      description: '',
      amount_usd: '',
      payment_method: 'efectivo_usd',
      reference: '',
    });

    setShowExpenseModal(false);
  };

  const handlePrintDailyReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Barra de Filtro de Fecha y Botones de Acción */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <Calendar className="w-4 h-4 text-teal-600" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-700">
            Tasa de cambio del día: <strong className="text-teal-800">{exchangeRate.toFixed(2)} Bs/$</strong>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrintDailyReport}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cierre</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Anotar Egreso / Gasto</span>
          </button>
        </div>
      </div>

      {/* Tarjetas de Resumen Financiero del Día */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10">
          <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Ingresos del Día</span>
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight">${totalIngresosUsd.toFixed(2)}</h4>
          <p className="text-xs text-emerald-100 font-medium mt-1">
            ≈ {(totalIngresosUsd * exchangeRate).toFixed(2)} Bs
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Egresos / Gastos</span>
            <ArrowDownRight className="w-5 h-5 text-rose-500" />
          </div>
          <h4 className="text-3xl font-extrabold text-slate-800 tracking-tight">${totalEgresosUsd.toFixed(2)}</h4>
          <p className="text-xs text-rose-600 font-medium mt-1">
            ≈ {(totalEgresosUsd * exchangeRate).toFixed(2)} Bs
          </p>
        </div>

        <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl">
          <div className="flex items-center justify-between text-teal-400 text-xs font-bold uppercase tracking-wider mb-2">
            <span>Balance Neto Diario</span>
            <TrendingUp className="w-5 h-5 text-teal-400" />
          </div>
          <h4 className="text-3xl font-extrabold tracking-tight">${balanceNetoUsd.toFixed(2)}</h4>
          <p className="text-xs text-slate-300 font-medium mt-1">
            ≈ {balanceNetoBs.toFixed(2)} Bs
          </p>
        </div>
      </div>

      {/* Desglose por Método de Pago */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h4 className="font-extrabold text-slate-800 text-sm mb-4 flex items-center gap-2">
          <PieChart className="w-4 h-4 text-teal-600" />
          <span>Arqueo y Desglose por Formas de Pago</span>
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { id: 'efectivo_usd', label: 'Efectivo USD ($)' },
            { id: 'pago_movil', label: 'Pago Móvil (Bs)' },
            { id: 'zelle', label: 'Zelle ($)' },
            { id: 'punto_venta', label: 'Punto de Venta (Bs)' },
          ].map((m) => {
            const data = methodTotals[m.id] || { ingresosUsd: 0, egresosUsd: 0 };
            const net = data.ingresosUsd - data.egresosUsd;
            return (
              <div key={m.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">{m.label}</span>
                <span className="text-lg font-extrabold text-slate-800 block mt-1">${net.toFixed(2)}</span>
                <span className="text-[10px] text-slate-700 block mt-0.5">
                  ≈ {(net * exchangeRate).toFixed(2)} Bs
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabla de Movimientos del Día */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <h4 className="font-extrabold text-slate-800 text-sm">
            Libro de Movimientos de Caja ({dailyEntries.length})
          </h4>
          <span className="text-xs text-slate-700 font-medium">Fecha: {selectedDate}</span>
        </div>

        {dailyEntries.length === 0 ? (
          <div className="p-12 text-center text-slate-600 text-xs">
            No se han registrado movimientos de ingresos o egresos en esta fecha.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4">Método</th>
                  <th className="py-3 px-4">Referencia</th>
                  <th className="py-3 px-4 text-right">Monto USD</th>
                  <th className="py-3 px-4 text-right">Monto Bs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dailyEntries.map((entry) => {
                  const isIngreso = entry.type === 'ingreso';
                  return (
                    <tr key={entry.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] ${
                            isIngreso ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIngreso ? '+' : '-'} {entry.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {entry.category?.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 max-w-xs truncate">
                        {entry.description}
                      </td>
                      <td className="py-3 px-4 text-slate-600 capitalize">
                        {entry.payment_method?.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-mono text-[11px]">
                        {entry.reference || 'N/A'}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-extrabold ${
                          isIngreso ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIngreso ? '+' : '-'}${entry.amount_usd?.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600 font-medium">
                        {entry.amount_bs?.toFixed(2)} Bs
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Registrar Egreso / Gasto Menor */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800">Registrar Egreso / Gasto</h3>
                <p className="text-xs text-slate-700">Insumos dentales, laboratorio o mantenimiento</p>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="p-2 text-slate-600 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="mt-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Categoría del Gasto *
                </label>
                <select
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="insumos">Insumos y Materiales Dentales</option>
                  <option value="laboratorio">Técnico / Laboratorio Dental</option>
                  <option value="mantenimiento">Mantenimiento de Unidad / Compresor</option>
                  <option value="servicios">Servicios (Luz, Agua, Internet)</option>
                  <option value="otros">Otros Gastos Menores</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Descripción del Gasto *
                </label>
                <input
                  type="text"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  placeholder="Ej: Compra de fresas diamantadas y resinas"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Monto en Dólares (USD $) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={expenseForm.amount_usd}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount_usd: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 bg-slate-50"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Método de Pago Utilizado
                </label>
                <select
                  value={expenseForm.payment_method}
                  onChange={(e) => setExpenseForm({ ...expenseForm, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="efectivo_usd">Efectivo USD ($)</option>
                  <option value="pago_movil">Pago Móvil (Bs)</option>
                  <option value="zelle">Zelle ($)</option>
                  <option value="punto_venta">Punto de Venta / Débito (Bs)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  N° de Factura / Referencia
                </label>
                <input
                  type="text"
                  value={expenseForm.reference}
                  onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                  placeholder="Ej: Fac 0098 o Comprobante"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
                >
                  Registrar Salida de Caja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
