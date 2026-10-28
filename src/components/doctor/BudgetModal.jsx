import React, { useState, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  X,
  Plus,
  Trash2,
  DollarSign,
  Layers,
  Sparkles,
  AlertCircle,
  FileText,
  CheckCircle2,
  Circle
} from 'lucide-react';

export default function BudgetModal({
  isOpen,
  onClose,
  patientId,
  budgetToEdit = null,
}) {
  const { addBudget, updateBudget, settings, bcvInfo } = useDental();
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const isEditing = Boolean(budgetToEdit);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('activo');
  const [phases, setPhases] = useState([]);
  const [error, setError] = useState('');

  // Cargar datos cuando abre el modal
  useEffect(() => {
    if (budgetToEdit) {
      setTitle(budgetToEdit.title || '');
      setNotes(budgetToEdit.notes || '');
      setStatus(budgetToEdit.status || 'activo');
      if (budgetToEdit.phases && budgetToEdit.phases.length > 0) {
        setPhases(
          budgetToEdit.phases.map((ph, idx) => ({
            id: ph.id || `phase-${Date.now()}-${idx + 1}`,
            phase_number: ph.phase_number || idx + 1,
            title: ph.title || `Fase ${idx + 1}`,
            status: ph.status || 'pendiente',
            items: (ph.items || []).map((it) => ({
              description: it.description || '',
              cost: it.cost !== undefined ? it.cost : 0,
              completed: Boolean(it.completed),
            })),
          }))
        );
      } else {
        setPhases([
          {
            id: `phase-${Date.now()}-1`,
            phase_number: 1,
            title: 'Fase 1: Diagnóstico y Saneamiento',
            status: 'pendiente',
            items: [{ description: 'Evaluación odontológica integral y tartrectomía', cost: 40, completed: false }],
          },
        ]);
      }
    } else {
      // Valores por defecto para nuevo presupuesto
      setTitle('Plan Odontológico Integral');
      setNotes('Se requiere abono del 50% al iniciar cada fase y saldo al culminar el procedimiento.');
      setStatus('activo');
      setPhases([
        {
          id: `phase-${Date.now()}-1`,
          phase_number: 1,
          title: 'Fase 1: Saneamiento y Profilaxis',
          status: 'pendiente',
          items: [
            { description: 'Evaluación clínica completa y limpieza ultrasónica', cost: 35, completed: false },
          ],
        },
        {
          id: `phase-${Date.now()}-2`,
          phase_number: 2,
          title: 'Fase 2: Restauraciones Estéticas / Tratamiento',
          status: 'pendiente',
          items: [
            { description: 'Restauración con resina fotocurada estética', cost: 45, completed: false },
          ],
        },
      ]);
    }
    setError('');
  }, [budgetToEdit, isOpen]);

  if (!isOpen) return null;

  // Cálculos en tiempo real
  const grandTotalUsd = phases.reduce((acc, ph) => {
    const phSubtotal = (ph.items || []).reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
    return acc + phSubtotal;
  }, 0);

  const grandTotalBs = grandTotalUsd * exchangeRate;

  // Manejadores de fases
  const handleAddPhase = () => {
    setPhases((prev) => [
      ...prev,
      {
        id: `phase-${Date.now()}-${prev.length + 1}`,
        phase_number: prev.length + 1,
        title: `Fase ${prev.length + 1}: Procedimientos Especializados`,
        status: 'pendiente',
        items: [{ description: '', cost: 0, completed: false }],
      },
    ]);
  };

  const handleRemovePhase = (phaseIndex) => {
    if (phases.length === 1) {
      setError('El presupuesto debe tener al menos una fase de tratamiento.');
      return;
    }
    setPhases((prev) => {
      const filtered = prev.filter((_, idx) => idx !== phaseIndex);
      return filtered.map((ph, idx) => ({ ...ph, phase_number: idx + 1 }));
    });
    setError('');
  };

  const handlePhaseTitleChange = (phaseIndex, newTitle) => {
    setPhases((prev) => {
      const updated = [...prev];
      updated[phaseIndex].title = newTitle;
      return updated;
    });
  };

  // Manejadores de items
  const handleAddItem = (phaseIndex) => {
    setPhases((prev) => {
      const updated = [...prev];
      updated[phaseIndex].items.push({ description: '', cost: 0, completed: false });
      return updated;
    });
  };

  const handleRemoveItem = (phaseIndex, itemIndex) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[phaseIndex].items.length === 1) {
        setError('Cada fase debe incluir al menos un procedimiento o descripción.');
        return prev;
      }
      updated[phaseIndex].items = updated[phaseIndex].items.filter((_, idx) => idx !== itemIndex);
      return updated;
    });
    setError('');
  };

  const handleItemChange = (phaseIndex, itemIndex, field, value) => {
    setPhases((prev) => {
      const updated = [...prev];
      updated[phaseIndex].items[itemIndex][field] = value;
      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim()) {
      setError('Por favor indica un título para el presupuesto.');
      return;
    }

    if (phases.length === 0) {
      setError('Debes agregar al menos una fase de tratamiento.');
      return;
    }

    // Validar que cada fase tenga items con descripción
    for (let i = 0; i < phases.length; i++) {
      const ph = phases[i];
      if (!ph.title.trim()) {
        setError(`La Fase ${i + 1} requiere un título.`);
        return;
      }
      if (!ph.items || ph.items.length === 0) {
        setError(`La Fase "${ph.title}" debe tener al menos un procedimiento.`);
        return;
      }
      for (let j = 0; j < ph.items.length; j++) {
        if (!ph.items[j].description.trim()) {
          setError(`Completa la descripción del procedimiento ${j + 1} en la Fase "${ph.title}".`);
          return;
        }
      }
    }

    // Formatear fases con subtotales calculados
    const formattedPhases = phases.map((ph, idx) => {
      const subtotal = ph.items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
      const allCompleted = ph.items.length > 0 && ph.items.every((it) => it.completed);
      const anyCompleted = ph.items.some((it) => it.completed);
      const computedStatus = allCompleted ? 'completada' : anyCompleted ? 'en_progreso' : ph.status || 'pendiente';

      return {
        id: ph.id || `phase-${Date.now()}-${idx + 1}`,
        phase_number: idx + 1,
        title: ph.title.trim(),
        status: computedStatus,
        subtotal,
        items: ph.items.map((it) => ({
          description: it.description.trim(),
          cost: Number(it.cost) || 0,
          completed: Boolean(it.completed),
        })),
      };
    });

    const payload = {
      patient_id: patientId,
      title: title.trim(),
      notes: notes.trim(),
      status,
      total_amount: grandTotalUsd,
      phases: formattedPhases,
    };

    if (isEditing) {
      updateBudget(budgetToEdit.id, payload);
    } else {
      addBudget(payload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Cabecera del Modal */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
              <Layers className="w-5 h-5 text-teal-200" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-extrabold truncate">
                {isEditing ? 'Editar Presupuesto de Tratamiento' : 'Nuevo Presupuesto por Fases'}
              </h3>
              <p className="text-xs text-teal-200 truncate">
                Dra. Adriana Parra • Planificación financiera para el paciente
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition shrink-0"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Flotante de Totales */}
        <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-teal-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Total Presupuestado:</span>
            <span className="text-base font-extrabold text-teal-800">
              ${grandTotalUsd.toFixed(2)} USD
            </span>
            <span className="text-slate-500 font-mono">
              (~Bs. {grandTotalBs.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-600">
            <span className="font-semibold">{phases.length} {phases.length === 1 ? 'fase' : 'fases'}</span>
            <span>•</span>
            <span className="font-mono text-teal-800 font-bold">Tasa: {exchangeRate.toFixed(1)} Bs/$</span>
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Título y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Título del Plan de Tratamiento *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ej: Plan Integral de Prótesis y Estética"
                className="w-full px-3.5 py-2.5 text-xs font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Estado del Presupuesto
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="activo">Activo (En Curso)</option>
                <option value="completada">Completado</option>
                <option value="pausado">Pausado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Notas y Condiciones */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Condiciones de Pago y Notas para el Cliente
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Abono del 50% al iniciar la fase. Se aceptan divisas, Pago Móvil o Zelle."
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Estructura de Fases */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                  Fases del Tratamiento Odontológico
                </h4>
                <p className="text-[11px] text-slate-500">
                  Organiza los procedimientos por etapas para que la doctora y el paciente lleven el control exacto de los abonos.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddPhase}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Otra Fase</span>
              </button>
            </div>

            {phases.map((phase, pIdx) => {
              const phaseSubtotal = (phase.items || []).reduce(
                (sum, it) => sum + (Number(it.cost) || 0),
                0
              );

              return (
                <div
                  key={phase.id || pIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3 relative group"
                >
                  {/* Encabezado de la fase */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200">
                    <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                      <span className="w-6 h-6 rounded-lg bg-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0">
                        {pIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={phase.title}
                        onChange={(e) => handlePhaseTitleChange(pIdx, e.target.value)}
                        placeholder={`Título de la Fase ${pIdx + 1}`}
                        className="flex-1 px-2.5 py-1 text-xs font-bold text-slate-900 rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-extrabold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-lg">
                        Subtotal: ${phaseSubtotal.toFixed(2)}
                      </span>

                      {phases.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhase(pIdx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Eliminar esta fase"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lista de procedimientos en la fase */}
                  <div className="space-y-2">
                    {phase.items.map((item, itIdx) => (
                      <div
                        key={itIdx}
                        className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition"
                      >
                        {/* Checkbox de completado */}
                        <button
                          type="button"
                          onClick={() =>
                            handleItemChange(pIdx, itIdx, 'completed', !item.completed)
                          }
                          className="p-1 text-slate-400 hover:text-teal-600 transition shrink-0"
                          title={item.completed ? 'Marcar como pendiente' : 'Marcar como completado'}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300" />
                          )}
                        </button>

                        {/* Descripción del procedimiento */}
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) =>
                            handleItemChange(pIdx, itIdx, 'description', e.target.value)
                          }
                          placeholder="Descripción del procedimiento (ej: Restauración resina pieza 14)"
                          className={`flex-1 px-2.5 py-1 text-xs rounded-lg border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                            item.completed ? 'line-through text-slate-400' : 'text-slate-800 font-medium'
                          }`}
                          required
                        />

                        {/* Costo en USD */}
                        <div className="flex items-center gap-1 shrink-0 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                          <span className="text-xs font-bold text-slate-500">$</span>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            value={item.cost}
                            onChange={(e) =>
                              handleItemChange(pIdx, itIdx, 'cost', e.target.value)
                            }
                            placeholder="0"
                            className="w-16 sm:w-20 py-0.5 text-xs font-bold text-slate-900 bg-transparent text-right focus:outline-none"
                            required
                          />
                        </div>

                        {/* Eliminar item */}
                        {phase.items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(pIdx, itIdx)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition shrink-0"
                            title="Eliminar procedimiento"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Botón para añadir procedimiento a la fase */}
                  <button
                    type="button"
                    onClick={() => handleAddItem(pIdx)}
                    className="text-xs text-teal-600 hover:text-teal-700 font-bold inline-flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir procedimiento a esta fase</span>
                  </button>
                </div>
              );
            })}
          </div>

          {/* Botones de acción inferiores */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              <span>{isEditing ? 'Guardar Cambios del Presupuesto' : 'Crear Presupuesto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
