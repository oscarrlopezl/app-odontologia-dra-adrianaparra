import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detectar si las credenciales son válidas o si está en modo demo/local
export const isConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('tu-proyecto') &&
  !supabaseUrl.includes('demo-supabase') &&
  supabaseUrl.startsWith('https://')
);

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const doctorInfo = {
  name: import.meta.env.VITE_DOCTOR_NAME || 'Dra. Adriana Parra',
  email: import.meta.env.VITE_DOCTOR_EMAIL || 'dra.adrianaparra@gmail.com',
  clinicName: import.meta.env.VITE_CLINIC_NAME || 'Centro Odontológico Especializado Dra. Adriana Parra',
  phone: import.meta.env.VITE_CLINIC_PHONE || '+58 412-1234567',
  defaultExchangeRate: Number(import.meta.env.VITE_DEFAULT_EXCHANGE_RATE) || 40.0,
};
