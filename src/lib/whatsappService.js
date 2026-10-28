// Servicio especializado de Mensajería WhatsApp para la Dra. Adriana Parra
// Genera enlaces wa.me y plantillas profesionales para pacientes

/**
 * Normaliza cualquier número telefónico venezolano al formato internacional de WhatsApp (584XXXXXXXXX)
 */
export function cleanVenezuelanPhone(rawPhone) {
  if (!rawPhone) return '';
  // Eliminar todo lo que no sea dígito
  let digits = String(rawPhone).replace(/\D/g, '');

  // Si empieza con 58 y luego 0 (ej: 580412...), remover el 0
  if (digits.startsWith('580')) {
    digits = '58' + digits.slice(3);
  }
  // Si empieza por 0 (ej: 04141234567, 04121234567, 0424...), reemplazar 0 inicial por 58
  else if (digits.startsWith('0')) {
    digits = '58' + digits.slice(1);
  }
  // Si tiene 10 dígitos y empieza por 4 (ej: 4121234567, 414...), agregar 58
  else if (digits.length === 10 && digits.startsWith('4')) {
    digits = '58' + digits;
  }
  // Si ya tiene 58 pero solo 12 dígitos (584121234567), está perfecto
  return digits;
}

/**
 * Construye la URL de WhatsApp lista para abrir en teléfono (app) o PC (WhatsApp Web)
 */
export function buildWhatsAppLink(phone, message) {
  const cleanPhone = cleanVenezuelanPhone(phone);
  const encodedText = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}?text=${encodedText}`;
}

/**
 * Formatea una fecha YYYY-MM-DD a formato amigable en español (ej: "Lunes, 26 de Octubre de 2026")
 */
export function formatSpanishDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const date = new Date(year, month, day);
      return date.toLocaleDateString('es-VE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
  } catch (e) {
    console.error('Error formateando fecha:', e);
  }
  return dateStr;
}

/**
 * Formatea una hora HH:mm a formato 12 horas con AM/PM (ej: "09:00 AM", "03:30 PM")
 */
export function format12HourTime(timeStr) {
  if (!timeStr) return '';
  try {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const minPadded = String(minutes).padStart(2, '0');
    return `${hour12}:${minPadded} ${period}`;
  } catch (e) {
    return timeStr;
  }
}

/**
 * PLANTILLA 1: Recordatorio / Confirmación de Cita Odontológica
 */
export function getAppointmentReminderText({ patient, appointment, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const address = settings?.address || 'Guacara / Yagua, Edo. Carabobo';
  const patientName = patient?.full_name?.trim() || appointment?.patient_name || 'Paciente';
  const formattedDate = formatSpanishDate(appointment?.appointment_date);
  const formattedTime = format12HourTime(appointment?.start_time);
  const treatment = appointment?.treatment_type || 'Consulta Odontológica';

  return `🦷 *RECORDATORIO DE CITA ODONTOLÓGICA*
*${doctorName}* • ${clinicName}

Hola *${patientName}*, te recordamos tu cita odontológica programada:

📅 *Fecha:* ${formattedDate}
⏰ *Hora:* ${formattedTime}
🩺 *Tratamiento:* ${treatment}
📍 *Lugar:* ${address}

${appointment?.notes ? `📝 *Nota especial:* ${appointment.notes}\n` : ''}
⚠️ *Recomendaciones:*
• Te sugerimos llegar con 10 minutos de anticipación.
• Si presentas algún imprevisto o necesitas reprogramar, por favor avísanos con tiempo.

¡Te esperamos para cuidar de tu salud bucal y tu sonrisa! ✨`;
}

/**
 * PLANTILLA 2: Cuidados e Indicaciones Post-Tratamiento
 */
export const POST_TREATMENT_TYPES = [
  {
    id: 'cirugia',
    title: 'Cirugía / Extracción Dental / Cordales 🩹',
    instructions: `• Mantén la gasa mordida firmemente durante 30 a 45 minutos. Si sigue sangrando, coloca una gasa limpia y seca.
• Aplica compresas frías o hielo envuelto en un paño en la mejilla por periodos de 10 min durante las primeras 24 horas.
• No escupas con fuerza ni utilices pitillos (pajillas) para no desprender el coágulo.
• Dieta blanda y fría/fresca durante las primeras 48 horas (evitar comidas calientes, duras o irritantes).
• No fumes ni ingieras bebidas alcohólicas por al menos 5 días.
• Guarda reposo relativo; evita hacer fuerza o ejercicios intensos.
• Toma rigurosamente los analgésicos y antibióticos recetados según el horario indicado.`,
  },
  {
    id: 'limpieza',
    title: 'Limpieza / Profilaxis Ultrasónica ✨',
    instructions: `• Es completamente normal sentir ligera sensibilidad al frío o calor durante las primeras 24-48 horas.
