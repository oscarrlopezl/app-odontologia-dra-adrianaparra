/**
 * Servicio para consulta y sincronización automática de la tasa oficial del BCV (Banco Central de Venezuela)
 * Fuente primaria: DolarApi Oficial (BCV)
 * Respaldo: Open Exchange Rates API y memoria local segura
 */

const CACHE_KEY = 'dra_parra_bcv_cache';
export const CONTINGENCY_BCV_RATE = 887.30;

export async function fetchOfficialBcvRate() {
  // 1. Intentar Fuente Primaria: DolarApi Oficial
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch('https://ve.dolarapi.com/v1/dolares/oficial', {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
      },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const rawRate = Number(data.promedio || data.venta || data.compra);

      if (rawRate && rawRate > 0) {
        const result = {
          success: true,
          rate: Number(rawRate.toFixed(2)),
          rawRate,
          source: 'BCV Oficial',
          date: data.fechaActualizacion || new Date().toISOString(),
          timestamp: Date.now(),
        };

        // Guardar en caché local para cuando no haya luz ni internet
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (e) {
          console.warn('No se pudo guardar caché BCV:', e);
        }

        return result;
      }
    }
  } catch (err) {
    console.warn('Fallo al consultar DolarApi Oficial, intentando respaldo...', err.message);
  }

  // 2. Intentar Fuente Secundaria de Respaldo
  try {
    const controller2 = new AbortController();
    const timeoutId2 = setTimeout(() => controller2.abort(), 6000);

    const res2 = await fetch('https://open.er-api.com/v6/latest/USD', {
      signal: controller2.signal,
    });
    clearTimeout(timeoutId2);

    if (res2.ok) {
      const data2 = await res2.json();
      const vesRate = Number(data2.rates?.VES);

      if (vesRate && vesRate > 0) {
        const result = {
          success: true,
          rate: Number(vesRate.toFixed(2)),
          rawRate: vesRate,
          source: 'ExchangeRate (VES)',
          date: data2.time_last_update_utc || new Date().toISOString(),
          timestamp: Date.now(),
        };

        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(result));
        } catch (e) {
          // ignore
        }

        return result;
      }
    }
  } catch (err2) {
    console.warn('Fallo respaldo secundario de tasa:', err2.message);
  }

  // 3. Respaldo de Emergencia: Última tasa guardada en memoria local
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.rate && parsed.rate > 0) {
        return {
          ...parsed,
          source: `${parsed.source || 'BCV'} (Caché local)`,
          isCached: true,
        };
      }
    }
  } catch (e) {
    // ignore
  }

  return {
    success: false,
    rate: CONTINGENCY_BCV_RATE,
    source: 'Estimada BCV',
    isCached: true,
    timestamp: Date.now(),
  };
}

/**
 * Obtiene la tasa en caché de inmediato sin esperar petición HTTP
 */
export function getCachedBcvRate() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed.rate && parsed.rate > 0) return parsed;
    }
  } catch (e) {
    // ignore
  }
  return {
    rate: CONTINGENCY_BCV_RATE,
    source: 'BCV Oficial',
    date: null,
  };
}
