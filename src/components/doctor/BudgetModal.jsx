import React, { useState, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import ProceduresCatalogModal from './ProceduresCatalogModal';
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
  Circle,
  User,
  Copy,
  ChevronDown,
  Tag,
  Search,
} from 'lucide-react';

export default function BudgetModal({
  isOpen,
  onClose,
  patientId = null,
  budgetToEdit = null,
  onSaved = null,
}) {
  const { addBudget, updateBudget, patients, settings, bcvInfo } = useDental();
  const exchangeRate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || 887.30);

  const isEditing = Boolean(budgetToEdit);

  // Paciente seleccionado
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [patientSearch, setPatientSearch] = useState('');

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('activo');
  const [phases, setPhases] = useState([]);
  const [error, setError] = useState('');

  // Modal para seleccionar procedimientos del tarifario
  const [pickerTargetPhaseIdx, setPickerTargetPhaseIdx] = useState(null);
  const [showCatalogPicker, setShowCatalogPicker] = useState(false);

  // Inicializar estado al abrir o cambiar presupuesto a editar
  useEffect(() => {
    if (!isOpen) return;

    if (budgetToEdit) {
      setSelectedPatientId(budgetToEdit.patient_id || patientId || '');
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
              tooth: it.tooth || '',
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
            items: [
              {
                description: 'Evaluación odontológica integral y tartrectomía',
                cost: 40,
                tooth: 'General',
                completed: false,
              },
            ],
          },
        ]);
      }
    } else {
      // Nuevo presupuesto
      setSelectedPatientId(patientId || patients?.[0]?.id || '');
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
            {
              description: 'Evaluación clínica completa y tartrectomía ultrasónica',
              cost: 35,
              tooth: 'General',
              completed: false,
            },
          ],
        },
        {
          id: `phase-${Date.now()}-2`,
          phase_number: 2,
          title: 'Fase 2: Restauraciones Estéticas / Tratamiento',
          status: 'pendiente',
          items: [
            {
              description: 'Restauración con resina fotocurada estética',
              cost: 45,
              tooth: 'Pieza #14',
              completed: false,
            },
          ],
        },
      ]);
    }
    setError('');
    setPatientSearch('');
  }, [budgetToEdit, isOpen, patientId, patients]);

  if (!isOpen) return null;

  // Paciente actual seleccionado
  const currentPatient = (patients || []).find((p) => p.id === selectedPatientId);

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
        items: [{ description: '', cost: 0, tooth: '', completed: false }],
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

  // Manejadores de items / procedimientos
  const handleAddCustomItem = (phaseIndex) => {
    setPhases((prev) => {
      const updated = [...prev];
      updated[phaseIndex].items.push({ description: '', cost: 0, tooth: '', completed: false });
      return updated;
    });
  };

  const handleDuplicateItem = (phaseIndex, itemIndex) => {
    setPhases((prev) => {
      const updated = [...prev];
      const original = updated[phaseIndex].items[itemIndex];
      updated[phaseIndex].items.splice(itemIndex + 1, 0, {
        ...original,
        description: `${original.description} (Copia)`,
        completed: false,
      });
      return updated;
    });
  };

  const handleRemoveItem = (phaseIndex, itemIndex) => {
    setPhases((prev) => {
      const updated = [...prev];
      if (updated[phaseIndex].items.length === 1) {
        setError('Cada fase debe incluir al menos un procedimiento.');
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

  // Apertura del catálogo para añadir a una fase específica
  const handleOpenCatalogForPhase = (phaseIndex) => {
    setPickerTargetPhaseIdx(phaseIndex);
    setShowCatalogPicker(true);
  };

  // Callback al seleccionar un procedimiento del catálogo
  const handleSelectProcedureFromCatalog = (procedure) => {
    if (pickerTargetPhaseIdx === null) return;
    setPhases((prev) => {
      const updated = [...prev];
      const targetItems = updated[pickerTargetPhaseIdx].items;

      // Si el primer item está vacío, rellenarlo; si no, agregar uno nuevo
      if (targetItems.length === 1 && !targetItems[0].description.trim() && targetItems[0].cost === 0) {
        targetItems[0] = {
          description: procedure.name,
          cost: Number(procedure.cost_usd) || 0,
          tooth: '',
          completed: false,
        };
      } else {
        targetItems.push({
          description: procedure.name,
          cost: Number(procedure.cost_usd) || 0,
          tooth: '',
          completed: false,
        });
      }
      return updated;
    });
    setShowCatalogPicker(false);
    setPickerTargetPhaseIdx(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!selectedPatientId) {
      setError('Por favor selecciona el paciente al que pertenece este presupuesto.');
      return;
    }

    if (!title.trim()) {
      setError('Por favor indica un título para el presupuesto.');
      return;
    }

    if (phases.length === 0) {
      setError('Debes agregar al menos una fase de tratamiento.');
      return;
    }

    // Validar fases e items
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

    // Formatear fases con subtotales
    const formattedPhases = phases.map((ph, idx) => {
      const subtotal = ph.items.reduce((sum, it) => sum + (Number(it.cost) || 0), 0);
      const allCompleted = ph.items.length > 0 && ph.items.every((it) => it.completed);
      const anyCompleted = ph.items.some((it) => it.completed);
      const computedStatus = allCompleted
        ? 'completada'
        : anyCompleted
        ? 'en_progreso'
        : ph.status || 'pendiente';

      return {
        id: ph.id || `phase-${Date.now()}-${idx + 1}`,
        phase_number: idx + 1,
        title: ph.title.trim(),
        status: computedStatus,
        subtotal,
        items: ph.items.map((it) => ({
          description: it.description.trim(),
          cost: Number(it.cost) || 0,
          tooth: (it.tooth || '').trim(),
          completed: Boolean(it.completed),
        })),
      };
    });

    const payload = {
      patient_id: selectedPatientId,
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

    if (onSaved) onSaved(payload);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 my-6 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
          {/* Cabecera del Modal */}
          <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white rounded-t-3xl">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20 shadow-xs">
                <Layers className="w-5 h-5 text-teal-200" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-extrabold truncate">
                  {isEditing ? 'Editar Presupuesto y Procedimientos' : 'Nuevo Presupuesto por Fases'}
                </h3>
                <p className="text-xs text-teal-200 truncate">
                  Dra. Adriana Parra • Edición completa de fases, procedimientos y costos
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
              <span className="font-semibold">
                {phases.length} {phases.length === 1 ? 'fase' : 'fases'}
              </span>
              <span>•</span>
              <span className="font-mono text-teal-800 font-bold">
                Tasa BCV: {exchangeRate.toFixed(2)} Bs/$
              </span>
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

            {/* Selección de Paciente (Si no viene fijado o para cambiarlo) */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-teal-600" />
                <span>Paciente Asignado al Presupuesto *</span>
              </label>

              {patientId && currentPatient ? (
                <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200">
                  <div>
                    <span className="font-extrabold text-xs text-slate-800">{currentPatient.full_name}</span>
                    <span className="text-[11px] text-slate-500 ml-2 font-mono">
                      CI: {currentPatient.document_id} • Tel: {currentPatient.phone}
                    </span>
                  </div>
                  <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-md">
                    Expediente Activo
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs font-bold text-slate-800 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  >
                    <option value="">-- Selecciona el Paciente --</option>
                    {(patients || []).map((pat) => (
                      <option key={pat.id} value={pat.id}>
                        {pat.full_name} — CI: {pat.document_id || 'S/N'} {pat.phone ? `(${pat.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

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
                placeholder="Ej: Abono del 50% al iniciar cada fase. Se aceptan divisas, Pago Móvil o Zelle."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Estructura de Fases y Procedimientos */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Fases y Procedimientos Odontológicos
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Edita el nombre del procedimiento, pieza dental y costo en $ a cobrar.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs rounded-xl border border-teal-200 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar Fase</span>
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
                          Subtotal: ${phaseSubtotal.toFixed(2)} USD
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
                          className="p-2.5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2"
                        >
                          <div className="flex items-center gap-2 flex-1 min-w-0">
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

                            {/* Descripción editable del procedimiento */}
                            <input
                              type="text"
                              value={item.description}
                              onChange={(e) =>
                                handleItemChange(pIdx, itIdx, 'description', e.target.value)
                              }
                              placeholder="Procedimiento (ej: Resina fotocurada, Endodoncia, Corona...)"
                              className={`flex-1 px-2 py-1 text-xs rounded-lg border border-slate-200 sm:border-0 bg-slate-50 sm:bg-transparent focus:outline-none focus:ring-1 focus:ring-teal-500 ${
                                item.completed
                                  ? 'line-through text-slate-400'
                                  : 'text-slate-800 font-semibold'
                              }`}
                              required
                            />
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0">
                            {/* Pieza dental o sector (opcional) */}
                            <input
                              type="text"
                              value={item.tooth || ''}
                              onChange={(e) =>
                                handleItemChange(pIdx, itIdx, 'tooth', e.target.value)
                              }
                              placeholder="Diente (ej: #14)"
                              className="w-24 px-2 py-1 text-[11px] font-mono text-slate-700 bg-slate-100 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
                              title="Indica la pieza dental o arcada tratada"
                            />

                            {/* Costo en USD */}
                            <div className="flex items-center gap-1 bg-teal-50/60 px-2 py-0.5 rounded-lg border border-teal-200">
                              <span className="text-xs font-bold text-teal-800">$</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.cost}
                                onChange={(e) =>
                                  handleItemChange(pIdx, itIdx, 'cost', e.target.value)
                                }
                                placeholder="0"
                                className="w-16 py-0.5 text-xs font-bold text-teal-900 bg-transparent text-right focus:outline-none"
                                required
                              />
                            </div>

                            {/* Botón Duplicar Procedimiento */}
                            <button
                              type="button"
                              onClick={() => handleDuplicateItem(pIdx, itIdx)}
                              className="p-1 text-slate-400 hover:text-teal-600 rounded-md transition"
                              title="Duplicar procedimiento"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Eliminar procedimiento */}
                            {phase.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(pIdx, itIdx)}
                                className="p-1 text-slate-400 hover:text-rose-500 rounded-md transition"
                                title="Eliminar procedimiento"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botones de acción para añadir procedimientos */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleOpenCatalogForPhase(pIdx)}
                        className="text-xs bg-teal-600 hover:bg-teal-700 text-white font-bold px-3 py-1.5 rounded-xl shadow-xs inline-flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                        <span>Añadir del Tarifario de Procedimientos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleAddCustomItem(pIdx)}
                        className="text-xs text-slate-600 hover:text-slate-800 font-bold px-2.5 py-1.5 rounded-xl bg-slate-200/60 hover:bg-slate-200 inline-flex items-center gap-1 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Otro Procedimiento</span>
                      </button>
                    </div>
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
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-600/20 transition flex items-center gap-2 active:scale-95"
              >
                <FileText className="w-4 h-4" />
                <span>{isEditing ? 'Guardar Cambios del Presupuesto' : 'Crear Presupuesto'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de selección desde el Tarifario */}
      <ProceduresCatalogModal
        isOpen={showCatalogPicker}
        onClose={() => {
          setShowCatalogPicker(false);
          setPickerTargetPhaseIdx(null);
        }}
        mode="picker"
        onSelectProcedure={handleSelectProcedureFromCatalog}
      />
    </>
  );
}