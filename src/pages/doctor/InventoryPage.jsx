import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import DoctorHeader from '../../components/doctor/DoctorHeader';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  Minus,
  Edit,
  Trash2,
  RefreshCw,
  TrendingDown,
  X,
  Filter,
  DollarSign
} from 'lucide-react';

export default function InventoryPage() {
  const {
    inventory,
    lowStockItems,
    lowStockCount,
    updateInventoryQuantity,
    addInventoryItem,
    updateInventoryItem,
    deleteInventoryItem,
    settings,
    bcvInfo,
    showToast,
  } = useDental();

  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('todas');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Formulario nuevo insumo
  const [formData, setFormData] = useState({
    name: '',
    category: 'Restauración y Estética',
    quantity: 1,
    min_quantity: 2,
    unit: 'unidades',
    cost_usd: 0,
    notes: '',
  });

  const categories = [
    'todas',
    'Anestesia',
    'Restauración y Estética',
    'Adhesión',
    'Descartables',
    'Bioseguridad',
    'Endodoncia',
    'Prevención',
  ];

  // Filtros
  const filteredInventory = (inventory || []).filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch =
      !q ||
      String(item.name || '').toLowerCase().includes(q) ||
      String(item.category || '').toLowerCase().includes(q) ||
      String(item.notes || '').toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === 'todas' || item.category === selectedCategory;

    const isLow = (Number(item.quantity) || 0) <= (Number(item.min_quantity) || 1);
    const matchesLowStock = !onlyLowStock || isLow;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const totalInventoryValueUsd = (inventory || []).reduce(
    (acc, curr) => acc + (Number(curr.quantity) || 0) * (Number(curr.cost_usd) || 0),
    0
  );

  const handleSubmitItem = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        ...formData,
        quantity: Number(formData.quantity) || 0,
        min_quantity: Number(formData.min_quantity) || 1,
        cost_usd: Number(formData.cost_usd) || 0,
      });
      setEditingItem(null);
    } else {
      addInventoryItem({
        ...formData,
        quantity: Number(formData.quantity) || 0,
        min_quantity: Number(formData.min_quantity) || 1,
        cost_usd: Number(formData.cost_usd) || 0,
        last_restocked: new Date().toISOString().split('T')[0],
      });
    }

    setFormData({
      name: '',
      category: 'Restauración y Estética',
      quantity: 1,
      min_quantity: 2,
      unit: 'unidades',
      cost_usd: 0,
      notes: '',
    });
    setShowAddModal(false);
  };

  const handleEditClick = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Restauración y Estética',
      quantity: item.quantity,
      min_quantity: item.min_quantity,
      unit: item.unit || 'unidades',
      cost_usd: item.cost_usd || 0,
      notes: item.notes || '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen">
      <DoctorHeader
        title="Inventario y Control de Insumos Odontológicos"
        subtitle="Monitoreo de anestesias, resinas 3M, descartables y alertas de reposición de materiales en consultorio"
      />

      <div className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-7xl w-full mx-auto space-y-5">
        
        {/* Tarjetas de Resumen Superior */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Insumos en Catálogo
              </span>
              <span className="text-2xl font-black text-slate-900 mt-0.5 block">
                {inventory?.length || 0} materiales
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
          </div>

          <div className={`p-4 rounded-3xl border shadow-2xs flex items-center justify-between transition ${
            lowStockCount > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-white border-slate-200'
          }`}>
            <div>
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
                Alertas de Stock Bajo
              </span>
              <span className="text-2xl font-black text-amber-700 mt-0.5 block flex items-center gap-1.5">
                <span>{lowStockCount} por reponer</span>
                {lowStockCount > 0 && <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />}
              </span>
            </div>
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                onlyLowStock ? 'bg-amber-600 text-white' : 'bg-amber-200/60 text-amber-900 hover:bg-amber-200'
              }`}
            >
              {onlyLowStock ? 'Ver Todos' : 'Filtrar Críticos'}
            </button>
          </div>

          <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Valor Total del Inventario
              </span>
              <span className="text-2xl font-black text-emerald-700 mt-0.5 block font-mono">
                ${totalInventoryValueUsd.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                ≈ {(totalInventoryValueUsd * exchangeRate).toFixed(2)} Bs (BCV)
              </span>
            </div>
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Barra de Filtros y Acciones */}
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar material por nombre o categoría..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 font-semibold text-slate-700 focus:bg-white focus:ring-2 focus:ring-teal-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c === 'todas' ? 'Todas las Categorías' : c}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '',
                category: 'Restauración y Estética',
                quantity: 1,
                min_quantity: 2,
                unit: 'unidades',
                cost_usd: 0,
                notes: '',
              });
              setShowAddModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition shadow-xs shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Insumo</span>
          </button>
        </div>

        {/* Tabla / Cuadrícula de Materiales */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Material / Insumo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Stock Actual</th>
                  <th className="py-3 px-4 text-center">Alerta Mínima</th>
                  <th className="py-3 px-4 text-right">Costo Unit. ($)</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones Rápidas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInventory.map((item) => {
                  const qty = Number(item.quantity) || 0;
                  const min = Number(item.min_quantity) || 1;
                  const isLow = qty <= min;
                  const isCritical = qty === 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 font-normal">{item.notes}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {item.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono text-sm font-extrabold text-slate-900">
                          {qty} {item.unit}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-500 font-mono">
                        {min} {item.unit}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-800">
                        ${(Number(item.cost_usd) || 0).toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        {isCritical ? (
                          <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            🔴 Agotado
                          </span>
                        ) : isLow ? (
                          <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            ⚠️ Stock Bajo
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Óptimo
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Ajuste rápido -1 / +1 en el sillón */}
                          <button
                            type="button"
                            onClick={() => updateInventoryQuantity(item.id, -1)}
                            disabled={qty <= 0}
                            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition"
                            title="Restar 1 unidad utilizada en consulta"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => updateInventoryQuantity(item.id, 1)}
                            className="p-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                            title="Sumar 1 unidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition ml-1"
                            title="Editar insumo"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`¿Deseas eliminar "${item.name}" del inventario?`)) {
                                deleteInventoryItem(item.id);
                              }
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                            title="Eliminar insumo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">
                      <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-bold text-slate-700">No hay insumos que coincidan con la búsqueda</p>
                      <p className="text-[11px] text-slate-400">Prueba cambiando los filtros o registra uno nuevo con el botón superior.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal para Crear / Editar Insumo */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                {editingItem ? 'Editar Insumo Odontológico' : 'Registrar Nuevo Insumo'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitItem} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nombre del Insumo / Material *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Resina 3M Filtek Tono A2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Categoría</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500 font-semibold"
                  >
                    {categories.filter((c) => c !== 'todas').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="cartuchos, jeringas, cajas..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Stock Actual</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-center font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mínimo Alerta</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.min_quantity}
                    onChange={(e) => setFormData({ ...formData, min_quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-center font-bold text-amber-700"
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Costo Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_usd}
                    onChange={(e) => setFormData({ ...formData, cost_usd: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-center font-bold text-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observaciones / Indicación</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Ej: Solo para pacientes con anestesia sin vaso..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold transition shadow-xs"
                >
                  {editingItem ? 'Guardar Cambios' : 'Registrar Insumo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
