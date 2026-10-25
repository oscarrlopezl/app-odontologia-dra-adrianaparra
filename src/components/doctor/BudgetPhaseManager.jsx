import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Clock, 
  DollarSign, 
  Layers, 
  FileCheck,
  ChevronDown,
  ChevronUp,
  Receipt,
  MessageSquare
} from 'lucide-react';

export default function BudgetPhaseManager({ patientId, onOpenPaymentModal, onOpenWhatsAppBudget }) {
  const { budgets, addBudget, toggleBudgetItem, payments, settings } = useDental();
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [newBudgetTitle, setNewBudgetTitle] = useState('Plan Integral de Rehabilitación Bucal');
  const [newBudgetNotes, setNewBudgetNotes] = useState('');

  // Estados para nuevo presupuesto con 2 o 3 fases
  const [phasesInput, setPhasesInput] = useState([
    {
      title: 'Fase 1: Diagnóstico y Saneamiento',
      items: [
        { description: 'Evaluación clínica completa y tartrectomía ultrasónica', cost: 40 },
      ],
    },
    {
      title: 'Fase 2: Restauraciones y Endodoncia',
      items: [
        { description: 'Resina fotocurada estética', cost: 45 },
      ],
    },
  ]);

  const patientBudgets = budgets.filter((b) => b.patient_id === patientId);
  const exchangeRate = Number(settings?.usd_exchange_rate) || 40.0;

  const handleCreateBudget = (e) => {
    e.preventDefault();

    let grandTotal = 0;
    const formattedPhases = phasesInput.map((ph, idx) => {
      const subtotal = ph.items.reduce((acc, it) => acc + (Number(it.cost) || 0), 0);
      grandTotal += subtotal;
      return {
        id: `phase-${Date.now()}-${idx + 1}`,
        phase_number: idx + 1,
        title: ph.title,
        status: 'pendiente',
        subtotal,
        items: ph.items.map((it) => ({
          description: it.description,
          cost: Number(it.cost) || 0,
          completed: false,
        })),
      };
    });

    addBudget({
      patient_id: patientId,
      title: newBudgetTitle,
      status: 'activo',
      total_amount: grandTotal,
      notes: newBudgetNotes,
      phases: formattedPhases,
    });

    setShowNewBudgetModal(false);
  };

  const addPhaseInputRow = () => {
    setPhasesInput([
      ...phasesInput,
      {
        title: `Fase ${phasesInput.length + 1}: Procedimientos Especializados`,
        items: [{ description: 'Procedimiento dental', cost: 50 }],
      },
    ]);
  };

  const addItemToPhase = (phaseIndex) => {
    const updated = [...phasesInput];
    updated[phaseIndex].items.push({ description: '', cost: 0 });
    setPhasesInput(updated);
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con Botón de Nuevo Presupuesto */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="text-lg font-bold text-slate-800">Presupuestos y Tratamientos por Fases</h3>
          </div>
          <p className="text-xs text-slate-700 mt-0.5">
            Estructuración paso a paso de los tratamientos para facilitar los abonos del paciente.
          </p>
        </div>

        <button
          onClick={() => setShowNewBudgetModal(true)}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Presupuesto por Fases</span>
        </button>
      </div>

      {patientBudgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-sm">Este paciente no tiene presupuestos activos</h4>
          <p className="text-xs text-slate-600 mt-1 max-w-sm mx-auto">
            Crea el plan de tratamiento dividido en etapas (higiene, operatorias, prótesis) con sus costos detallados.
          </p>
          <button
            onClick={() => setShowNewBudgetModal(true)}
            className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 hover:bg-teal-100 transition"
          >
            Comenzar Presupuesto
          </button>
        </div>
      ) : (
        patientBudgets.map((budget) => {
          // Total de abonos para este paciente
          const patientPayments = payments.filter((p) => p.patient_id === patientId);
          const totalPaidUsd = patientPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
          const balancePending = Math.max(0, budget.total_amount - totalPaidUsd);

          return (
            <div key={budget.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Barra Superior del Presupuesto */}
              <div className="p-5 bg-gradient-to-r from-slate-50 to-teal-50/30 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-800 text-base">{budget.title}</h4>
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {budget.status}
                    </span>
                  </div>
                  {budget.notes && <p className="text-xs text-slate-700 mt-1">{budget.notes}</p>}
                </div>

                {/* Métricas Financieras del Presupuesto */}
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-700 uppercase font-bold block">Total Presupuestado</span>
                    <span className="text-base font-extrabold text-slate-800">${budget.total_amount?.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-700 block">
                      ~{(budget.total_amount * exchangeRate).toFixed(2)} Bs
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Total Abonado</span>
                    <span className="text-base font-extrabold text-emerald-600">${totalPaidUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-700 block">
                      ~{(totalPaidUsd * exchangeRate).toFixed(2)} Bs
                    </span>
                  </div>

                  <div className="text-right bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase font-bold block">Saldo Pendiente</span>
                    <span className="text-base font-extrabold text-rose-700">${balancePending.toFixed(2)}</span>
                  </div>

                  {onOpenWhatsAppBudget && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppBudget(budget)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                      title="Enviar presupuesto y saldo por WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  {onOpenPaymentModal && (
                    <button
                      onClick={() => onOpenPaymentModal(budget.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Registrar Abono</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Lista de Fases de Tratamiento */}
              <div className="p-5 space-y-4">
                {budget.phases?.map((phase) => {
                  const isDone = phase.status === 'completada';
                  return (
                    <div
                      key={phase.id}
                      className={`rounded-2xl border transition-all ${
                        isDone ? 'bg-teal-50/30 border-teal-200' : 'bg-slate-50 border-slate-200'
                      } p-4`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center">
                            {phase.phase_number}
                          </span>
                          <h5 className="font-bold text-slate-800 text-sm">{phase.title}</h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isDone ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {phase.status.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-700">
                          Subtotal: ${phase.subtotal?.toFixed(2)}
                        </span>
                      </div>

                      {/* Items / Procedimientos de la fase */}
                      <div className="space-y-2">
                        {phase.items?.map((item, itIdx) => (
                          <div
                            key={itIdx}
                            onClick={() => toggleBudgetItem(budget.id, phase.id, itIdx)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 group-hover:text-teal-400 shrink-0" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  item.completed ? 'line-through text-slate-600 font-normal' : 'text-slate-800'
                                }`}
                              >
                                {item.description}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 shrink-0">
                              ${item.cost?.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })
      )}

      {/* Modal para Crear Presupuesto con Fases */}
      {showNewBudgetModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
            <h3 className="text-xl font-extrabold text-slate-800 mb-1">
              Crear Nuevo Presupuesto por Fases
            </h3>
            <p className="text-xs text-slate-700 mb-5">
              Define las fases del tratamiento con sus costos unitarios en dólares USD.
            </p>

            <form onSubmit={handleCreateBudget} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Título del Presupuesto
                </label>
                <input
                  type="text"
                  value={newBudgetTitle}
                  onChange={(e) => setNewBudgetTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Notas / Condiciones de Pago
                </label>
                <input
                  type="text"
                  value={newBudgetNotes}
                  onChange={(e) => setNewBudgetNotes(e.target.value)}
                  placeholder="Ej: Se requiere 50% de abono al iniciar cada fase."
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Fases Dinámicas */}
              <div className="space-y-4 pt-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Estructura de Fases
                </span>

                {phasesInput.map((phase, pIdx) => (
                  <div key={pIdx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <input
                      type="text"
                      value={phase.title}
                      onChange={(e) => {
                        const updated = [...phasesInput];
                        updated[pIdx].title = e.target.value;
                        setPhasesInput(updated);
                      }}
                      className="w-full px-3 py-2 text-xs font-bold rounded-lg border border-slate-200 bg-white"
                      placeholder="Título de la fase"
                      required
                    />

                    {phase.items.map((item, itIdx) => (
                      <div key={itIdx} className="flex gap-2">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updated = [...phasesInput];
                            updated[pIdx].items[itIdx].description = e.target.value;
                            setPhasesInput(updated);
                          }}
                          placeholder="Descripción del procedimiento"
                          className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          required
                        />
                        <input
                          type="number"
                          value={item.cost}
                          onChange={(e) => {
                            const updated = [...phasesInput];
                            updated[pIdx].items[itIdx].cost = e.target.value;
                            setPhasesInput(updated);
                          }}
                          placeholder="$ Costo"
                          className="w-24 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                          required
                        />
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => addItemToPhase(pIdx)}
                      className="text-xs text-teal-600 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Añadir otro procedimiento a esta fase
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addPhaseInputRow}
                  className="w-full py-2 border-2 border-dashed border-teal-300 text-teal-700 rounded-xl text-xs font-bold hover:bg-teal-50 transition"
                >
                  + Agregar otra Fase al Plan
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewBudgetModal(false)}
                  className="px-5 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition"
                >
                  Guardar Presupuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
