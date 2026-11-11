import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import {
  FileText,
  X,
  Printer,
  Send,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  CheckCircle2,
  Share2
} from 'lucide-react';
import { buildWhatsAppLink } from '../../lib/whatsappService';

export default function MedicalJustificationModal({ isOpen, onClose, patient }) {
  const { settings, showToast } = useDental();

  const [type, setType] = useState('reposo'); // 'reposo' | 'asistencia'
  const [restDuration, setRestDuration] = useState('48 horas');
  const [diagnosis, setDiagnosis] = useState('Postoperatorio por Cirugía Bucal / Exodoncia Quirúrgica');
  const [consultationTime, setConsultationTime] = useState('09:00 AM a 11:30 AM');
  const [recommendations, setRecommendations] = useState(
    'Reposo físico relativo, dieta blanda a temperatura ambiente o fría, no exponerse a fuentes de calor y cumplimiento de medicación prescrita.'
  );
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  if (!isOpen || !patient) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
    if (!patient.phone) {
      showToast('El paciente no tiene número de teléfono registrado.', 'warning');
      return;
    }

    const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
    const clinicName = settings?.clinic_name || 'Centro Odontológico Especializado';

    let text = `🦷 *${clinicName.toUpperCase()}*\n`;
    text += `*${doctorName}* - Odontología Especializada\n`;
    text += `📍 Guacara / Yagua, Edo. Carabobo 🇻🇪\n\n`;

    if (type === 'reposo') {
      text += `📄 *CONSTANCIA DE REPOSO MÉDICO ODONTOLÓGICO*\n\n`;
      text += `Por medio de la presente se hace constar que el/la paciente *${patient.full_name}*, titular de la C.I. *${patient.document_id}*, fue intervenido/a en este consultorio odontológico por diagnóstico de: *${diagnosis}*.\n\n`;
      text += `⏱️ *Tiempo de reposo indicado:* *${restDuration}* a partir del día *${date}*.\n`;
      text += `📋 *Indicaciones:* ${recommendations}\n\n`;
    } else {
      text += `📄 *CONSTANCIA DE ASISTENCIA A CONSULTA ODONTOLÓGICA*\n\n`;
      text += `Por medio de la presente se hace constar que el/la paciente *${patient.full_name}*, titular de la C.I. *${patient.document_id}*, acudió a consulta odontológica el día *${date}* en el horario comprendido de: *${consultationTime}*.\n\n`;
      text += `Motivo / Procedimiento: ${diagnosis}.\n\n`;
    }

    text += `Constancia que se expide a solicitud de la parte interesada para los fines legales o laborales que estime convenientes.\n\n`;
    text += `Atentamente,\n*${doctorName}*\nColegio de Odontólogos de Venezuela`;

    const link = buildWhatsAppLink(patient.phone, text);
    window.open(link, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 my-6 animate-in zoom-in-95 duration-150">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800">
                Justificativo Odontológico & Reposo Laboral
              </h3>
              <p className="text-xs text-slate-600">
                Paciente: <strong className="text-teal-700">{patient.full_name}</strong> ({patient.document_id})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Tipo de Documento */}
        <div className="flex rounded-2xl bg-slate-100 p-1 mt-4 border border-slate-200">
          <button
            type="button"
            onClick={() => {
              setType('reposo');
              setDiagnosis('Postoperatorio por Cirugía Bucal / Exodoncia Quirúrgica');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              type === 'reposo'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Reposo Médico (Días / Horas)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setType('asistencia');
              setDiagnosis('Atención clínica odontológica y procedimiento en consultorio');
            }}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              type === 'asistencia'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Constancia de Asistencia (Horas)</span>
          </button>
        </div>

        {/* Campos de Configuración */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 text-xs">
          <div>
            <label className="font-bold text-slate-700 block mb-1">
              Fecha de Emisión *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {type === 'reposo' ? (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Tiempo de Reposo Indicado *
              </label>
              <select
                value={restDuration}
                onChange={(e) => setRestDuration(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-teal-500 text-teal-800"
              >
                <option value="24 horas (1 día)">24 horas (1 día)</option>
                <option value="48 horas (2 días)">48 horas (2 días)</option>
                <option value="72 horas (3 días)">72 horas (3 días)</option>
                <option value="5 días hábiles">5 días hábiles</option>
                <option value="Resto de la jornada laboral">Resto de la jornada laboral</option>
              </select>
            </div>
          ) : (
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Horario de Atención en Consulta *
              </label>
              <input
                type="text"
                value={consultationTime}
                onChange={(e) => setConsultationTime(e.target.value)}
                placeholder="Ej: 08:30 AM a 11:00 AM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="font-bold text-slate-700 block mb-1">
              Diagnóstico / Procedimiento Realizado *
            </label>
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="Ej: Exodoncia compleja de piezas dentarias con sutura"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-semibold focus:bg-white focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {type === 'reposo' && (
            <div className="sm:col-span-2">
              <label className="font-bold text-slate-700 block mb-1">
                Indicaciones Clínicas para el Reposo
              </label>
              <input
                type="text"
                value={recommendations}
                onChange={(e) => setRecommendations(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium focus:bg-white focus:ring-2 focus:ring-teal-500"
              />
            </div>
          )}
        </div>

        {/* Vista Previa Membretada Imprimible */}
        <div className="mt-4 p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-serif leading-relaxed text-slate-900 shadow-inner">
          <div className="text-center pb-3 border-b border-slate-300">
            <h4 className="font-bold text-sm tracking-wide uppercase font-sans text-teal-900">
              {settings?.clinic_name || 'Centro Odontológico Especializado Dra. Adriana Parra'}
            </h4>
            <p className="text-[11px] font-sans text-slate-600">
              {settings?.doctor_name || 'Dra. Adriana Parra'} • Odontología General y Estética Dental
            </p>
            <p className="text-[10px] font-sans text-slate-500">
              Guacara / Yagua, Edo. Carabobo 🇻🇪 • WhatsApp: {settings?.phone || '+58 412-1234567'}
            </p>
          </div>

          <div className="text-center py-2">
            <span className="font-bold text-xs uppercase underline font-sans text-slate-800">
              {type === 'reposo'
                ? 'CONSTANCIA DE REPOSO MÉDICO ODONTOLÓGICO'
                : 'CONSTANCIA DE ASISTENCIA A CONSULTA'}
            </span>
          </div>

          <p className="pt-1 text-justify">
            Quien suscribe, <strong>{settings?.doctor_name || 'Dra. Adriana Parra'}</strong>, Odontólogo en ejercicio legal de su profesión, hace constar por medio de la presente que el/la ciudadano/a <strong>{patient.full_name}</strong>, titular de la Cédula de Identidad N° <strong>{patient.document_id}</strong>, {type === 'reposo' ? 'fue evaluado/a y tratado/a en este centro odontológico presentando diagnóstico de:' : 'acudió a consulta odontológica el día de hoy, realizándose:'} <strong>{diagnosis}</strong>.
          </p>

          {type === 'reposo' ? (
            <p className="pt-2 text-justify">
              Por tal motivo, se le indica <strong>REPOSO MÉDICO de {restDuration}</strong> a partir del <strong>{new Date(date).toLocaleDateString('es-VE')}</strong>, debiendo cumplir con: {recommendations}.
            </p>
          ) : (
            <p className="pt-2 text-justify">
              Dicha atención se llevó a cabo el día <strong>{new Date(date).toLocaleDateString('es-VE')}</strong> durante el horario comprendido de <strong>{consultationTime}</strong>.
            </p>
          )}

          <p className="pt-2 text-[11px] italic">
            Constancia que se expide a solicitud de la parte interesada, en la ciudad de Guacara, el día {new Date(date).toLocaleDateString('es-VE')}.
          </p>

          <div className="pt-6 flex justify-end">
            <div className="text-center w-52 font-sans text-[10px]">
              <div className="font-serif italic text-teal-800 text-sm mb-1">
                Dra. Adriana Parra
              </div>
              <div className="border-t border-slate-400 pt-1">
                <strong>{settings?.doctor_name || 'Dra. Adriana Parra'}</strong>
                <div>Odontólogo General y Estética</div>
                <div className="text-slate-500">Colegio de Odontólogos de Venezuela</div>
              </div>
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mt-4 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            title="Enviar texto formal de la constancia por WhatsApp al paciente"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Enviar por WhatsApp</span>
          </button>

          <div className="flex items-center gap-2">
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
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
