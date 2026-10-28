import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import BudgetModal from './BudgetModal';
import BudgetDeliverModal from './BudgetDeliverModal';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  DollarSign, 
  Layers, 
  Receipt, 
  MessageSquare,
  Edit,
  Trash2,
  Printer,
  Share2,
  ChevronRight
} from 'lucide-react';

export default function BudgetPhaseManager({ patientId, onOpenPaymentModal, onOpenWhatsAppBudget }) {
  const { budgets, toggleBudgetItem, deleteBudget, payments, settings, patients, bcvInfo } = useDental();

  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);

  const [showDeliverModal, setShowDeliverModal] = useState(false);
  const [budgetToDeliver, setBudgetToDeliver] = useState(null);

  const patientBudgets = (budgets || []).filter((b) => b && b.patient_id === patientId);
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);
  const currentPatient = (patients || []).find((p) => p && p.id === patientId) || { id: patientId, full_name: 'Paciente' };

  const handleOpenCreateModal = () => {
    setBudgetToEdit(null);
    setShowBudgetModal(true);
  };

  const handleOpenEditModal = (budget) => {
    setBudgetToEdit(budget);
    setShowBudgetModal(true);
  };

  const handleOpenDeliverModal = (budget) => {
    setBudgetToDeliver(budget);
    setShowDeliverModal(true);
  };

  const handleDeleteBudget = (budget) => {
    if (window.confirm(`¿Estás segura de eliminar el presupuesto "${budget.title}"? Esta acción no se puede deshacer.`)) {
      deleteBudget(budget.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado con Botón de Nuevo Presupuesto */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
              Presupuestos y Tratamientos por Fases
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Estructuración paso a paso con edición completa y entrega formal de cotizaciones a clientes.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Presupuesto por Fases</span>
        </button>
      </div>

      {patientBudgets.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center">
          <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 text-sm">Este paciente no tiene presupuestos activos</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Crea un plan de tratamiento dividido en etapas (saneamiento, operatoria, prótesis) con sus costos detallados para entregar al cliente.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-teal-50 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 hover:bg-teal-100 transition"
          >
            Comenzar Presupuesto
          </button>
        </div>
      ) : (
        patientBudgets.map((budget) => {
          // Total de abonos para este paciente
          const patientPayments = (payments || []).filter((p) => p && p.patient_id === patientId);
          const totalPaidUsd = patientPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
          const totalBudgetUsd = Number(budget.total_amount) || 0;
          const balancePending = Math.max(0, totalBudgetUsd - totalPaidUsd);

          return (
            <div key={budget.id} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Barra Superior del Presupuesto */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-extrabold text-slate-800 text-base">{budget.title}</h4>
                    <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      {budget.status || 'Activo'}
                    </span>
                  </div>
                  {budget.notes && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      <span className="font-semibold text-slate-700">Condiciones:</span> {budget.notes}
                    </p>
                  )}
                </div>

                {/* Métricas Financieras y Botones Principales */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Presupuesto</span>
                    <span className="text-base font-extrabold text-slate-800">${totalBudgetUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ~{(totalBudgetUsd * exchangeRate).toFixed(1)} Bs
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-emerald-600 uppercase font-bold block">Abonado</span>
                    <span className="text-base font-extrabold text-emerald-600">${totalPaidUsd.toFixed(2)}</span>
                    <span className="text-[10px] text-slate-500 block font-mono">
                      ~{(totalPaidUsd * exchangeRate).toFixed(1)} Bs
                    </span>
                  </div>

                  <div className="text-right bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl">
                    <span className="text-[10px] text-rose-600 uppercase font-bold block">Saldo Pendiente</span>
                    <span className="text-base font-extrabold text-rose-700">${balancePending.toFixed(2)}</span>
                  </div>

                  {/* BOTÓN ENTREGAR AL CLIENTE (FORMATO OFICIAL DE COTIZACIÓN) */}
                  <button
                    type="button"
                    onClick={() => handleOpenDeliverModal(budget)}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                    title="Ver formato oficial para entregar al cliente o imprimir"
                  >
                    <Printer className="w-3.5 h-3.5 text-teal-300" />
                    <span>Entregar al Cliente</span>
                  </button>

                  {/* BOTÓN EDITAR PRESUPUESTO */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(budget)}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-2xs"
                    title="Editar fases, procedimientos o costos"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  {/* Botón WhatsApp */}
                  {onOpenWhatsAppBudget && (
                    <button
                      type="button"
                      onClick={() => onOpenWhatsAppBudget(budget)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5 transition"
                      title="Enviar resumen y saldo por WhatsApp"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>
                  )}

                  {/* Botón Registrar Abono */}
                  {onOpenPaymentModal && (
                    <button
                      onClick={() => onOpenPaymentModal(budget.id)}
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-sm flex items-center gap-1.5"
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>Abonar</span>
                    </button>
                  )}

                  {/* Botón Eliminar Presupuesto */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBudget(budget)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                    title="Eliminar presupuesto"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Lista de Fases de Tratamiento */}
              <div className="p-4 sm:p-5 space-y-4">
                {(budget.phases || []).map((phase, pIdx) => {
                  const isDone = phase.status === 'completada';
                  return (
                    <div
                      key={phase.id || pIdx}
                      className={`rounded-2xl border transition-all ${
                        isDone ? 'bg-teal-50/30 border-teal-200' : 'bg-slate-50 border-slate-200'
                      } p-4`}
                    >
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200/60 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                            {phase.phase_number || pIdx + 1}
                          </span>
                          <h5 className="font-bold text-slate-800 text-sm">{phase.title}</h5>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isDone ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {(phase.status || 'pendiente').toUpperCase()}
                          </span>
                        </div>
                        <span className="text-xs font-extrabold text-slate-800">
                          Subtotal: ${Number(phase.subtotal || 0).toFixed(2)} USD
                        </span>
                      </div>

                      {/* Items / Procedimientos de la fase */}
                      <div className="space-y-2">
                        {(phase.items || []).map((item, itIdx) => (
                          <div
                            key={itIdx}
                            onClick={() => toggleBudgetItem(budget.id, phase.id, itIdx)}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 hover:border-teal-300 cursor-pointer transition group"
                          >
                            <div className="flex items-center gap-3">
                              {item.completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              ) : (
                                <Circle className="w-5 h-5 text-slate-300 group-hover:text-teal-400 shrink-0" />
                              )}
                              <span
                                className={`text-xs font-medium ${
                                  item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'
                                }`}
                              >
                                {item.description}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-700 shrink-0">
                              ${Number(item.cost || 0).toFixed(2)}
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

      {/* Modal para Crear y Editar Presupuesto */}
      <BudgetModal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setBudgetToEdit(null);
        }}
        patientId={patientId}
        budgetToEdit={budgetToEdit}
      />

      {/* Modal para Entregar / Imprimir / PDF el Presupuesto al Cliente */}
      <BudgetDeliverModal
        isOpen={showDeliverModal}
        onClose={() => {
          setShowDeliverModal(false);
          setBudgetToDeliver(null);
        }}
        budget={budgetToDeliver}
        patient={currentPatient}
        payments={payments}
      />
    </div>
  );
}
