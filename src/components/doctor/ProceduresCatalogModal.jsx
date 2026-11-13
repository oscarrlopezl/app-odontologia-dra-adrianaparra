import React, { useState, useMemo } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  X,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  Tag,
} from 'lucide-react';

export const PROCEDURE_CATEGORIES = [
  'Todas',
  'Diagnóstico y Prevención',
  'Operatoria y Estética',
  'Cirugía y Exodoncia',
  'Endodoncia',
  'Estética Dental',
  'Prótesis y Rehabilitación',
  'Odontopediatría',
];

export default function ProceduresCatalogModal({
  isOpen,
  onClose,
  mode = 'manager', // 'manager' | 'picker'
  onSelectProcedure = null,
}) {
  const {
    proceduresCatalog,
    addProcedureToCatalog,
    updateProcedureInCatalog,
    deleteProcedureFromCatalog,
    resetProceduresCatalog,
    settings,
    bcvInfo,
  } = useDental();

  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProcId, setEditingProcId] = useState(null);

  // Formulario de creación
  const [formData, setFormData] = useState({
    name: '',
    category: 'Operatoria y Estética',
    cost_usd: '',
    estimated_minutes: 45,
    notes: '',
  });

  // Formulario de edición inline
  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    cost_usd: '',
    estimated_minutes: 45,
    notes: '',
  });

  // Filtrado de procedimientos
  const filteredProcedures = useMemo(() => {
    return (proceduresCatalog || []).filter((p) => {
      const matchesSearch =
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.notes || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [proceduresCatalog, searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleStartEdit = (proc) => {
    setEditingProcId(proc.id);
    setEditFormData({
      name: proc.name || '',
      category: proc.category || 'Operatoria y Estética',
      cost_usd: proc.cost_usd !== undefined ? String(proc.cost_usd) : '0',
      estimated_minutes: proc.estimated_minutes || 45,
      notes: proc.notes || '',
    });
  };

  const handleSaveEdit = (procId) => {
    if (!editFormData.name.trim()) return;
    updateProcedureInCatalog(procId, {
      name: editFormData.name.trim(),
      category: editFormData.category,
      cost_usd: Number(editFormData.cost_usd) || 0,
      estimated_minutes: Number(editFormData.estimated_minutes) || 45,
      notes: editFormData.notes.trim(),
    });
    setEditingProcId(null);
  };

  const handleCreateProcedure = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    addProcedureToCatalog({
      name: formData.name.trim(),
      category: formData.category,
      cost_usd: Number(formData.cost_usd) || 0,
      estimated_minutes: Number(formData.estimated_minutes) || 45,
      notes: formData.notes.trim(),
    });

    setFormData({
      name: '',
      category: 'Operatoria y Estética',
      cost_usd: '',
      estimated_minutes: 45,
      notes: '',
    });
    setShowAddForm(false);
  };

  const handleDeleteProcedure = (proc) => {
    if (
      window.confirm(
        `¿Deseas eliminar el procedimiento "${proc.name}" del tarifario?`
      )
    ) {
      deleteProcedureFromCatalog(proc.id);
    }
  };

  const handleResetCatalog = () => {
    if (
      window.confirm(
        '¿Deseas restablecer el tarifario original con los 34 procedimientos especializados recomendados para Venezuela? Tus procedimientos actuales serán restaurados.'
      )
    ) {
      resetProceduresCatalog();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
              <Sparkles className="w-5 h-5 text-teal-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold truncate">
                {mode === 'picker'
                  ? 'Seleccionar Procedimiento del Tarifario'
                  : 'Tarifario y Catálogo de Procedimientos Odontológicos'}
              </h3>
              <p className="text-xs text-teal-200 truncate">
                Dra. Adriana Parra • Edita precios en $ y Bs BCV para tus presupuestos
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Tasa BCV y Acciones Superiores */}
        <div className="px-5 sm:px-6 py-2.5 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Tasa BCV del día:</span>
            <span className="font-mono font-extrabold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
              1 USD = {exchangeRate.toFixed(2)} Bs
            </span>
            <span className="text-[11px] text-slate-500">
              ({proceduresCatalog?.length || 0} procedimientos registrados)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {mode === 'manager' && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-lg text-xs shadow-xs transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddForm ? 'Cerrar Formulario' : 'Nuevo Procedimiento'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCatalog}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold rounded-lg text-xs transition"
                  title="Restablecer tarifario estándar de fábrica"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span className="hidden sm:inline">Restablecer</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Formulario para Crear Nuevo Procedimiento */}
        {showAddForm && (
          <form
            onSubmit={handleCreateProcedure}
            className="p-4 sm:p-5 bg-teal-900 text-white border-b border-teal-800 space-y-3 animate-in slide-in-from-top-3"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-200 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Agregar Nuevo Procedimiento al Tarifario</span>
              </h4>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="text-teal-300 hover:text-white text-xs"
              >
                Cancelar
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
              <div className="sm:col-span-6">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">
                  Nombre del Procedimiento *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Carilla de Resina Estratificada Directa"
                  className="w-full px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700 text-white placeholder:text-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400 font-medium"
                  required
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">
                  Categoría
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700 text-white focus:outline-none focus:ring-1 focus:ring-teal-400 font-medium"
                >
                  {PROCEDURE_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                    <option key={cat} value={cat} className="bg-slate-900 text-white">
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">
                  Precio Estándar ($ USD) *
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-teal-300 font-bold">$</span>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={formData.cost_usd}
                    onChange={(e) => setFormData({ ...formData, cost_usd: e.target.value })}
                    placeholder="0.00"
                    className="w-full pl-6 pr-2.5 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700 text-white placeholder:text-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400 font-bold"
                    required
                  />
                </div>
                {Number(formData.cost_usd) > 0 && (
                  <p className="text-[10px] text-teal-300 font-mono mt-0.5">
                    ≈ {(Number(formData.cost_usd) * exchangeRate).toFixed(2)} Bs
                  </p>
                )}
              </div>

              <div className="sm:col-span-9">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-teal-200 mb-1">
                  Notas Clínicas / Indicaciones (Opcional)
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Incluye pulido y control a las 48 horas..."
                  className="w-full px-3 py-1.5 rounded-lg bg-teal-950/80 border border-teal-700 text-white placeholder:text-teal-400/60 focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>

              <div className="sm:col-span-3 flex items-end">
                <button
                  type="submit"
                  className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-extrabold rounded-lg text-xs transition shadow-sm"
                >
                  Guardar en Tarifario
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Buscador y Pestañas de Categorías */}
        <div className="p-4 sm:p-5 border-b border-slate-100 space-y-3 bg-white">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar procedimiento por nombre (ej: Resina, Cordal, Conducto, Limpieza, Corona)..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          {/* Categorías en Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {PROCEDURE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition text-xs shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Procedimientos */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5">
          {filteredProcedures.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-bold text-slate-600">No se encontraron procedimientos</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Prueba con otro término de búsqueda o agrega un nuevo procedimiento.
              </p>
            </div>
          ) : (
            filteredProcedures.map((proc) => {
              const isEditingThis = editingProcId === proc.id;
              const costUsd = Number(proc.cost_usd) || 0;
              const costBs = costUsd * exchangeRate;

              if (isEditingThis) {
                return (
                  <div
                    key={proc.id}
                    className="p-3.5 bg-amber-50/70 rounded-2xl border-2 border-amber-300 shadow-sm space-y-2 animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-amber-800 flex items-center gap-1">
                        <Edit2 className="w-3 h-3" />
                        <span>Editando Procedimiento</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(proc.id)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Guardar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingProcId(null)}
                          className="px-2 py-1 text-slate-600 hover:bg-slate-200 text-xs font-semibold rounded-lg"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                      <div className="sm:col-span-6">
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, name: e.target.value })
                          }
                          className="w-full px-2.5 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="Nombre del procedimiento"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <select
                          value={editFormData.category}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, category: e.target.value })
                          }
                          className="w-full px-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        >
                          {PROCEDURE_CATEGORIES.filter((c) => c !== 'Todas').map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-3">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={editFormData.cost_usd}
                            onChange={(e) =>
                              setEditFormData({ ...editFormData, cost_usd: e.target.value })
                            }
                            className="w-full pl-5 pr-2 py-1.5 bg-white border border-amber-300 rounded-lg text-xs font-bold text-slate-800 text-right focus:outline-none focus:ring-1 focus:ring-amber-500"
                            placeholder="Precio USD"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-12">
                        <input
                          type="text"
                          value={editFormData.notes}
                          onChange={(e) =>
                            setEditFormData({ ...editFormData, notes: e.target.value })
                          }
                          className="w-full px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500"
                          placeholder="Notas o descripción clínica adicional"
                        />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={proc.id}
                  className="p-3 sm:p-4 rounded-2xl border border-slate-200 hover:border-teal-300 hover:bg-slate-50/60 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-800 leading-snug">
                        {proc.name}
                      </h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200">
                        {proc.category}
                      </span>
                    </div>

                    {proc.notes && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {proc.notes}
                      </p>
                    )}
                  </div>

                  {/* Precios y Botones de Acción */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-100">
                    <div className="text-right">
                      <span className="text-base font-extrabold text-teal-800 block leading-tight">
                        ${costUsd.toFixed(2)} USD
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono font-medium block">
                        ≈ {costBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs
                      </span>
                    </div>

                    {/* Modo Selección para Presupuesto */}
                    {mode === 'picker' && onSelectProcedure && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectProcedure(proc);
                          onClose();
                        }}
                        className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition active:scale-95 flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Usar</span>
                      </button>
                    )}

                    {/* Modo Administración: Editar y Eliminar */}
                    {mode === 'manager' && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(proc)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                          title="Editar nombre, precio o categoría"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteProcedure(proc)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar del tarifario"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie de Página */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 rounded-b-3xl flex items-center justify-between text-xs">
          <p className="text-slate-500 text-[11px]">
            * Los precios fijados en el tarifario se aplican automáticamente al presupuestar, pero siempre podrás ajustarlos por paciente.
          </p>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition text-xs shrink-0"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}