• Cepilla tus dientes con suavidad utilizando un cepillo de cerdas suaves y crema dental para sensibilidad si lo requieres.
• No consumas alimentos muy pigmentados (café, té oscuro, vino, salsas rojas) durante las próximas 4 a 6 horas.
• Usa hilo dental a diario para prolongar los resultados y mantener tus encías sanas.`,
  },
  {
    id: 'resina',
    title: 'Resina / Restauración Estética 🦷',
    instructions: `• Espera a que pase por completo el efecto de la anestesia antes de masticar o comer para evitar morderte los labios, mejillas o lengua.
• Evita masticar alimentos muy duros (hielo, tostadas duras, huesos) con la pieza recién tratada durante las primeras horas.
• Si al masticar sientes la mordida alta o incómoda en los próximos días, avísanos para realizarte un ajuste rápido.`,
  },
  {
    id: 'endodoncia',
    title: 'Tratamiento de Conducto (Endodoncia) ⚡',
    instructions: `• Evita masticar del lado donde se realizó el tratamiento hasta que se coloque la restauración o corona definitiva.
• Es normal sentir una leve molestia o sensibilidad al morder durante los primeros 2 o 3 días; se alivia con los analgésicos recetados.
• Recuerda acudir a tu cita de sellado definitivo o restauración para proteger la pieza dental y evitar filtraciones.`,
  },
  {
    id: 'blanqueamiento',
    title: 'Blanqueamiento Dental LED 💎',
    instructions: `• Mantén una "dieta blanca" estricta durante las próximas 48 a 72 horas.
• Evita totalmente: café, té, refrescos oscuros, vino tinto, chocolate, salsa de tomate/soya, curry y tabaco.
• Si presentas sensibilidad, evita bebidas extremadamente frías o calientes y usa pasta desensibilizante.`,
  },
  {
    id: 'general',
    title: 'Control General y Cuidados Habituales 📋',
    instructions: `• Continúa con tu higiene bucal regular: cepillado 3 veces al día y uso diario de hilo dental.
• Toma tus medicamentos según la prescripción entregada.
• Cualquier duda o síntoma inusual, comunícate con nosotros por este medio.`,
  },
];

export function getPostTreatmentCareText({ patient, careType, customNotes, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const patientName = patient?.full_name?.trim() || 'Paciente';
  const selectedCare = POST_TREATMENT_TYPES.find((c) => c.id === careType) || POST_TREATMENT_TYPES[0];

  return `🦷 *INDICACIONES POST-TRATAMIENTO*
*${doctorName}* • ${clinicName}

Hola *${patientName}*, esperamos que te encuentres muy bien tras tu consulta de hoy.

📌 *Procedimiento:* ${selectedCare.title}

*Cuidados y recomendaciones a seguir:*
${selectedCare.instructions}

${customNotes ? `📝 *Indicación adicional de la Doctora:* ${customNotes}\n` : ''}
Cualquier molestia o duda, puedes escribirnos con confianza a este número. ¡Que te recuperes muy pronto! 🌟`;
}

/**
 * PLANTILLA 3: Presupuesto Odontológico y Estado de Cuenta
 */
export function getBudgetReminderText({ patient, budget, financials, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const patientName = patient?.full_name?.trim() || 'Paciente';
  const exchangeRate = Number(settings?.usd_exchange_rate) || 887.30;

  const totalUsd = Number(budget?.total_amount || financials?.totalBudget || 0);
  const paidUsd = Number(financials?.totalPaid || 0);
  const balanceUsd = Math.max(0, totalUsd - paidUsd);

  const totalBs = (totalUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const paidBs = (paidUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const balanceBs = (balanceUsd * exchangeRate).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const rateFormatted = exchangeRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return `🦷 *PRESUPUESTO ODONTOLÓGICO Y ESTADO DE CUENTA*
*${doctorName}* • ${clinicName}

Estimado(a) *${patientName}*, te compartimos el resumen de tu plan de tratamiento:

📋 *Tratamiento:* ${budget?.title || 'Plan Odontológico Integral'}
💵 *Total Tratamiento:* $${totalUsd.toFixed(2)} (~Bs. ${totalBs})
✅ *Total Abonado:* $${paidUsd.toFixed(2)} (~Bs. ${paidBs})
💳 *Saldo Pendiente:* *$${balanceUsd.toFixed(2)}* (*~Bs. ${balanceBs}*)

📊 *Tasa BCV Oficial:* 1 USD = ${rateFormatted} Bs.

🏦 *MÉTODOS DE PAGO DISPONIBLES:*
• *Pago Móvil:*
  - Banco: ${settings?.pago_movil_banco || 'Banesco / Mercantil / Banco de Venezuela'}
  - Teléfono: ${settings?.pago_movil_telefono || settings?.phone || '0412-1234567'}
  - Cédula/RIF: ${settings?.pago_movil_cedula || 'V-12345678'}
  - Titular: ${doctorName}
