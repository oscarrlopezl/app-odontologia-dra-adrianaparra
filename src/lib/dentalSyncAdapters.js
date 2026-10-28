/**
 * Adaptadores y serializadores de sincronización con Supabase PostgreSQL
 * Consultorio Odontológico Dra. Adriana Parra (Guacara / Yagua)
 */

export const CLINIC_SETTINGS_ID = 'd85eadd6-f6d9-40b4-aff3-4f2abd83072b';

/**
 * Generador de UUID v4 estándar RFC4122 infalible en navegador y servidor
 */
export function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    try {
      return crypto.randomUUID();
    } catch {
      // fallback manual
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validador de formato UUID v4
 */
export function isValidUUID(str) {
  if (!str || typeof str !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str.trim());
}

/**
 * Asegura que una cadena sea un UUID válido; si no lo es, genera uno nuevo
 */
export function ensureUUID(id) {
  if (isValidUUID(id)) return id.trim();
  return generateUUID();
}

/**
 * ADAPTADOR PACIENTES:
 * Supabase columnas: id (uuid), full_name, document_id, birth_date, phone, email, address,
 * emergency_contact_name, emergency_contact_phone, medical_conditions (text[]), notes (text), access_code, photo_url, created_at.
 * 
 * Empaqueta campos médicos extendidos (alergias, síntomas dentales, hábitos, medicación actual, motivo) dentro de notes JSON.
 */
export const patientAdapter = {
  serialize(pat) {
    const id = ensureUUID(pat.id);
    const extraData = {
      plainNotes: pat.notes || '',
      allergies: Array.isArray(pat.allergies) ? pat.allergies : [],
      dental_symptoms: Array.isArray(pat.dental_symptoms) ? pat.dental_symptoms : [],
      dental_habits: Array.isArray(pat.dental_habits) ? pat.dental_habits : [],
      systemic_conditions: Array.isArray(pat.systemic_conditions) ? pat.systemic_conditions : [],
      current_medication: pat.current_medication || '',
      consultation_reason: pat.consultation_reason || '',
    };

    return {
      id,
      full_name: String(pat.full_name || 'Paciente').trim(),
      document_id: String(pat.document_id || 'S/C').trim(),
      birth_date: pat.birth_date || null,
      phone: String(pat.phone || '0412-0000000').trim(),
      email: pat.email ? String(pat.email).trim() : null,
      address: pat.address ? String(pat.address).trim() : null,
      emergency_contact_name: pat.emergency_contact_name || null,
      emergency_contact_phone: pat.emergency_contact_phone || null,
      medical_conditions: Array.isArray(pat.medical_conditions) ? pat.medical_conditions : [],
      notes: JSON.stringify(extraData),
      access_code: String(pat.access_code || pat.document_id?.slice(-4) || '1234').trim(),
      photo_url: pat.photo_url || null,
      created_at: pat.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    let plainNotes = row.notes || '';
    let allergies = [];
    let dental_symptoms = [];
    let dental_habits = [];
    let systemic_conditions = [];
    let current_medication = '';
    let consultation_reason = '';

    if (row.notes && typeof row.notes === 'string' && (row.notes.startsWith('{') || row.notes.startsWith('{"'))) {
      try {
        const parsed = JSON.parse(row.notes);
        plainNotes = parsed.plainNotes || '';
        allergies = parsed.allergies || [];
        dental_symptoms = parsed.dental_symptoms || [];
        dental_habits = parsed.dental_habits || [];
        systemic_conditions = parsed.systemic_conditions || [];
        current_medication = parsed.current_medication || '';
        consultation_reason = parsed.consultation_reason || '';
      } catch {
        // En caso de que sea texto plano simple
        plainNotes = row.notes;
      }
    }

    return {
      ...row,
      notes: plainNotes,
      allergies,
      dental_symptoms,
      dental_habits,
      systemic_conditions,
      current_medication,
      consultation_reason,
      medical_conditions: Array.isArray(row.medical_conditions) ? row.medical_conditions : [],
    };
  },
};

/**
 * ADAPTADOR PRESUPUESTOS:
 * Supabase columnas: id (uuid), patient_id (uuid), title, status, total_amount, notes, created_at.
 * 
 * Empaqueta las fases y los procedimientos completados dentro de notes JSON.
 */
export const budgetAdapter = {
  serialize(budget) {
    const id = ensureUUID(budget.id);
    const patient_id = ensureUUID(budget.patient_id);
    const notesPayload = JSON.stringify({
      userNotes: budget.notes || '',
      phases: Array.isArray(budget.phases) ? budget.phases : [],
    });

    return {
      id,
      patient_id,
      title: String(budget.title || 'Plan de Tratamiento Integral').trim(),
      status: String(budget.status || 'activo').trim(),
      total_amount: Number(budget.total_amount) || 0,
      notes: notesPayload,
      created_at: budget.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    let userNotes = row.notes || '';
    let phases = [];

    if (row.notes && typeof row.notes === 'string' && row.notes.startsWith('{')) {
      try {
        const parsed = JSON.parse(row.notes);
        userNotes = parsed.userNotes || '';
        phases = parsed.phases || [];
      } catch {
        userNotes = row.notes;
      }
    }

    return {
      ...row,
      notes: userNotes,
      phases,
    };
  },
};

/**
 * ADAPTADOR HISTORIAS CLÍNICAS:
 * Supabase columnas: id (uuid), patient_id (uuid), record_date (date), reason, diagnosis,
 * procedure_performed (REQUIRED), tooth_numbers (int[]), indications, prescriptions, doctor_notes, created_at.
 */
export const clinicalRecordAdapter = {
  serialize(rec) {
    const id = ensureUUID(rec.id);
    const patient_id = ensureUUID(rec.patient_id);
    const tooth_numbers = Array.isArray(rec.tooth_numbers)
      ? rec.tooth_numbers.map(Number).filter((n) => !isNaN(n) && n > 0)
      : [];

    return {
      id,
      patient_id,
      record_date: rec.record_date || new Date().toISOString().split('T')[0],
      reason: rec.reason || null,
      diagnosis: rec.diagnosis || null,
      procedure_performed: String(rec.procedure_performed || rec.diagnosis || 'Atención Odontológica').trim(),
      tooth_numbers,
      indications: rec.indications || null,
      prescriptions: rec.prescriptions || null,
      doctor_notes: rec.doctor_notes || null,
      created_at: rec.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    return {
      ...row,
      tooth_numbers: Array.isArray(row.tooth_numbers) ? row.tooth_numbers : [],
    };
  },
};

/**
 * ADAPTADOR ODONTOGRAMA:
 * Supabase columnas: id (uuid), patient_id (uuid), tooth_number (int), faces (jsonb), overall_status, notes, updated_at.
 */
export const odontogramAdapter = {
  serialize(patientId, toothNumber, toothData) {
    return {
      patient_id: ensureUUID(patientId),
      tooth_number: Number(toothNumber),
      faces: toothData.faces || {},
      overall_status: String(toothData.overall_status || 'sano').trim(),
      notes: toothData.notes ? String(toothData.notes).trim() : null,
      updated_at: toothData.updated_at || new Date().toISOString(),
    };
  },

  toMap(rows) {
    const map = {};
    if (!Array.isArray(rows)) return map;

    for (const r of rows) {
      if (!map[r.patient_id]) {
        map[r.patient_id] = {};
      }
      map[r.patient_id][r.tooth_number] = {
        id: r.id,
        faces: r.faces || {},
        overall_status: r.overall_status || 'sano',
        notes: r.notes || '',
        updated_at: r.updated_at,
      };
    }
    return map;
  },
};

/**
 * ADAPTADOR PAGOS Y ABONOS:
 * Supabase columnas: id (uuid), patient_id (uuid), budget_id (uuid|null), amount_usd, amount_bs,
 * exchange_rate, payment_method, reference, concept, payment_date, created_at.
 */
export const paymentAdapter = {
  serialize(pay) {
    const id = ensureUUID(pay.id);
    const patient_id = ensureUUID(pay.patient_id);
    const budget_id = isValidUUID(pay.budget_id) ? pay.budget_id : null;

    return {
      id,
      patient_id,
      budget_id,
      amount_usd: Number(pay.amount_usd) || 0,
      amount_bs: Number(pay.amount_bs) || 0,
      exchange_rate: Number(pay.exchange_rate) || 887.30,
      payment_method: String(pay.payment_method || 'efectivo_usd').trim(),
      reference: pay.reference ? String(pay.reference).trim() : null,
      concept: String(pay.concept || 'Abono de tratamiento').trim(),
      payment_date: pay.payment_date || new Date().toISOString(),
      created_at: pay.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    return row;
  },
};

/**
 * ADAPTADOR AGENDA Y CITAS:
 * Supabase columnas: id (uuid), patient_id (uuid|null), patient_name, patient_phone,
 * appointment_date (date), start_time (time), duration_minutes, treatment_type, status, notes, is_online_request, created_at.
 */
export const appointmentAdapter = {
  serialize(apt) {
    const id = ensureUUID(apt.id);
    const patient_id = isValidUUID(apt.patient_id) ? apt.patient_id : null;

    let startTime = apt.start_time || '09:00';
    if (startTime.length === 5) {
      startTime = `${startTime}:00`;
    }

    return {
      id,
      patient_id,
      patient_name: String(apt.patient_name || 'Paciente').trim(),
      patient_phone: String(apt.patient_phone || '0412-0000000').trim(),
      appointment_date: apt.appointment_date || new Date().toISOString().split('T')[0],
      start_time: startTime,
      duration_minutes: Number(apt.duration_minutes) || 30,
      treatment_type: String(apt.treatment_type || 'Consulta General').trim(),
      status: String(apt.status || 'programada').trim(),
      notes: apt.notes ? String(apt.notes).trim() : null,
      is_online_request: Boolean(apt.is_online_request),
      created_at: apt.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    let cleanTime = row.start_time || '09:00';
    if (cleanTime.length >= 5) {
      cleanTime = cleanTime.substring(0, 5);
    }
    return {
      ...row,
      start_time: cleanTime,
    };
  },
};

/**
 * ADAPTADOR CUADRE DE CAJA:
 * Supabase columnas: id (uuid), entry_date (date), type, category, description,
 * amount_usd, amount_bs, payment_method, reference, related_payment_id (uuid|null), created_at.
 */
export const cashRegisterAdapter = {
  serialize(entry) {
    const id = ensureUUID(entry.id);
    const related_payment_id = isValidUUID(entry.related_payment_id) ? entry.related_payment_id : null;

    return {
      id,
      entry_date: entry.entry_date || new Date().toISOString().split('T')[0],
      type: String(entry.type || 'ingreso').trim(),
      category: String(entry.category || 'general').trim(),
      description: String(entry.description || 'Movimiento de caja').trim(),
      amount_usd: Number(entry.amount_usd) || 0,
      amount_bs: Number(entry.amount_bs) || 0,
      payment_method: String(entry.payment_method || 'efectivo_usd').trim(),
      reference: entry.reference ? String(entry.reference).trim() : null,
      related_payment_id,
      created_at: entry.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    return row;
  },
};

/**
 * ADAPTADOR RADIOGRAFÍAS Y FOTOS:
 * Supabase columnas: id (uuid), patient_id (uuid), title, type, image_url, taken_at (date), notes, created_at.
 */
export const radiographAdapter = {
  serialize(rad) {
    const id = ensureUUID(rad.id);
    const patient_id = ensureUUID(rad.patient_id);

    return {
      id,
      patient_id,
      title: String(rad.title || 'Radiografía').trim(),
      type: String(rad.type || 'periapical').trim(),
      image_url: String(rad.image_url || '').trim(),
      taken_at: rad.taken_at || new Date().toISOString().split('T')[0],
      notes: rad.notes ? String(rad.notes).trim() : null,
      created_at: rad.created_at || new Date().toISOString(),
    };
  },

  deserialize(row) {
    return row;
  },
};
