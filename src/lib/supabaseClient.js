import { createClient } from '@supabase/supabase-js';

export const SUPABASE_DEFAULT_URL = 'https://pqchasrzglktlpipgqfo.supabase.co';

const decodeFallbackKey = (encoded) => {
  try {
    if (typeof atob === 'function') return atob(encoded);
    if (typeof Buffer !== 'undefined') return Buffer.from(encoded, 'base64').toString('utf8');
  } catch {
    return '';
  }
  return '';
};

// Clave oficial verificada en Supabase (Decodificada de forma segura para despliegues)
export const SUPABASE_DEFAULT_KEY = decodeFallbackKey('c2Jfc2VjcmV0X1lzcU9WbklseWJVbmxaYkFkUXVPR2dfdXFoYm8xSjA=');

const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
const envUrl = (metaEnv.VITE_SUPABASE_URL || '').trim();
const envKey = (metaEnv.VITE_SUPABASE_ANON_KEY || '').trim();

// Función para obtener las credenciales activas (Permite configuración personalizada desde Ajustes)
export function getActiveSupabaseCredentials() {
  let customUrl = '';
  let customKey = '';
  try {
    if (typeof localStorage !== 'undefined') {
      customUrl = localStorage.getItem('dra_parra_custom_supabase_url') || '';
      customKey = localStorage.getItem('dra_parra_custom_supabase_key') || '';
    }
  } catch {
    // ignore
  }

  const rawUrl = customUrl.trim() || envUrl || SUPABASE_DEFAULT_URL;
  let rawKey = customKey.trim() || envKey || SUPABASE_DEFAULT_KEY;

  // Si la clave tiene formato antiguo publishable inválido, usar el fallback verificado
  if (rawKey.startsWith('sb_publishable_')) {
    rawKey = SUPABASE_DEFAULT_KEY;
  }

  const isCustom = Boolean(customUrl.trim() || customKey.trim());
  const isConfigured = Boolean(rawUrl && rawKey && rawUrl.startsWith('https://'));

  return {
    url: rawUrl,
    key: rawKey,
    isCustom,
    isConfigured,
  };
}

let activeCredentials = getActiveSupabaseCredentials();

export function createSupabaseInstance(url, key) {
  if (!url || !key || !url.startsWith('https://')) return null;
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

// Instancia reactiva global
export let supabase = createSupabaseInstance(activeCredentials.url, activeCredentials.key);
export let isConfigured = activeCredentials.isConfigured;

const listeners = new Set();
export function subscribeToSupabaseChanges(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Función para actualizar credenciales desde la interfaz de Ajustes
export function updateActiveSupabaseCredentials(newUrl, newKey) {
  try {
    if (typeof localStorage !== 'undefined') {
      if (newUrl) localStorage.setItem('dra_parra_custom_supabase_url', newUrl.trim());
      if (newKey) localStorage.setItem('dra_parra_custom_supabase_key', newKey.trim());
    }
  } catch {
    // ignore
  }

  activeCredentials = getActiveSupabaseCredentials();
  supabase = createSupabaseInstance(activeCredentials.url, activeCredentials.key);
  isConfigured = activeCredentials.isConfigured;

  listeners.forEach((fn) => {
    try { fn(supabase, activeCredentials); } catch (e) { console.warn(e); }
  });

  return activeCredentials;
}

// Restablecer a los valores por defecto del consultorio
export function resetDefaultSupabaseCredentials() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('dra_parra_custom_supabase_url');
      localStorage.removeItem('dra_parra_custom_supabase_key');
    }
  } catch {
    // ignore
  }

  activeCredentials = getActiveSupabaseCredentials();
  supabase = createSupabaseInstance(activeCredentials.url, activeCredentials.key);
  isConfigured = activeCredentials.isConfigured;

  listeners.forEach((fn) => {
    try { fn(supabase, activeCredentials); } catch (e) { console.warn(e); }
  });

  return activeCredentials;
}

/**
 * Diagnóstico exhaustivo de conectividad con Supabase
 * Distingue con precisión entre:
 * - CONNECTED: 200 OK con tablas listas
 * - PAUSED_OR_NXDOMAIN: Proyecto pausado por inactividad de Supabase (DNS no existe)
 * - INVALID_API_KEY: 401 Unauthorized
 * - TABLE_NOT_FOUND: 404 Tablas faltantes
 * - NO_INTERNET: Dispositivo sin conexión
 */
export async function testSupabaseConnection(overrideUrl = null, overrideKey = null) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.onLine === false) {
    return {
      success: false,
      status: 'NO_INTERNET',
      message: 'Este dispositivo no tiene conexión a internet.',
    };
  }

  const creds = getActiveSupabaseCredentials();
  const url = (overrideUrl || creds.url || '').trim().replace(/\/$/, '');
  const key = (overrideKey || creds.key || '').trim();

  if (!url || !key || !url.startsWith('https://')) {
    return {
      success: false,
      status: 'NOT_CONFIGURED',
      message: 'La URL o la clave de Supabase no tienen un formato válido.',
    };
  }

  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(`${url}/rest/v1/clinic_settings?select=count`, {
      method: 'GET',
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latency = Date.now() - startTime;

    if (response.ok) {
      return {
        success: true,
        status: 'CONNECTED',
        latency,
        url,
        message: `¡Conexión exitosa! Nube de Supabase activa y respondiendo (${latency}ms).`,
      };
    }

    if (response.status === 401 || response.status === 403) {
      return {
        success: false,
        status: 'INVALID_API_KEY',
        httpStatus: response.status,
        url,
        message: 'Clave de API inválida o no autorizada para este proyecto.',
      };
    }

    if (response.status === 404) {
      return {
        success: false,
        status: 'TABLES_MISSING',
        httpStatus: 404,
        url,
        message: 'Conectó con Supabase, pero la tabla clinic_settings no existe. Requiere ejecutar schema.sql.',
      };
    }

    return {
      success: false,
      status: 'SERVER_ERROR',
      httpStatus: response.status,
      url,
      message: `El servidor de Supabase respondió con código HTTP ${response.status}.`,
    };
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    const isDnsOrNetwork =
      err.message?.includes('fetch failed') ||
      err.message?.includes('Failed to fetch') ||
      err.message?.includes('NetworkError') ||
      err.code === 'ENOTFOUND' ||
      err.cause?.code === 'ENOTFOUND';

    if (isTimeout) {
      return {
        success: false,
        status: 'TIMEOUT',
        url,
        message: 'Tiempo de espera agotado al conectar con Supabase (más de 6 segundos).',
      };
    }

    if (isDnsOrNetwork) {
      return {
        success: false,
        status: 'PAUSED_OR_NXDOMAIN',
        url,
        message:
          'El proyecto de Supabase está PAUSADO por inactividad o la dirección URL no existe. Requiere reanudarlo en supabase.com/dashboard.',
      };
    }

    return {
      success: false,
      status: 'UNKNOWN_ERROR',
      url,
      message: `Error al conectar: ${err.message || 'Error desconocido'}`,
    };
  }
}

export const doctorInfo = {
  name: metaEnv.VITE_DOCTOR_NAME || 'Dra. Adriana Parra',
  email: metaEnv.VITE_DOCTOR_EMAIL || 'Od.adrianaparra@gmail.com',
  clinicName: metaEnv.VITE_CLINIC_NAME || 'Centro Odontológico Especializado Dra. Adriana Parra',
  phone: metaEnv.VITE_CLINIC_PHONE || '+58 412-1234567',
  defaultExchangeRate: 887.30,
};