• *Divisas en Efectivo:* Directamente en consulta ($ USD / € EUR)
${settings?.zelle_email ? `• *Zelle:* ${settings?.zelle_email}\n` : ''}
Por favor envíanos tu comprobante de pago por este mismo chat al realizar tu transferencia o Pago Móvil para registrarlo en tu expediente. ¡Gracias por tu confianza! 🌟`;
}

/**
 * PLANTILLA 4: Récipe Médico e Indicaciones de Fármacos
 */
export function getPrescriptionText({ patient, record, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const patientName = patient?.full_name?.trim() || 'Paciente';
  const docId = patient?.document_id || '';
  const prescriptions = record?.prescriptions || 'Tomar medicación según lo indicado en consulta.';

  return `💊 *RÉCIPE E INDICACIONES MÉDICAS*
*${doctorName}* • ${clinicName}

Paciente: *${patientName}* ${docId ? `(CI: ${docId})` : ''}
Fecha: ${record?.record_date || new Date().toISOString().split('T')[0]}

📋 *MEDICAMENTOS E INDICACIONES:*
${prescriptions}

${record?.diagnoses?.length ? `🩺 *Diagnóstico:* ${record.diagnoses.join(', ')}\n` : ''}
⚠️ *Importante:*
• Cumplir rigurosamente con los horarios y días indicados de cada medicamento.
• No suspender los antibióticos antes del tiempo establecido aunque sientas mejoría.
• Ante cualquier reacción alérgica o efecto adverso, suspender y avisarnos de inmediato.

*${doctorName}*
Odontología Especializada`;
}

/**
 * PLANTILLA 5: Resumen de Consulta e Informe Clínico para el Paciente
 */
export function getConsultationReportText({ patient, record, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const patientName = patient?.full_name?.trim() || 'Paciente';
  const docId = patient?.document_id || '';
  const dateFormatted = formatSpanishDate(record?.record_date || new Date().toISOString().split('T')[0]);

  return `🦷 *INFORME DE CONSULTA ODONTOLÓGICA*
*${doctorName}* • ${clinicName}

Hola *${patientName}* ${docId ? `(CI: ${docId})` : ''}, te compartimos el resumen de tu consulta de hoy:

📅 *Fecha:* ${dateFormatted}
${record?.reason ? `📋 *Motivo de Consulta:* ${record.reason}\n` : ''}
${record?.diagnosis ? `🩺 *Diagnóstico:* ${record.diagnosis}\n` : ''}
${record?.tooth_numbers?.length ? `🦷 *Piezas Dentales Tratadas:* ${record.tooth_numbers.join(', ')}\n` : ''}
📌 *Procedimiento Realizado:*
${record?.treatment || record?.procedure || 'Procedimiento odontológico especializado completado satisfactoriamente.'}

${record?.prescriptions ? `💊 *Medicamentos Indicados:* ${record.prescriptions}\n` : ''}
*${doctorName}*
Odontología Especializada • Guacara / Yagua 🇻🇪`;
}

/**
 * PLANTILLA 6: Constancia de Asistencia / Reposo Odontológico
 */
export function getMedicalJustificationText({ patient, record, daysOff = '24 horas', settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const clinicName = settings?.clinic_name || 'Consultorio Odontológico';
  const patientName = patient?.full_name?.trim() || 'Paciente';
  const docId = patient?.document_id || 'N/A';
  const dateFormatted = formatSpanishDate(record?.record_date || new Date().toISOString().split('T')[0]);

  return `📋 *CONSTANCIA DE ASISTENCIA Y REPOSO ODONTOLÓGICO*
*${doctorName}* • ${clinicName}

A quien pueda interesar:

Por medio de la presente se hace constar que el(la) ciudadano(a):
👤 *${patientName}*
🆔 *C.I.:* ${docId}

Asistió a consulta y procedimiento odontológico el día de hoy, *${dateFormatted}*.

Por tal motivo, se sugiere reposo por un lapso de *${daysOff}* y el cumplimiento estricto del tratamiento médico indicado.

Constancia que se expide a solicitud de la parte interesada en Guacara / Yagua, Edo. Carabobo.

*${doctorName}*
Odontología Especializada`;
}

/**
 * PLANTILLA 7: Mensaje Personalizado Libre
 */
export function getCustomMessageText({ patient, messageText, settings }) {
  const doctorName = settings?.doctor_name || 'Dra. Adriana Parra';
  const patientName = patient?.full_name?.trim() || 'Paciente';

  return `🦷 *${doctorName}* • Odontología Especializada

Hola *${patientName}*,

${messageText || 'Esperamos que te encuentres muy bien.'}

¡Quedamos a tu entera orden para cualquier consulta! ✨`;
}
