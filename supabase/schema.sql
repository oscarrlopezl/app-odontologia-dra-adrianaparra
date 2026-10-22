-- =========================================================================
-- SISTEMA DE GESTIÓN ODONTOLÓGICA DRA. ADRIANA PARRA
-- SCRIPT DE INICIALIZACIÓN DE BASE DE DATOS (SUPABASE / POSTGRESQL)
-- =========================================================================
-- Instrucciones:
-- 1. Inicia sesión en https://supabase.com con el correo de la Dra. Adriana Parra.
-- 2. Crea un nuevo proyecto (Ej: "consultorio-dra-adrianaparra").
-- 3. Entra en el menú "SQL Editor" -> "New query".
-- 4. Pega todo este contenido y dale al botón "RUN".
-- =========================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA: CONFIGURACIÓN DEL CONSULTORIO
CREATE TABLE IF NOT EXISTS clinic_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_name TEXT NOT NULL DEFAULT 'Dra. Adriana Parra',
    doctor_specialty TEXT DEFAULT 'Odontólogo General y Estética Dental',
    doctor_email TEXT DEFAULT 'Od.adrianaparra@gmail.com',
    clinic_name TEXT NOT NULL DEFAULT 'Centro Odontológico Especializado Dra. Adriana Parra',
    phone TEXT DEFAULT '+58 412-1234567',
    address TEXT DEFAULT 'Guacara / Yagua, Estado Carabobo, Venezuela',
    usd_exchange_rate NUMERIC(10, 2) DEFAULT 40.00, -- Tasa oficial de cambio USD/Bs
    logo_url TEXT DEFAULT '/logo-dra-adrianaparra.png',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial por defecto
INSERT INTO clinic_settings (doctor_name, doctor_specialty, doctor_email, clinic_name, phone, address, usd_exchange_rate, logo_url)
VALUES ('Dra. Adriana Parra', 'Odontólogo General y Estética Dental', 'Od.adrianaparra@gmail.com', 'Centro Odontológico Especializado Dra. Adriana Parra', '+58 412-1234567', 'Guacara / Yagua, Edo. Carabobo', 40.00, '/logo-dra-adrianaparra.png')
ON CONFLICT DO NOTHING;

-- 2. TABLA: PACIENTES
CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    document_id TEXT NOT NULL UNIQUE, -- Cédula de Identidad venezolana (V-12345678)
    birth_date DATE,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    medical_conditions TEXT[] DEFAULT '{}', -- ['Alergia a Penicilina', 'Hipertensión', 'Diabetes', etc.]
    notes TEXT,
    access_code TEXT DEFAULT '1234', -- Código de acceso rápido para portal de paciente
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA: ODONTOGRAMA DIGITAL
CREATE TABLE IF NOT EXISTS odontograms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    tooth_number INT NOT NULL, -- Nomenclatura FDI: 11-18, 21-28, 31-38, 41-48 / 51-55, 61-65, 71-75, 81-85
    faces JSONB DEFAULT '{"vestibular": "sano", "lingual": "sano", "mesial": "sano", "distal": "sano", "oclusal": "sano"}',
    overall_status TEXT DEFAULT 'sano', -- sano, caries, resina, corona, endodoncia, ausente, implante, extraccion_indicada
    notes TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(patient_id, tooth_number)
);

-- 4. TABLA: HISTORIAS CLÍNICAS (EVOLUCIÓN)
CREATE TABLE IF NOT EXISTS clinical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    record_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    diagnosis TEXT,
    procedure_performed TEXT NOT NULL,
    tooth_numbers INT[] DEFAULT '{}',
    indications TEXT,
    prescriptions TEXT,
    doctor_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA: RADIOGRAFÍAS Y FOTOS CLÍNICAS
CREATE TABLE IF NOT EXISTS radiographs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'panoramica', -- panoramica, periapical, oclusal, fotografia_intraoral
    image_url TEXT NOT NULL,
    taken_at DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA: PRESUPUESTOS Y FASES DE TRATAMIENTO
