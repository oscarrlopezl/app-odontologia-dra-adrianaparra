import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { 
  Check, 
  AlertCircle, 
  ShieldAlert, 
  Info, 
  Sparkles, 
  RotateCcw, 
  HelpCircle,
  FileText
} from 'lucide-react';

// Cuadrantes FDI Adultos
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

// Cuadrantes FDI Pediátricos (Dentición temporal / de leche)
const PED_UPPER_RIGHT = [55, 54, 53, 52, 51];
const PED_UPPER_LEFT  = [61, 62, 63, 64, 65];
const PED_LOWER_RIGHT = [85, 84, 83, 82, 81];
const PED_LOWER_LEFT  = [71, 72, 73, 74, 75];

// Paleta de condiciones dentales
const CONDITIONS = [
  { id: 'sano', name: 'Sano / Limpio', color: '#ffffff', textColor: 'text-slate-700', border: '#cbd5e1' },
  { id: 'caries', name: 'Caries Activa', color: '#ef4444', textColor: 'text-white', border: '#b91c1c' },
  { id: 'resina', name: 'Resina / Obturación', color: '#3b82f6', textColor: 'text-white', border: '#1d4ed8' },
  { id: 'amalgama', name: 'Amalgama', color: '#64748b', textColor: 'text-white', border: '#475569' },
  { id: 'corona', name: 'Corona / Funda', color: '#f59e0b', textColor: 'text-white', border: '#d97706' },
  { id: 'endodoncia', name: 'Tratamiento de Conducto', color: '#ea580c', textColor: 'text-white', border: '#c2410c' },
  { id: 'implante', name: 'Implante Dental', color: '#8b5cf6', textColor: 'text-white', border: '#6d28d9' },
  { id: 'ausente', name: 'Diente Ausente / Extraído', color: '#0f172a', textColor: 'text-white', border: '#020617' },
  { id: 'extraccion', name: 'Extracción Indicada', color: '#dc2626', textColor: 'text-white', border: '#991b1b' },
];

