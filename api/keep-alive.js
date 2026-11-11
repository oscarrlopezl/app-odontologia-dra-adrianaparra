// Endpoint Vercel Serverless Function & Cron Job
// Mantiene activo el proyecto de Supabase y ofrece estado de salud en tiempo real

const decodeFallbackKey = (b64) => {
  try {
    if (typeof Buffer !== 'undefined') return Buffer.from(b64, 'base64').toString('utf8');
    if (typeof atob === 'function') return atob(b64);
  } catch {
    return '';
  }
  return '';
};

const SUPABASE_DEFAULT_URL = 'https://pqchasrzglktlpipgqfo.supabase.co';
const SUPABASE_DEFAULT_KEY = decodeFallbackKey('c2JfcHVibGlzaGFibGVfNGFHWDROMHBaYXcyYzNkN2wzTkxYQV8zNkIxZHNrUg==');

export default async function handler(req, res) {
  // Configurar cabeceras CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = (process.env.VITE_SUPABASE_URL || SUPABASE_DEFAULT_URL).trim().replace(/\/$/, '');
  const key = (process.env.VITE_SUPABASE_ANON_KEY || SUPABASE_DEFAULT_KEY).trim();

  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const [dbRes, authRes] = await Promise.allSettled([
      fetch(`${url}/rest/v1/clinic_settings?select=id,updated_at&limit=1`, {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        signal: controller.signal,
      }),
      fetch(`${url}/auth/v1/health`, {
        method: 'GET',
        headers: {
          apikey: key,
        },
        signal: controller.signal,
      }),
    ]);

    clearTimeout(timeout);
    const latencyMs = Date.now() - startTime;

    const dbOk = dbRes.status === 'fulfilled' && dbRes.value.ok;
    const dbCode = dbRes.status === 'fulfilled' ? dbRes.value.status : 0;
    const authOk = authRes.status === 'fulfilled' && authRes.value.ok;
    const authCode = authRes.status === 'fulfilled' ? authRes.value.status : 0;

    const isAlive = dbOk || authOk;

    return res.status(isAlive ? 200 : 503).json({
      success: isAlive,
      status: isAlive ? 'ONLINE' : 'UNREACHABLE',
      service: 'Consultorio Odontológico Especializado Dra. Adriana Parra',
      targetUrl: url,
      latencyMs,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          ok: dbOk,
          statusCode: dbCode,
        },
        auth: {
          ok: authOk,
          statusCode: authCode,
        },
      },
      message: isAlive
        ? `💓 Pulso Keep-Alive recibido con éxito (${latencyMs}ms). El contador de inactividad de Supabase ha sido reiniciado.`
        : '⚠️ No se pudo obtener respuesta satisfactoria de Supabase.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      message: `Error al ejecutar Keep-Alive: ${error.message}`,
      timestamp: new Date().toISOString(),
    });
  }
}