CREATE TABLE IF NOT EXISTS treatment_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Plan de Tratamiento Integral',
    status TEXT DEFAULT 'activo', -- borrador, activo, completado, cancelado
    total_amount NUMERIC(10, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES treatment_budgets(id) ON DELETE CASCADE,
    phase_number INT NOT NULL DEFAULT 1,
    title TEXT NOT NULL, -- Ej: "Fase 1: Saneamiento y Limpieza", "Fase 2: Restauraciones y Resinas", "Fase 3: Prótesis/Ortodoncia"
    status TEXT DEFAULT 'pendiente', -- pendiente, en_progreso, completada
    subtotal NUMERIC(10, 2) DEFAULT 0.00,
    items JSONB DEFAULT '[]', -- Array de items: [{"description": "Profilaxis ultrasónica", "cost": 30, "completed": false}]
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABLA: CONTROL DE PAGOS Y ABONOS
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    budget_id UUID REFERENCES treatment_budgets(id) ON DELETE SET NULL,
    amount_usd NUMERIC(10, 2) NOT NULL,
    amount_bs NUMERIC(12, 2) DEFAULT 0.00,
    exchange_rate NUMERIC(10, 2) DEFAULT 1.00,
    payment_method TEXT NOT NULL, -- efectivo_usd, zelle, pago_movil, punto_venta, transferencia
    reference TEXT,
    concept TEXT NOT NULL DEFAULT 'Abono a tratamiento',
    payment_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABLA: CITAS Y AGENDA POR TIEMPO DE TRATAMIENTO
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30, -- 20, 30, 45, 60, 90, 120 min
    treatment_type TEXT NOT NULL DEFAULT 'Consulta General',
    status TEXT DEFAULT 'programada', -- programada, confirmada, en_espera, en_sillon, completada, cancelada
    notes TEXT,
    is_online_request BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABLA: CUADRE DE CAJA DIARIO (INGRESOS Y EGRESOS)
CREATE TABLE IF NOT EXISTS cash_register_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    type TEXT NOT NULL, -- ingreso, egreso
    category TEXT NOT NULL, -- pago_paciente, insumos, laboratorio, mantenimiento, servicios, otros
    description TEXT NOT NULL,
    amount_usd NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    amount_bs NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL, -- efectivo_usd, zelle, pago_movil, punto_venta
    reference TEXT,
    related_payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABLA: PROMOCIONES Y COMUNICADOS
CREATE TABLE IF NOT EXISTS promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    discount_tag TEXT, -- Ej: "20% OFF", "2x1", "Especial del mes"
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar promociones de muestra
INSERT INTO promotions (title, description, discount_tag, valid_until, is_active)
VALUES 
('Mes de la Salud Dental: Limpieza + Fluorización', 'Realízate una profilaxis profunda ultrasónica y llévate la fluorización protectora con precio especial.', '25% OFF', CURRENT_DATE + INTERVAL '30 days', true),
('Diseño de Sonrisa y Blanqueamiento Led', 'Aclara hasta 4 tonos en una sola sesión de alta tecnología sin sensibilidad excesiva.', 'Promo Parejas', CURRENT_DATE + INTERVAL '45 days', true)
ON CONFLICT DO NOTHING;

-- BUCKET DE SUPABASE STORAGE PARA RADIOGRAFÍAS Y FOTOS
-- Puedes crear el bucket manualmente en Supabase Storage con el nombre 'radiografias' y ponerlo público.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('radiografias', 'radiografias', true)
ON CONFLICT (id) DO NOTHING;

-- POLÍTICAS DE ACCESO PÚBLICO / PERMISIVO PARA DESARROLLO RÁPIDO
ALTER TABLE clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE odontograms ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE radiographs ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura/escritura (para la integración con API Key)
CREATE POLICY "Acceso total clinic_settings" ON clinic_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total patients" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total odontograms" ON odontograms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total clinical_records" ON clinical_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total radiographs" ON radiographs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total treatment_budgets" ON treatment_budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total budget_phases" ON budget_phases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total payments" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total appointments" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total cash_register_entries" ON cash_register_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total promotions" ON promotions FOR ALL USING (true) WITH CHECK (true);

-- Política de Storage para radiografías
CREATE POLICY "Public Access Storage" ON storage.objects FOR ALL USING (bucket_id = 'radiografias') WITH CHECK (bucket_id = 'radiografias');
