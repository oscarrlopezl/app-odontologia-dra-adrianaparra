import React, { useState, useRef, useEffect } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  FileText,
  X,
  RotateCcw,
  CheckCircle2,
  Printer,
  ShieldCheck,
  AlertTriangle,
  User,
  PenTool,
  Download
} from 'lucide-react';

const CONSENT_TEMPLATES = [
  {
    id: 'cirugia_cordales',
    title: 'Cirugía Bucal / Extracción de Cordales',
    procedure_name: 'Cirugía de Terceros Molares (Cordales) / Exodoncia Quirúrgica',
    description:
      'He sido informado/a detalladamente por la Dra. Adriana Parra sobre la necesidad de la intervención quirúrgica para la extracción de las piezas dentarias indicadas. Comprendo los riesgos inherentes que incluyen inflamación postoperatoria, molestia temporal, hematoma, parestesia temporal en nervio dentario inferior o lingual, así como la necesidad estricta de seguir las indicaciones de reposo y medicación prescritas.',
  },
  {
    id: 'endodoncia',
    title: 'Endodoncia / Tratamiento de Conducto',
    procedure_name: 'Biopulpectomía / Tratamiento de Conductos Radiculares',
    description:
      'Autorizo la realización del tratamiento de conducto en la pieza dental indicada. Se me ha explicado que el objetivo es conservar el diente en boca eliminando el tejido pulpar infectado o inflamado. Comprendo que la pieza quedará desvitalizada y requerirá una restauración definitiva o corona para prevenir su fractura posterior, y que pueden presentarse molestias leves a moderadas en los primeros días.',
  },
  {
    id: 'estetica_blanqueamiento',
    title: 'Estética Dental / Blanqueamiento / Carillas',
    procedure_name: 'Aclaramiento Dental en Consultorio y/o Restauraciones Estéticas',
    description:
      'Autorizo a la Dra. Adriana Parra la aplicación del tratamiento estético dental. Se me ha informado que puede experimentarse sensibilidad dental transitoria al frío/calor durante o después del procedimiento. Me comprometo a evitar alimentos o bebidas con colorantes intensos (café, té, vino, refrescos oscuros) y tabaco durante los días posteriores para garantizar el éxito y duración del tono obtenido.',
  },
  {
    id: 'resinas_restauracion',
    title: 'Odontología Restauradora / Resinas',
    procedure_name: 'Eliminación de Caries y Restauración con Resina Fotocurada',
    description:
      'Acepto la remoción del tejido cariado y reconstrucción anatómica con resina de alta estética. Comprendo que en cavidades profundas puede existir sensibilidad post-colocación y que se verificará la oclusión para garantizar una masticación confortable y duradera.',
  },
  {
    id: 'general_diagnostico',
    title: 'Consentimiento General y Aceptación de Plan',
    procedure_name: 'Evaluación Clínica Integral y Ejecución del Plan de Tratamiento',
    description:
      'Certifico que los datos de mi historial médico (alergias, patologías sistémicas y medicamentos) son verdaderos. Acepto el plan de tratamiento y las fases presupuestadas por la Dra. Adriana Parra, autorizando los procedimientos diagnósticos y clínicos necesarios para la recuperación de mi salud bucal.',
  },
];

