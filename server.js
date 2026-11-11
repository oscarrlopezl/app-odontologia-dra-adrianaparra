import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// URL externa de Render (Render la inyecta automáticamente en RENDER_EXTERNAL_URL)
const APP_URL = process.env.RENDER_EXTERNAL_URL || process.env.APP_URL || process.env.PING_URL;
// Intervalo de llamadas de actividad: por defecto 10 minutos (600,000 ms)
const PING_INTERVAL_MS = parseInt(process.env.PING_INTERVAL_MS || '600000', 10);

// Endpoint de monitoreo / salud para Render, UptimeRobot o GitHub Actions
app.get(['/api/health', '/ping'], (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'App Odontológica Dra. Adriana Parra',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production',
  });
});

// Endpoint Keep-Alive para Supabase
const decodeFallbackKey = (b64) => Buffer.from(b64, 'base64').toString('utf8');
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://pqchasrzglktlpipgqfo.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || decodeFallbackKey('c2JfcHVibGlzaGFibGVfNGFHWDROMHBaYXcyYzNkN2wzTkxYQV8zNkIxZHNrUg==');

app.get('/api/keep-alive', async (req, res) => {
  try {
    const start = Date.now();
    const response = await fetch(`${SUPABASE_URL}/rest/v1/clinic_settings?select=id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    const elapsed = Date.now() - start;
    res.status(response.ok ? 200 : 502).json({
      success: response.ok,
      status: response.ok ? 'ONLINE' : 'ERROR',
      supabaseHttpStatus: response.status,
      latencyMs: elapsed,
      timestamp: new Date().toISOString(),
      message: response.ok
        ? '💓 Pulso Keep-Alive recibido con éxito. Supabase se mantiene activo.'
        : '⚠️ Supabase no respondió satisfactoriamente.',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Servir la carpeta compilada 'dist'
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));

// Fallback de SPA: cualquier otra ruta entrega index.html para React Router
app.use((req, res) => {
  res.sendFile('index.html', { root: distPath }, (err) => {
    if (err && !res.headersSent) {
      res.status(500).send('Error loading page');
    }
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor activo en puerto ${PORT}`);
  console.log(`📁 Sirviendo archivos estáticos desde: ${distPath}`);

  // Iniciar sistema de auto-llamadas (Keep-Alive) para evitar suspensión en Render
  startKeepAlive();
});

/**
 * Sistema Keep-Alive para Render (plan gratuito)
 * Realiza llamadas HTTP cada 10 minutos a sí mismo para evitar el reposo/sleep de 15 min.
 */
function startKeepAlive() {
  if (!APP_URL) {
    console.log('ℹ️ Keep-Alive en modo local: No se detectó RENDER_EXTERNAL_URL o APP_URL.');
    console.log('💡 Cuando esté en Render, se auto-activará con RENDER_EXTERNAL_URL.');
    return;
  }

  const pingEndpoint = APP_URL.replace(/\/+$/, '') + '/api/health';
  console.log(`⚡ Keep-Alive Activado: llamando a ${pingEndpoint} cada ${PING_INTERVAL_MS / 60000} minutos.`);

  setInterval(async () => {
    try {
      const start = Date.now();
      const response = await fetch(pingEndpoint);
      const elapsed = Date.now() - start;
      if (response.ok) {
        console.log(`[Keep-Alive 💓] Ping exitoso (${response.status}) en ${elapsed}ms -> ${new Date().toLocaleTimeString('es-VE')}`);
      } else {
        console.warn(`[Keep-Alive ⚠️] Respuesta no-OK: ${response.status}`);
      }
    } catch (err) {
      console.warn(`[Keep-Alive ⚠️] Error al llamar a ${pingEndpoint}:`, err.message);
    }
  }, PING_INTERVAL_MS);
}
