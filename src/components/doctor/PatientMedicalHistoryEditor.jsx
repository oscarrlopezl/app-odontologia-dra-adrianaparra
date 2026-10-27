import React, { useState, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  HeartPulse,
  AlertTriangle,
  Sparkles,
  Save,
  Plus,
  X,
  Pill,
  ShieldAlert,
  CheckCircle2,
  Stethoscope,
  Smile,
  Activity,
  Phone,
  MapPin,
  Clock
} from 'lucide-react';

const COMMON_ALLERGIES = [
  'Penicilina',
  'Amoxicilina',
  'Lidocaína / Anestesia Local',
  'Anestesia con Vasoconstrictor',
  'Látex / Guantes',
  'AINEs (Ibuprofeno / Aspirina)',
  'Ketoprofeno',
  'Sulfas',
  'Metales / Níquel',
  'Yodo',
];

const COMMON_CONDITIONS = [
  'Hipertensión arterial',
  'Diabetes Tipo 2',
  'Diabetes Tipo 1',
  'Embarazo / Lactancia',
  'Cardiopatía / Marcapasos',
  'Asma / Afección respiratoria',
  'Problemas de coagulación / Anticoagulantes',
  'Hepatitis / Afección hepática',
  'Tiroides / Hipotiroidismo',
  'Gastritis severa / Úlceras',
  'Tratamiento con Bifosfonatos',
];

const COMMON_DENTAL_SYMPTOMS = [
  'Dolor dental agudo / punzante',
  'Dolor al masticar',
  'Sensibilidad al frío / calor',
  'Sensibilidad al dulce o ácido',
  'Sangrado gingival (encías)',
  'Bruxismo / Apretamiento dental nocturno',
  'Diente fracturado o quebrado',
  'Restauración / calza caída',
  'Movilidad en pieza dental',
  'Inflamación / Flemón / Absceso',
  'Chasquido o dolor en ATM / Mandíbula',
  'Dificultad para abrir la boca',
  'Mal aliento / Halitosis',
  'Caries visibles',
  'Deseo de Blanqueamiento / Estética',
];

const COMMON_HABITS = [
  'Fumador / Tabaco',
  'Consumo frecuente de café o té',
  'Ansiedad / Miedo al sillón odontológico',
  'Uso regular de hilo dental',
  'Cepillado 1 vez al día',
  'Cepillado 2 a 3 veces al día',
  'Tratamiento de ortodoncia previo',
];