export default function ConsentSignatureModal({ isOpen, onClose, patient }) {
  const { settings, savePatientConsent, showToast } = useDental();
  const [selectedTemplateId, setSelectedTemplateId] = useState('cirugia_cordales');
  const [customNotes, setCustomNotes] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [savedConsentData, setSavedConsentData] = useState(null);

  const canvasRef = useRef(null);

  const activeTemplate =
    CONSENT_TEMPLATES.find((t) => t.id === selectedTemplateId) || CONSENT_TEMPLATES[0];

  // Configurar Canvas para dibujo táctil y mouse
  useEffect(() => {
    if (!isOpen) {
      setSavedConsentData(null);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Limpiar canvas al abrir o cambiar plantilla
    clearCanvas();
  }, [isOpen, selectedTemplateId]);

  if (!isOpen || !patient) return null;

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const getCanvasCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if (e.touches && e.touches[0]) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    if (e.cancelable && e.type === 'touchstart') e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.cancelable && e.type === 'touchmove') e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { x, y } = getCanvasCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleSave = () => {
    if (!hasSignature) {
      showToast('Por favor, solicite al paciente que firme en el recuadro.', 'warning');
      return;
    }

    const canvas = canvasRef.current;
    const signatureData = canvas.toDataURL('image/png');

    const consentRecord = {
      patient_id: patient.id,
      patient_name: patient.full_name,
      document_id: patient.document_id,
      procedure_type: activeTemplate.title,
      procedure_name: activeTemplate.procedure_name,
      terms_text: activeTemplate.description,
      custom_notes: customNotes.trim(),
      doctor_name: settings?.doctor_name || 'Dra. Adriana Parra',
      signature_url: signatureData,
      signed_at: new Date().toISOString(),
    };

    savePatientConsent(consentRecord);
    setSavedConsentData(consentRecord);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                Consentimiento Informado Digital
              </h3>
              <p className="text-xs text-slate-600">
                Firma legal en pantalla para: <strong className="text-teal-700">{patient.full_name}</strong> ({patient.document_id})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Si ya fue firmado y guardado: Vista de Documento Formal con opción a Imprimir */}
        {savedConsentData ? (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <span className="font-extrabold block">¡Consentimiento Registrado con Éxito!</span>
                <span>El documento quedó archivado en el expediente clínico del paciente con firma digital verificada.</span>
              </div>
            </div>

            {/* Hoja Membretada Imprimible */}
            <div id="printable-consent" className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 text-xs font-serif leading-relaxed text-slate-900">
              <div className="text-center pb-3 border-b border-slate-300">
                <h4 className="font-bold text-sm tracking-wide uppercase font-sans text-teal-900">
                  {settings?.clinic_name || 'Centro Odontológico Especializado Dra. Adriana Parra'}
                </h4>
                <p className="text-[11px] font-sans text-slate-600">
                  {settings?.doctor_name || 'Dra. Adriana Parra'} • Odontología General y Estética Dental
                </p>
                <p className="text-[10px] font-sans text-slate-500">
                  Guacara / Yagua, Edo. Carabobo 🇻🇪
                </p>
              </div>

              <div className="text-center py-1">
                <span className="font-bold text-sm uppercase underline font-sans text-slate-800">
                  {savedConsentData.procedure_name}
                </span>
              </div>

              <p>
                Yo, <strong>{savedConsentData.patient_name}</strong>, titular de la Cédula de Identidad N° <strong>{savedConsentData.document_id}</strong>, en pleno uso de mis facultades mentales y en calidad de paciente, manifiesto que:
              </p>

              <p className="text-justify bg-white/70 p-3 rounded-xl border border-slate-200 text-[11px]">
                {savedConsentData.terms_text}
              </p>

              {savedConsentData.custom_notes && (
                <p className="text-[11px] italic">
                  <strong>Observaciones particulares:</strong> {savedConsentData.custom_notes}
                </p>
              )}

              <div className="pt-4 flex items-end justify-between border-t border-slate-200">
                <div className="text-center w-48">
                  <div className="h-14 flex items-center justify-center">
                    <img
                      src={savedConsentData.signature_url}
                      alt="Firma Paciente"
                      className="max-h-12 w-auto object-contain mx-auto"
                    />
                  </div>
                  <div className="border-t border-slate-400 pt-1 text-[10px] font-sans">
                    <strong>Firma del Paciente</strong>
                    <div>{savedConsentData.patient_name}</div>
                    <div className="font-mono">{savedConsentData.document_id}</div>
                  </div>
                </div>

                <div className="text-center w-48 text-[10px] font-sans">
                  <div className="h-14 flex items-center justify-center font-serif italic text-teal-800">
                    Dra. Adriana Parra
                  </div>
                  <div className="border-t border-slate-400 pt-1">
                    <strong>{settings?.doctor_name || 'Dra. Adriana Parra'}</strong>
                    <div>Odontólogo Tratante</div>
                    <div className="text-slate-500 font-mono">
                      {new Date(savedConsentData.signed_at).toLocaleDateString('es-VE')}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={handlePrint}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5 text-teal-400" />
                <span>Imprimir / Guardar PDF</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        ) : (
          /* Formulario de Elección y Firma */
          <div className="mt-4 space-y-3.5">
            {/* Selector de Tipo de Procedimiento */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Procedimiento a Realizar *
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500"
              >
                {CONSENT_TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Texto Legal del Consentimiento */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto">
              <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-teal-600" />
                <span>Términos y Declaración del Paciente:</span>
              </div>
              <p className="text-[11px] text-justify">{activeTemplate.description}</p>
            </div>

            {/* Notas u Observaciones Adicionales */}
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Pieza Dental / Aclaratoria Clínica (Opcional)
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ej: Extracción quirúrgica pieza 48 (Tercer molar inferior derecho impactado)"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {/* Recuadro de Firma Digital Táctil */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <PenTool className="w-3.5 h-3.5 text-teal-600" />
                  <span>Firma del Paciente (Dedo o Mouse en Pantalla) *</span>
                </label>
                <button
                  type="button"
                  onClick={clearCanvas}
                  className="text-[11px] font-bold text-rose-600 hover:text-rose-800 flex items-center gap-1 transition"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Borrar y repetir</span>
                </button>
              </div>

              <div className="border-2 border-dashed border-teal-400/80 rounded-2xl bg-white p-1 relative shadow-inner touch-none">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-32 cursor-crosshair rounded-xl block bg-white"
                />
                {!hasSignature && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-300 text-xs font-medium">
                    ✍️ El paciente debe firmar aquí con el dedo
                  </div>
                )}
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasSignature}
                className="px-5 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-40 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Firmar y Guardar Consentimiento</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