export default function Odontogram({ patientId }) {
  const { odontograms, updateToothInOdontogram } = useDental();
  const [selectedCondition, setSelectedCondition] = useState('caries');
  const [isPediatric, setIsPediatric] = useState(false);
  const [selectedToothModal, setSelectedToothModal] = useState(null);
  const [toothNoteInput, setToothNoteInput] = useState('');

  const patientOdonto = (odontograms && odontograms[patientId]) || {};

  // Nombres anatómicos según número FDI
  const getToothName = (num) => {
    const isUpper = [1, 2, 5, 6].includes(Math.floor(num / 10));
    const pos = num % 10;
    const names = {
      1: 'Incisivo Central',
      2: 'Incisivo Lateral',
      3: 'Canino',
      4: 'Primer Premolar / Molar',
      5: 'Segundo Premolar / Molar',
      6: 'Primer Molar',
      7: 'Segundo Molar',
      8: 'Tercer Molar (Cordal)',
    };
    return `${names[pos] || 'Pieza'} ${isUpper ? 'Superior' : 'Inferior'} (#${num})`;
  };

  const getFaceColor = (toothNum, face) => {
    const toothData = patientOdonto[toothNum];
    if (!toothData) return '#ffffff';
    if (toothData.overall_status === 'ausente') return '#0f172a';
    if (toothData.overall_status === 'corona') return '#f59e0b';
    if (toothData.overall_status === 'implante') return '#8b5cf6';
    if (toothData.overall_status === 'endodoncia' && face === 'oclusal') return '#ea580c';

    const condId = toothData.faces?.[face] || 'sano';
    const found = CONDITIONS.find((c) => c.id === condId);
    return found ? found.color : '#ffffff';
  };

  const handleFaceClick = (e, toothNum, face) => {
    e.stopPropagation();
    const toothData = patientOdonto[toothNum] || { faces: {}, overall_status: 'sano', notes: '' };
    const currentFaces = { ...(toothData.faces || {}) };

    if (['ausente', 'implante', 'corona', 'extraccion'].includes(selectedCondition)) {
      // Condición general a todo el diente
      updateToothInOdontogram(patientId, toothNum, {
        overall_status: selectedCondition,
        faces: currentFaces,
      });
    } else {
      // Condición en cara específica
      currentFaces[face] = selectedCondition;
      updateToothInOdontogram(patientId, toothNum, {
        faces: currentFaces,
        overall_status: toothData.overall_status === 'ausente' ? 'sano' : toothData.overall_status,
      });
    }
  };

  const openToothDetails = (toothNum) => {
    const data = patientOdonto[toothNum] || { faces: {}, overall_status: 'sano', notes: '' };
    setSelectedToothModal({ num: toothNum, ...data });
    setToothNoteInput(data.notes || '');
  };

  const saveToothDetails = () => {
    if (!selectedToothModal) return;
    updateToothInOdontogram(patientId, selectedToothModal.num, {
      faces: selectedToothModal.faces,
      overall_status: selectedToothModal.overall_status,
      notes: toothNoteInput,
    });
    setSelectedToothModal(null);
  };

  // Renderizador SVG de diente con 5 caras anatómicas
  const renderToothSVG = (toothNum, isUpper) => {
    const toothData = patientOdonto[toothNum] || {};
    const overall = toothData.overall_status || 'sano';
    const hasNotes = Boolean(toothData.notes);

    return (
      <div 
        key={toothNum} 
        onClick={() => openToothDetails(toothNum)}
        className="flex flex-col items-center group cursor-pointer p-1 rounded-lg hover:bg-teal-50 transition-all border border-transparent hover:border-teal-200"
      >
        <span className={`text-xs font-bold ${overall !== 'sano' ? 'text-teal-700 underline' : 'text-slate-600'}`}>
          {toothNum}
        </span>

        <div className="relative w-11 h-11 my-1">
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-sm">
            {/* Cara Superior: Vestibular en superiores, Lingual en inferiores */}
            <polygon
              points="10,10 90,10 70,30 30,30"
              fill={getFaceColor(toothNum, isUpper ? 'vestibular' : 'lingual')}
              stroke="#64748b"
              strokeWidth="2.5"
              className="hover:opacity-80 transition"
              onClick={(e) => handleFaceClick(e, toothNum, isUpper ? 'vestibular' : 'lingual')}
            />

            {/* Cara Derecha: Mesial / Distal */}
            <polygon
              points="90,10 90,90 70,70 70,30"
              fill={getFaceColor(toothNum, 'distal')}
              stroke="#64748b"
              strokeWidth="2.5"
              className="hover:opacity-80 transition"
              onClick={(e) => handleFaceClick(e, toothNum, 'distal')}
            />

            {/* Cara Inferior: Palatina/Lingual en superiores, Vestibular en inferiores */}
            <polygon
              points="10,90 90,90 70,70 30,70"
              fill={getFaceColor(toothNum, isUpper ? 'lingual' : 'vestibular')}
              stroke="#64748b"
              strokeWidth="2.5"
              className="hover:opacity-80 transition"
              onClick={(e) => handleFaceClick(e, toothNum, isUpper ? 'lingual' : 'vestibular')}
            />

            {/* Cara Izquierda: Mesial / Distal */}
            <polygon
              points="10,10 10,90 30,70 30,30"
              fill={getFaceColor(toothNum, 'mesial')}
              stroke="#64748b"
              strokeWidth="2.5"
              className="hover:opacity-80 transition"
              onClick={(e) => handleFaceClick(e, toothNum, 'mesial')}
            />

            {/* Cara Central: Oclusal / Incisal */}
            <polygon
              points="30,30 70,30 70,70 30,70"
              fill={getFaceColor(toothNum, 'oclusal')}
              stroke="#64748b"
              strokeWidth="2.5"
              className="hover:opacity-80 transition"
              onClick={(e) => handleFaceClick(e, toothNum, 'oclusal')}
            />

            {/* Indicador de Extracción / Ausente */}
            {overall === 'extraccion' && (
              <g stroke="#dc2626" strokeWidth="6" strokeLinecap="round">
                <line x1="15" y1="15" x2="85" y2="85" />
                <line x1="85" y1="15" x2="15" y2="85" />
              </g>
            )}

            {overall === 'ausente' && (
              <g stroke="#0f172a" strokeWidth="5" strokeLinecap="round">
                <line x1="15" y1="85" x2="85" y2="15" />
              </g>
            )}

            {overall === 'implante' && (
              <circle cx="50" cy="50" r="14" fill="#8b5cf6" stroke="#ffffff" strokeWidth="2" />
            )}

            {overall === 'corona' && (
              <rect x="25" y="25" width="50" height="50" fill="none" stroke="#f59e0b" strokeWidth="4" rx="4" />
            )}
          </svg>

          {/* Badge de nota clínica */}
          {hasNotes && (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-600"></span>
            </span>
          )}
        </div>

        <span className="text-[10px] text-slate-600 uppercase font-semibold">
          {overall !== 'sano' ? overall.slice(0, 4) : 'ok'}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      {/* Barra Superior con Cambiador de Tipo y Herramientas */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold text-slate-800">Odontograma Digital Interactivo</h3>
            <span className="bg-teal-50 text-teal-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-teal-200">
              FDI Estándar
            </span>
          </div>
          <p className="text-xs text-slate-700 mt-1">
            Haz clic sobre una cara del diente para aplicar el tratamiento seleccionado, o haz clic en el diente para notas detalladas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setIsPediatric(false)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                !isPediatric ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Adulto (32 piezas)
            </button>
            <button
              onClick={() => setIsPediatric(true)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                isPediatric ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Infantil / Decidua (20 piezas)
            </button>
          </div>
        </div>
      </div>

      {/* Paleta de Diagnóstico y Herramientas */}
      <div className="my-5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 block">
          Herramienta / Condición activa:
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((cond) => {
            const isSelected = selectedCondition === cond.id;
            return (
              <button
                key={cond.id}
                onClick={() => setSelectedCondition(cond.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  isSelected
                    ? 'border-teal-500 ring-2 ring-teal-500/20 bg-teal-50/50 shadow-sm text-teal-900'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-md border flex items-center justify-center"
                  style={{ backgroundColor: cond.color, borderColor: cond.border }}
                >
                  {isSelected && <Check className="w-2.5 h-2.5 text-teal-900" />}
                </span>
                <span>{cond.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grilla Anatómica del Odontograma */}
      <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/80 overflow-x-auto">
        {/* Arcada Superior */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-2 px-4 uppercase tracking-wider">
            <span>Maxilar Superior Derecho (Q1)</span>
            <span className="text-teal-600 font-extrabold">LINEA MEDIA</span>
            <span>Maxilar Superior Izquierdo (Q2)</span>
          </div>

          <div className="flex items-center justify-center gap-6 min-w-[700px]">
            {/* Cuadrante Superior Derecho */}
            <div className="flex items-center justify-end gap-1 flex-1">
              {(!isPediatric ? UPPER_RIGHT : PED_UPPER_RIGHT).map((num) => renderToothSVG(num, true))}
            </div>

            <div className="h-14 w-0.5 bg-teal-400 rounded-full"></div>

            {/* Cuadrante Superior Izquierdo */}
            <div className="flex items-center justify-start gap-1 flex-1">
              {(!isPediatric ? UPPER_LEFT : PED_UPPER_LEFT).map((num) => renderToothSVG(num, true))}
            </div>
          </div>
        </div>

        {/* Separador Oclusal */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-dashed border-slate-300"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-200 text-slate-600 px-3 py-0.5 rounded-full text-[11px] font-bold">
              PLANO OCLUSAL
            </span>
          </div>
        </div>

        {/* Arcada Inferior */}
        <div className="mt-6">
          <div className="flex items-center justify-center gap-6 min-w-[700px]">
            {/* Cuadrante Inferior Derecho */}
            <div className="flex items-center justify-end gap-1 flex-1">
              {(!isPediatric ? LOWER_RIGHT : PED_LOWER_RIGHT).map((num) => renderToothSVG(num, false))}
            </div>

            <div className="h-14 w-0.5 bg-teal-400 rounded-full"></div>

            {/* Cuadrante Inferior Izquierdo */}
            <div className="flex items-center justify-start gap-1 flex-1">
              {(!isPediatric ? LOWER_LEFT : PED_LOWER_LEFT).map((num) => renderToothSVG(num, false))}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs font-bold text-slate-600 mt-2 px-4 uppercase tracking-wider">
            <span>Mandíbula Inferior Derecha (Q4)</span>
            <span className="text-teal-600 font-extrabold">LINEA MEDIA</span>
            <span>Mandíbula Inferior Izquierda (Q3)</span>
          </div>
        </div>
      </div>

      {/* Modal de Detalle / Nota de Diente Específico */}
      {selectedToothModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-lg">
                  #{selectedToothModal.num}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800">{getToothName(selectedToothModal.num)}</h4>
                  <p className="text-xs text-slate-700">Edición clínica detallada</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedToothModal(null)}
                className="text-slate-600 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Estado Global de la Pieza
                </label>
                <select
                  value={selectedToothModal.overall_status || 'sano'}
                  onChange={(e) =>
                    setSelectedToothModal({ ...selectedToothModal, overall_status: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {CONDITIONS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Notas Clínicas / Procedimiento realizado
                </label>
                <textarea
                  value={toothNoteInput}
                  onChange={(e) => setToothNoteInput(e.target.value)}
                  placeholder="Ej: Resina clase II mesio-oclusal realizada con 3M Filtek Z350 XT. Oclusión ajustada."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                ></textarea>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-600 block mb-2">Caras afectadas:</span>
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {['vestibular', 'lingual', 'mesial', 'distal', 'oclusal'].map((face) => (
                    <div key={face} className="p-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs">
                      <span className="block font-semibold capitalize text-slate-600 text-[10px]">{face}</span>
                      <span className="font-bold text-teal-700 text-xs">
                        {selectedToothModal.faces?.[face] || 'sano'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedToothModal(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancelar
              </button>
              <button
                onClick={saveToothDetails}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-md transition"
              >
                Guardar en Odontograma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
