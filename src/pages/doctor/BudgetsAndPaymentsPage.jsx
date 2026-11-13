import React, { useState, useMemo } from 'react';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import PaymentModal from '../../components/doctor/PaymentModal';
import BudgetDeliverModal from '../../components/doctor/BudgetDeliverModal';
import BudgetModal from '../../components/doctor/BudgetModal';
import ProceduresCatalogModal from '../../components/doctor/ProceduresCatalogModal';
import {
  CreditCard,
  DollarSign,
  ArrowUpRight,
  AlertCircle,
  Search,
  User,
  Plus,
  Receipt,
  CheckCircle2,
  Printer,
  Edit,
  Trash2,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
  Circle,
  Calendar,
  ListFilter,
  Tag,
  Phone,
} from 'lucide-react';

export default function BudgetsAndPaymentsPage() {
  const {
    patients,
    budgets,
    deleteBudget,
    payments,
    settings,
    bcvInfo,
    proceduresCatalog,
  } = useDental();

  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  // Pestaña activa: 'presupuestos' | 'cartera' | 'tarifario'
  const [activeTab, setActiveTab] = useState('presupuestos');

  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos'); // 'todos' | 'activo' | 'completada' | 'pausado'
  const [onlyDebtors, setOnlyDebtors] = useState(false);

  // Estados de modales
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [budgetToEdit, setBudgetToEdit] = useState(null);
  const [targetPatientIdForBudget, setTargetPatientIdForBudget] = useState(null);

  const [selectedPatientForPayment, setSelectedPatientForPayment] = useState(null);
  const [deliverBudgetInfo, setDeliverBudgetInfo] = useState(null);

  const [showProceduresModal, setShowProceduresModal] = useState(false);

  // Tarjetas de presupuestos expandidas (para ver fases y procedimientos)
  const [expandedBudgetIds, setExpandedBudgetIds] = useState({});

  const toggleExpandBudget = (bId) => {
    setExpandedBudgetIds((prev) => ({
      ...prev,
      [bId]: !prev[bId],
    }));
  };

  // Resumen global
  const totalBudgetsUsd = budgets.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
  const totalPaymentsUsd = payments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
  const totalPendingUsd = Math.max(0, totalBudgetsUsd - totalPaymentsUsd);

  // Lista detallada de presupuestos enriquecidos con datos del paciente
  const enrichedBudgets = useMemo(() => {
    return (budgets || []).map((b) => {
      const pat = (patients || []).find((p) => p.id === b.patient_id) || {
        id: b.patient_id,
        full_name: 'Paciente No Registrado',
        document_id: 'S/N',
        phone: '',
      };
      const patPayments = (payments || []).filter((p) => p.patient_id === b.patient_id);
      const totalPaid = patPayments.reduce((sum, curr) => sum + (Number(curr.amount_usd) || 0), 0);
      const budgetTotal = Number(b.total_amount) || 0;
      const pending = Math.max(0, budgetTotal - totalPaid);

      return {
        ...b,
        patient: pat,
        totalPaid,
        pending,
      };
    });
  }, [budgets, patients, payments]);

  // Filtrado de presupuestos
  const filteredBudgets = useMemo(() => {
    return enrichedBudgets.filter((b) => {
      const matchesSearch =
        (b.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.patient?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.patient?.document_id || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'todos' || (b.status || 'activo') === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [enrichedBudgets, searchTerm, statusFilter]);

  // Lista consolidada por paciente (para la pestaña de Cartera)
  const patientFinancialRows = useMemo(() => {
    return (patients || []).map((pat) => {
      const patBudgets = (budgets || []).filter((b) => b.patient_id === pat.id);
      const patTotalBudget = patBudgets.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
      const patPayments = (payments || []).filter((p) => p.patient_id === pat.id);
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
        primaryBudget: patBudgets[0] || null,
      };
    });
  }, [patients, budgets, payments]);

  const filteredPatientRows = useMemo(() => {
    return patientFinancialRows.filter((row) => {
      const matchesSearch =
        (row.patient.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.patient.document_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (row.patient.phone || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDebtors = onlyDebtors ? row.hasDebt : true;
      return matchesSearch && matchesDebtors;
    });
  }, [patientFinancialRows, searchTerm, onlyDebtors]);

  // Manejadores de creación y edición
  const handleOpenCreateBudget = (patientId = null) => {
    setBudgetToEdit(null);
    setTargetPatientIdForBudget(patientId);
    setShowBudgetModal(true);
  };

  const handleOpenEditBudget = (budget) => {
    setBudgetToEdit(budget);
    setTargetPatientIdForBudget(budget.patient_id);
    setShowBudgetModal(true);
  };

  const handleDeleteBudget = (budget) => {
    if (
      window.confirm(
        `¿Estás segura de eliminar el presupuesto "${budget.title}" del paciente ${budget.patient?.full_name || ''}? Esta acción no se puede deshacer.`
      )
    ) {
      deleteBudget(budget.id);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Presupuestos, Procedimientos y Pagos"
        subtitle="Crea y edita presupuestos por fases, gestiona aranceles de procedimientos y controla la cartera de cobros"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 space-y-5 sm:space-y-6 max-w-7xl w-full mx-auto">
        {/* Barra Superior con Botones Principales de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
              Gestor de Cotizaciones Odontológicas
            </h3>
            <p className="text-xs text-slate-500">
              Personaliza procedimientos, ajusta precios en $ USD o Bs BCV y entrega presupuestos formales.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowProceduresModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition border border-slate-200 shadow-2xs active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>Tarifario de Procedimientos ({proceduresCatalog?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenCreateBudget()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-2xl text-xs shadow-md shadow-teal-600/20 transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Presupuesto</span>
            </button>
          </div>
        </div>

        {/* Métricas Globales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Presupuestado</span>
              <CreditCard className="w-5 h-5 text-teal-600" />
            </div>
            <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              ${totalBudgetsUsd.toFixed(2)} USD
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-1 font-mono">
              ≈ {(totalBudgetsUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs ({budgets.length} planes)
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-lg shadow-emerald-500/10">
            <div className="flex items-center justify-between opacity-80 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Recaudado (Abonos)</span>
              <ArrowUpRight className="w-5 h-5" />
            </div>
            <h4 className="text-3xl font-extrabold tracking-tight">
              ${totalPaymentsUsd.toFixed(2)} USD
            </h4>
            <p className="text-xs text-emerald-100 font-medium mt-1 font-mono">
              ≈ {(totalPaymentsUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs ({payments.length} recibos)
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs">
            <div className="flex items-center justify-between text-slate-700 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Saldo Pendiente / Cartera</span>
              <AlertCircle className="w-5 h-5 text-rose-500" />
            </div>
            <h4 className="text-3xl font-extrabold text-rose-600 tracking-tight">
              ${totalPendingUsd.toFixed(2)} USD
            </h4>
            <p className="text-xs text-rose-500 font-medium mt-1 font-mono">
              ≈ {(totalPendingUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs por cobrar
            </p>
          </div>
        </div>

        {/* Pestañas Principales */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('presupuestos')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'presupuestos'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Planes de Presupuestos ({budgets.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cartera')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'cartera'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Cartera & Saldos por Paciente ({patients.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tarifario')}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-extrabold transition ${
              activeTab === 'tarifario'
                ? 'bg-teal-700 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4 text-teal-300" />
            <span>Tarifario y Procedimientos</span>
          </button>
        </div>

        {/* ============================================================== */}
        {/* PESTAÑA 1: LISTA DETALLADA DE PRESUPUESTOS CON PROCEDIMIENTOS */}
        {/* ============================================================== */}
        {activeTab === 'presupuestos' && (
          <div className="space-y-4">
            {/* Barra de Filtros */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar presupuesto por paciente, cédula o título..."
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Estado:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-teal-500"
                >
                  <option value="todos">Todos los Estados</option>
                  <option value="activo">Solo Activos</option>
                  <option value="completada">Completados</option>
                  <option value="pausado">Pausados</option>
                  <option value="cancelado">Cancelados</option>
                </select>
              </div>
            </div>

            {/* Listado de Tarjetas de Presupuestos */}
            {filteredBudgets.length === 0 ? (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center">
                <Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h4 className="font-extrabold text-slate-700 text-sm">
                  {budgets.length === 0
                    ? 'No hay presupuestos creados aún'
                    : 'No hay presupuestos que coincidan con la búsqueda'}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  {budgets.length === 0
                    ? 'Crea tu primer presupuesto por fases seleccionando al paciente y añadiendo los procedimientos del tarifario.'
                    : 'Intenta limpiar el término de búsqueda o cambiar el filtro de estado.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleOpenCreateBudget()}
                  className="mt-4 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
                >
                  + Crear Nuevo Presupuesto
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBudgets.map((b) => {
                  const isExpanded = Boolean(expandedBudgetIds[b.id]);
                  const phasesCount = (b.phases || []).length;
                  const totalProcedures = (b.phases || []).reduce(
                    (sum, ph) => sum + (ph.items || []).length,
                    0
                  );
                  const totalBudgetUsd = Number(b.total_amount) || 0;
                  const totalPaidUsd = Number(b.totalPaid) || 0;
                  const pendingUsd = Number(b.pending) || 0;

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition hover:border-slate-300"
                    >
                      {/* Cabecera del Presupuesto */}
                      <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-teal-50/20 to-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-slate-900 text-base">
                              {b.title}
                            </h4>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                b.status === 'completada'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'pausado'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-teal-100 text-teal-800'
                              }`}
                            >
                              {b.status || 'Activo'}
                            </span>
                          </div>

                          {/* Paciente asociado */}
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                            <span className="font-extrabold text-teal-800 flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              <span>{b.patient?.full_name}</span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-slate-500">CI: {b.patient?.document_id}</span>
                            {b.patient?.phone && (
                              <>
                                <span>•</span>
                                <span className="font-mono text-slate-500">{b.patient?.phone}</span>
                              </>
                            )}
                            <span>•</span>
                            <span className="text-slate-500">
                              {phasesCount} {phasesCount === 1 ? 'fase' : 'fases'} ({totalProcedures} procedimientos)
                            </span>
                          </div>

                          {b.notes && (
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-1 italic">
                              "{b.notes}"
                            </p>
                          )}
                        </div>

                        {/* Indicadores Financieros */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-500 uppercase font-bold block">
                              Presupuestado
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-slate-800 block">
                              ${totalBudgetUsd.toFixed(2)} USD
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">
                              ≈ {(totalBudgetUsd * exchangeRate).toFixed(1)} Bs
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] text-emerald-600 uppercase font-bold block">
                              Abonado
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-emerald-600 block">
                              ${totalPaidUsd.toFixed(2)} USD
                            </span>
                          </div>

                          <div className="text-right bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-xl">
                            <span className="text-[10px] text-rose-600 uppercase font-bold block">
                              Saldo Deudor
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-rose-700 block">
                              ${pendingUsd.toFixed(2)} USD
                            </span>
                          </div>

                          {/* BOTONES DE ACCIÓN: EDITAR, ENTREGAR, ABONAR, ELIMINAR */}
                          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                            {/* BOTÓN EDITAR PRESUPUESTO */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditBudget(b)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs active:scale-95"
                              title="Editar este presupuesto, fases, procedimientos o costos"
                            >
                              <Edit className="w-3.5 h-3.5 text-amber-700" />
                              <span>Editar</span>
                            </button>

                            {/* BOTÓN ENTREGAR / IMPRIMIR */}
                            <button
                              type="button"
                              onClick={() =>
                                setDeliverBudgetInfo({ budget: b, patient: b.patient })
                              }
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-extrabold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                              title="Ver formato oficial para entregar al cliente o imprimir"
                            >
                              <Printer className="w-3.5 h-3.5 text-teal-300" />
                              <span>Entregar</span>
                            </button>

                            {/* BOTÓN REGISTRAR ABONO */}
                            <button
                              type="button"
                              onClick={() => setSelectedPatientForPayment(b.patient)}
                              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                              title="Registrar abono para este paciente"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              <span>Abonar</span>
                            </button>

                            {/* BOTÓN ELIMINAR */}
                            <button
                              type="button"
                              onClick={() => handleDeleteBudget(b)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Eliminar presupuesto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Botón para Desplegar / Colapsar Fases y Procedimientos */}
                      <button
                        type="button"
                        onClick={() => toggleExpandBudget(b.id)}
                        className="w-full px-4 py-2 bg-slate-50/70 hover:bg-slate-100/80 border-b border-slate-100 text-xs font-bold text-slate-600 flex items-center justify-between transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {isExpanded
                              ? 'Ocultar desglose de fases y procedimientos'
                              : `Ver desglose de ${phasesCount} ${
                                  phasesCount === 1 ? 'fase' : 'fases'
                                } y ${totalProcedures} procedimientos`}
                          </span>
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </button>

                      {/* Desglose Expandible de Fases y Procedimientos */}
                      {isExpanded && (
                        <div className="p-4 sm:p-5 space-y-3 bg-white animate-in slide-in-from-top-1">
                          {(b.phases || []).map((ph, pIdx) => (
                            <div
                              key={ph.id || pIdx}
                              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2"
                            >
                              <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-md bg-teal-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0">
                                    {ph.phase_number || pIdx + 1}
                                  </span>
                                  <h5 className="font-extrabold text-xs text-slate-800">
                                    {ph.title}
                                  </h5>
                                </div>
                                <span className="text-xs font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                                  Subtotal: ${Number(ph.subtotal || 0).toFixed(2)} USD
                                </span>
                              </div>

                              <div className="space-y-1.5">
                                {(ph.items || []).map((it, itIdx) => (
                                  <div
                                    key={itIdx}
                                    className="flex items-center justify-between p-2 rounded-xl bg-white border border-slate-200/80 text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      {it.completed ? (
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                                      )}
                                      <span
                                        className={`font-medium truncate ${
                                          it.completed ? 'line-through text-slate-400' : 'text-slate-800'
                                        }`}
                                      >
                                        {it.description}
                                      </span>
                                      {it.tooth && (
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 shrink-0">
                                          {it.tooth}
                                        </span>
                                      )}
                                    </div>

                                    <div className="text-right shrink-0 font-bold text-slate-700">
                                      <span>${Number(it.cost || 0).toFixed(2)} USD</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          <div className="flex justify-end pt-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditBudget(b)}
                              className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              <span>Editar fases, procedimientos o costos de este presupuesto</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 2: CARTERA Y SALDOS POR PACIENTE (TABLA EJECUTIVA) */}
        {/* ============================================================== */}
        {activeTab === 'cartera' && (
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-slate-800 text-base">
                  Cartera de Tratamientos y Saldos de Pacientes
                </h4>
                <p className="text-xs text-slate-500">
                  Estado de cuenta individual de cada paciente atendido en el consultorio.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar paciente o cédula..."
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="button"
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
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPatientRows.map((row) => (
                    <tr key={row.patient.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {row.patient.full_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        <span>{row.patient.document_id || 'S/N'}</span>
                        <span className="text-slate-300 mx-1.5">•</span>
                        <span>{row.patient.phone || 'Sin tlf'}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-700">
                        ${row.totalBudget.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        ${row.totalPaid.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-rose-600">
                        ${row.pending.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.pending === 0 && row.totalBudget > 0 ? (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Solvente
                          </span>
                        ) : row.pending > 0 ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Saldo Pendiente
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                            Sin presupuesto
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Botón Editar o Crear Presupuesto */}
                          {row.primaryBudget ? (
                            <button
                              type="button"
                              onClick={() => handleOpenEditBudget(row.primaryBudget)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2.5 py-1.5 rounded-lg transition text-[11px] inline-flex items-center gap-1 shadow-2xs"
                              title="Editar el presupuesto y procedimientos de este paciente"
                            >
                              <Edit className="w-3 h-3 text-amber-700" />
                              <span>Editar</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleOpenCreateBudget(row.patient.id)}
                              className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-bold px-2.5 py-1.5 rounded-lg transition text-[11px] inline-flex items-center gap-1"
                              title="Crear presupuesto para este paciente"
                            >
                              <Plus className="w-3 h-3" />
                              <span>+ Presupuesto</span>
                            </button>
                          )}

                          {row.budgetsCount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const b = budgets.find((bg) => bg.patient_id === row.patient.id);
                                if (b) setDeliverBudgetInfo({ budget: b, patient: row.patient });
                              }}
                              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-2.5 py-1.5 rounded-lg transition text-[11px] inline-flex items-center gap-1 shadow-xs"
                              title="Entregar o imprimir presupuesto formal al cliente"
                            >
                              <Printer className="w-3 h-3 text-teal-300" />
                              <span>Entregar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setSelectedPatientForPayment(row.patient)}
                            className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-2.5 py-1.5 rounded-lg transition text-[11px] inline-flex items-center gap-1 shadow-xs"
                          >
                            <DollarSign className="w-3 h-3" />
                            <span>Abonar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredPatientRows.length === 0 && (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-500">
                        <div className="max-w-xs mx-auto space-y-2">
                          <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-700">
                            No hay pacientes registrados
                          </p>
                          <p className="text-[11px] text-slate-500">
                            Registra pacientes en el panel clínico para gestionar sus presupuestos y abonos.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* PESTAÑA 3: TARIFARIO Y PROCEDIMIENTOS INLINE DIRECTO */}
        {/* ============================================================== */}
        {activeTab === 'tarifario' && (
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-600" />
                  <span>Tarifario y Catálogo de Procedimientos Odontológicos</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Precios en $ USD y en Bolívares (Tasa BCV {exchangeRate.toFixed(2)} Bs/$). Todos los procedimientos pueden ser editados.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowProceduresModal(true)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
              >
                Abrir Administrador Completo de Procedimientos
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {(proceduresCatalog || []).map((proc) => {
                const costUsd = Number(proc.cost_usd) || 0;
                const costBs = costUsd * exchangeRate;
                return (
                  <div
                    key={proc.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-teal-300 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100/70 text-teal-800 truncate">
                          {proc.category}
                        </span>
                        <span className="text-sm font-extrabold text-teal-900 font-mono">
                          ${costUsd.toFixed(2)}
                        </span>
                      </div>
                      <h5 className="font-bold text-xs text-slate-800 mt-2 leading-tight">
                        {proc.name}
                      </h5>
                      {proc.notes && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {proc.notes}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-200 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">
                        ≈ {costBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowProceduresModal(true)}
                        className="text-xs font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal para Crear y Editar Presupuestos */}
      <BudgetModal
        isOpen={showBudgetModal}
        onClose={() => {
          setShowBudgetModal(false);
          setBudgetToEdit(null);
          setTargetPatientIdForBudget(null);
        }}
        patientId={targetPatientIdForBudget}
        budgetToEdit={budgetToEdit}
      />

      {/* Modal para Registrar Abonos / Pagos */}
      {selectedPatientForPayment && (
        <PaymentModal
          isOpen={true}
          onClose={() => setSelectedPatientForPayment(null)}
          patientId={selectedPatientForPayment.id}
          patientName={selectedPatientForPayment.full_name}
        />
      )}

      {/* Modal para Entregar / Imprimir el Presupuesto */}
      {deliverBudgetInfo && (
        <BudgetDeliverModal
          isOpen={Boolean(deliverBudgetInfo)}
          onClose={() => setDeliverBudgetInfo(null)}
          budget={deliverBudgetInfo.budget}
          patient={deliverBudgetInfo.patient}
          payments={payments}
          onEditBudget={(b) => handleOpenEditBudget(b)}
        />
      )}

      {/* Modal del Tarifario de Procedimientos */}
      <ProceduresCatalogModal
        isOpen={showProceduresModal}
        onClose={() => setShowProceduresModal(false)}
        mode="manager"
      />
    </div>
  );
}