export default function PatientMedicalHistoryEditor({ patient }) {
  const { updatePatient, showToast } = useDental();

  // Estados locales para edición fluida
  const [allergies, setAllergies] = useState([]);
  const [conditions, setConditions] = useState([]);
  const [symptoms, setSymptoms] = useState([]);
  const [habits, setHabits] = useState([]);
  const [medication, setMedication] = useState('');
  const [consultationReason, setConsultationReason] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Inputs para agregar items personalizados
  const [customAllergy, setCustomAllergy] = useState('');
  const [customCondition, setCustomCondition] = useState('');
  const [customSymptom, setCustomSymptom] = useState('');

  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar con los datos del paciente
  useEffect(() => {
    if (!patient) return;

    // Normalizar alergias y condiciones existentes
    const existingConditions = Array.isArray(patient.medical_conditions) ? patient.medical_conditions : [];
    
    // Si ya tiene campo separado de alergias, usarlo; sino buscar palabras de alergia en medical_conditions
    let initialAllergies = Array.isArray(patient.allergies) ? [...patient.allergies] : [];
    let initialConditions = Array.isArray(patient.systemic_conditions) ? [...patient.systemic_conditions] : [];

    if (initialAllergies.length === 0 && initialConditions.length === 0) {
      existingConditions.forEach((c) => {
        if (/alergia|alérgic|penicil|látex|lidoca/i.test(c)) {
          initialAllergies.push(c.replace(/alergia a\s*/i, '').trim());
        } else {
          initialConditions.push(c);
        }
      });
    }

    setAllergies(initialAllergies);
    setConditions(initialConditions);
    setSymptoms(Array.isArray(patient.dental_symptoms) ? patient.dental_symptoms : []);
    setHabits(Array.isArray(patient.dental_habits) ? patient.dental_habits : []);
    setMedication(patient.current_medication || '');
    setConsultationReason(patient.consultation_reason || '');
    setClinicalNotes(patient.notes || '');
    setAddress(patient.address || '');
    setEmergencyName(patient.emergency_contact_name || '');
    setEmergencyPhone(patient.emergency_contact_phone || '');
    setHasChanges(false);
  }, [patient]);

  // Manejo de Alergias
  const toggleAllergy = (allergyName) => {
    setAllergies((prev) => {
      const exists = prev.some((a) => a.toLowerCase() === allergyName.toLowerCase());
      if (exists) {
        return prev.filter((a) => a.toLowerCase() !== allergyName.toLowerCase());
      } else {
        return [...prev, allergyName];
      }
    });
    setHasChanges(true);
  };

  const addCustomAllergy = () => {
    if (!customAllergy.trim()) return;
    const trimmed = customAllergy.trim();
    if (!allergies.some((a) => a.toLowerCase() === trimmed.toLowerCase())) {
      setAllergies((prev) => [...prev, trimmed]);
      setHasChanges(true);
    }
    setCustomAllergy('');
  };

  // Manejo de Condiciones Médicas
  const toggleCondition = (condName) => {
    setConditions((prev) => {
      const exists = prev.some((c) => c.toLowerCase() === condName.toLowerCase());
      if (exists) {
        return prev.filter((c) => c.toLowerCase() !== condName.toLowerCase());
      } else {
        return [...prev, condName];
      }
    });
    setHasChanges(true);
  };

  const addCustomCondition = () => {
    if (!customCondition.trim()) return;
    const trimmed = customCondition.trim();
    if (!conditions.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setConditions((prev) => [...prev, trimmed]);
      setHasChanges(true);
    }
    setCustomCondition('');
  };

  // Manejo de Síntomas Odontológicos
  const toggleSymptom = (symName) => {
    setSymptoms((prev) => {
      const exists = prev.some((s) => s.toLowerCase() === symName.toLowerCase());
      if (exists) {
        return prev.filter((s) => s.toLowerCase() !== symName.toLowerCase());
      } else {
        return [...prev, symName];
      }
    });
    setHasChanges(true);
  };

  const addCustomSymptom = () => {
    if (!customSymptom.trim()) return;
    const trimmed = customSymptom.trim();
    if (!symptoms.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSymptoms((prev) => [...prev, trimmed]);
      setHasChanges(true);
    }
    setCustomSymptom('');
  };

  // Manejo de Hábitos
  const toggleHabit = (habitName) => {
    setHabits((prev) => {
      const exists = prev.some((h) => h.toLowerCase() === habitName.toLowerCase());
      if (exists) {
        return prev.filter((h) => h.toLowerCase() !== habitName.toLowerCase());
      } else {
        return [...prev, habitName];
      }
    });
    setHasChanges(true);
  };

  // Guardar en la ficha del paciente
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    // Combinar alergias y condiciones para compatibilidad hacia atrás en medical_conditions
    const formattedConditions = [
      ...allergies.map((a) => (a.toLowerCase().includes('alergia') ? a : `Alergia a ${a}`)),
      ...conditions,
    ];

    const updatedData = {
      allergies,
      systemic_conditions: conditions,
      medical_conditions: formattedConditions,
      dental_symptoms: symptoms,
      dental_habits: habits,
      current_medication: medication.trim(),
      consultation_reason: consultationReason.trim(),
      notes: clinicalNotes.trim(),
      address: address.trim(),
      emergency_contact_name: emergencyName.trim(),
      emergency_contact_phone: emergencyPhone.trim(),
    };

    await updatePatient(patient.id, updatedData);
    setIsSaving(false);
    setHasChanges(false);
    if (showToast) {
      showToast('✨ Historial médico, alergias y síntomas guardados con éxito.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra Superior Informativa con Botón de Guardado Rápido */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 shadow-xs shrink-0">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-slate-900 leading-tight">
              Historial Clínico, Alergias y Síntomas Odontológicos
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Panel médico interactivo para la Dra. Adriana Parra • Modificación rápida con 1 clic
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition active:scale-95 ${
            hasChanges
              ? 'bg-teal-600 hover:bg-teal-500 text-white shadow-teal-600/30 animate-pulse'
              : 'bg-teal-600 hover:bg-teal-700 text-white'
          }`}
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : hasChanges ? 'Guardar Cambios Clínicos *' : 'Historial Guardado'}</span>
        </button>
      </div>

      {/* 1. SECCIÓN CRÍTICA: ALERGIAS CONOCIDAS (Alerta Roja) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-rose-200 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <span>Alergias a Medicamentos o Materiales</span>
                <span className="text-[10px] bg-rose-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Alerta Crítica
                </span>
              </h4>
              <p className="text-xs text-slate-500">
                Toca para activar o desactivar las alergias que el paciente presenta.
              </p>
            </div>
          </div>

          {allergies.length === 0 ? (
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Sin alergias conocidas reportadas
            </span>
          ) : (
            <span className="text-[11px] font-extrabold text-rose-700 bg-rose-50 border border-rose-300 px-3 py-1 rounded-xl">
              ⚠️ {allergies.length} {allergies.length === 1 ? 'Alergia detectada' : 'Alergias detectadas'}
            </span>
          )}
        </div>

        {/* Chips de Alergias Frecuentes */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Alergias comunes en odontología (Toca para seleccionar):
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_ALLERGIES.map((allergy) => {
              const isSelected = allergies.some((a) => a.toLowerCase() === allergy.toLowerCase());
              return (
                <button
                  type="button"
                  key={allergy}
                  onClick={() => toggleAllergy(allergy)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 border border-rose-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isSelected && <X className="w-3.5 h-3.5" />}
                  <span>{allergy}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agregar otra alergia personalizada */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={customAllergy}
              onChange={(e) => setCustomAllergy(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomAllergy();
                }
              }}
              placeholder="Escribe otra alergia específica (ej: Dipirona, Tartrazina...)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={addCustomAllergy}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Alergia</span>
          </button>
        </div>
      </div>

      {/* 2. SÍNTOMAS Y COSAS ODONTOLÓGICAS ACTUALES (Verde / Teal) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              Síntomas y Hallazgos Odontológicos Actuales
            </h4>
            <p className="text-xs text-slate-500">
              Selecciona lo que el paciente manifiesta en consulta (dolor, sensibilidad, sangrado, estética).
            </p>
          </div>
        </div>

        {/* Motivo de consulta principal */}
        <div>
          <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
            Motivo Principal de Consulta (En palabras del paciente o doctora)
          </label>
          <input
            type="text"
            value={consultationReason}
            onChange={(e) => {
              setConsultationReason(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Ej: Molestia en molar inferior derecho al masticar alimentos duros y frío..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
          />
        </div>

        {/* Chips de Síntomas Odontológicos */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Síntomas frecuentes reportados:
          </span>
          <div className="flex flex-wrap gap-2">
            {COMMON_DENTAL_SYMPTOMS.map((symptom) => {
              const isSelected = symptoms.some((s) => s.toLowerCase() === symptom.toLowerCase());
              return (
                <button
                  type="button"
                  key={symptom}
                  onClick={() => toggleSymptom(symptom)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 border border-teal-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{symptom}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agregar otro síntoma personalizado */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={customSymptom}
              onChange={(e) => setCustomSymptom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomSymptom();
                }
              }}
              placeholder="Otro síntoma odontológico específico (ej: Trismus leve, afta en carrillo...)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={addCustomSymptom}
            className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Síntoma</span>
          </button>
        </div>
      </div>

      {/* 3. CONDICIONES MÉDICAS GENERALES Y SISTÉMICAS (Ámbar) */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-slate-900">
              Condiciones Médicas y Antecedentes Sistémicos
            </h4>
            <p className="text-xs text-slate-500">
              Enfermedades crónicas, estados fisiológicos o patologías relevantes para el tratamiento.
            </p>
          </div>
        </div>

        {/* Chips de Condiciones Médicas */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            {COMMON_CONDITIONS.map((cond) => {
              const isSelected = conditions.some((c) => c.toLowerCase() === cond.toLowerCase());
              return (
                <button
                  type="button"
                  key={cond}
                  onClick={() => toggleCondition(cond)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{cond}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agregar otra condición personalizada */}
        <div className="pt-2 flex flex-wrap items-center gap-2">
          <div className="flex-1 min-w-[220px]">
            <input
              type="text"
              value={customCondition}
              onChange={(e) => setCustomCondition(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addCustomCondition();
                }
              }}
              placeholder="Otra condición médica (ej: Lupus, Insuficiencia renal, Epilepsia...)"
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
            />
          </div>
          <button
            type="button"
            onClick={addCustomCondition}
            className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs rounded-xl transition flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Condición</span>
          </button>
        </div>
      </div>

      {/* 4. MEDICACIÓN ACTUAL Y HÁBITOS BUCALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Medicación que toma el paciente */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
            <Pill className="w-4 h-4 text-teal-600" />
            <span>Medicación Actual que Toma el Paciente</span>
          </div>
          <textarea
            rows={3}
            value={medication}
            onChange={(e) => {
              setMedication(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Ej: Losartán 50mg (1 vez al día), Glucofage 850mg (con almuerzo), Aspirina 81mg..."
            className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
          ></textarea>
          <p className="text-[11px] text-slate-500">
            Crucial para evitar interacciones medicamentosas con anestésicos y antibióticos.
          </p>
        </div>

        {/* Hábitos e Higiene Bucal */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-extrabold text-xs uppercase tracking-wider">
            <Smile className="w-4 h-4 text-teal-600" />
            <span>Hábitos e Higiene Bucal</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {COMMON_HABITS.map((habit) => {
              const isSelected = habits.some((h) => h.toLowerCase() === habit.toLowerCase());
              return (
                <button
                  type="button"
                  key={habit}
                  onClick={() => toggleHabit(habit)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    isSelected
                      ? 'bg-slate-800 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-teal-400" />}
                  <span>{habit}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. OBSERVACIONES CLÍNICAS Y ANTECEDENTES DE LA DOCTORA */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
          Observaciones Clínicas y Antecedentes Odontológicos Detallados
        </span>
        <textarea
          rows={3}
          value={clinicalNotes}
          onChange={(e) => {
            setClinicalNotes(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Anotaciones de la Dra. Adriana Parra: experiencia previa en consultas, respuesta a la anestesia, estado periodontal, recomendaciones especiales..."
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
        ></textarea>
      </div>

      {/* 6. DATOS DE CONTACTO Y RESIDENCIA */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
          Dirección y Contacto de Emergencia
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Dirección de Residencia:
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Ej: Urb. Malavé Villalba, Guacara"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Contacto de Emergencia (Familiar):
            </label>
            <input
              type="text"
              value={emergencyName}
              onChange={(e) => {
                setEmergencyName(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Ej: María Parra (Madre)"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
              Teléfono de Emergencia:
            </label>
            <input
              type="text"
              value={emergencyPhone}
              onChange={(e) => {
                setEmergencyPhone(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Ej: 0414-1234567"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono font-medium"
            />
          </div>
        </div>
      </div>

      {/* Botón Guardar Inferior */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
        <span className="text-xs text-slate-500 font-medium">
          {hasChanges
            ? '⚠️ Hay modificaciones sin guardar en el historial del paciente.'
            : '✓ Toda la información clínica está sincronizada.'}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-md shadow-teal-600/20 transition active:scale-95"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Guardando...' : 'Guardar Historial Clínico Completo'}</span>
        </button>
      </div>
    </div>
  );
}
