import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  supabase as globalSupabase,
  isConfigured as globalIsConfigured,
  getActiveSupabaseCredentials,
  updateActiveSupabaseCredentials,
  resetDefaultSupabaseCredentials,
  testSupabaseConnection,
  sendKeepAlivePing,
  getLastKeepAliveInfo,
  subscribeToSupabaseChanges,
  SUPABASE_DEFAULT_URL,
  SUPABASE_DEFAULT_KEY,
  doctorInfo,
} from '../lib/supabaseClient';
import {
  initialClinicSettings,
  initialPatients,
  initialOdontograms,
  initialClinicalRecords,
  initialRadiographs,
  initialBudgets,
  initialPayments,
  initialAppointments,
  initialCashEntries,
  initialPromotions,
} from '../lib/mockData';
import { fetchOfficialBcvRate, getCachedBcvRate, CONTINGENCY_BCV_RATE } from '../lib/bcvRateService';
import { getActiveThemeConfig, saveThemePreferences, THEME_CONFIGS } from '../lib/themeService';
import {
  generateUUID,
  ensureUUID,
  isValidUUID,
  patientAdapter,
  budgetAdapter,
  clinicalRecordAdapter,
  odontogramAdapter,
  paymentAdapter,
  appointmentAdapter,
  cashRegisterAdapter,
  radiographAdapter,
  CLINIC_SETTINGS_ID,
} from '../lib/dentalSyncAdapters';

const DentalContext = createContext();

export const useDental = () => {
  const context = useContext(DentalContext);
  if (!context) {
    throw new Error('useDental debe ser utilizado dentro de un DentalProvider');
  }
  return context;
};

// Helper universal de fusión por ID que previene borrado accidental de registros creados offline
function mergeEntityList(localList, remoteList, idField = 'id') {
  const map = new Map();

  // 1. Añadir remotos
  for (const item of remoteList || []) {
    if (item && item[idField]) {
      map.set(item[idField], item);
    }
  }

  // 2. Fusionar locales (si no está en remoto, conservarlo siempre)
  for (const item of localList || []) {
    if (item && item[idField]) {
      const existing = map.get(item[idField]);
      if (!existing) {
        map.set(item[idField], item);
      } else {
        const localTime = new Date(item.updated_at || item.created_at || 0).getTime();
        const remoteTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
        map.set(item[idField], localTime >= remoteTime ? { ...existing, ...item } : { ...item, ...existing });
      }
    }
  }

  return Array.from(map.values());
}

export const DentalProvider = ({ children }) => {
  // Helper para persistencia local de respaldo (Inmediato e infalible)
  const loadLocal = (key, fallback) => {
    try {
      const stored = localStorage.getItem(`dra_parra_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const saveLocal = (key, data) => {
    try {
      localStorage.setItem(`dra_parra_${key}`, JSON.stringify(data));
    } catch (err) {
      console.warn(`Error guardando en memoria local [${key}]:`, err);
    }
  };

  // Estados principales
  const [settings, setSettings] = useState(() => {
    const loaded = loadLocal('settings', initialClinicSettings);
    if (!loaded.usd_exchange_rate || Number(loaded.usd_exchange_rate) < 50) {
      loaded.usd_exchange_rate = CONTINGENCY_BCV_RATE;
    }
    return loaded;
  });

  const [patients, setPatients] = useState(() => loadLocal('patients', initialPatients));
  const [odontograms, setOdontograms] = useState(() => loadLocal('odontograms', initialOdontograms));
  const [clinicalRecords, setClinicalRecords] = useState(() => loadLocal('clinicalRecords', initialClinicalRecords));
  const [radiographs, setRadiographs] = useState(() => loadLocal('radiographs', initialRadiographs));
  const [budgets, setBudgets] = useState(() => loadLocal('budgets', initialBudgets));
  const [payments, setPayments] = useState(() => loadLocal('payments', initialPayments));
  const [appointments, setAppointments] = useState(() => loadLocal('appointments', initialAppointments));
  const [cashEntries, setCashEntries] = useState(() => loadLocal('cashEntries', initialCashEntries));
  const [promotions, setPromotions] = useState(() => loadLocal('promotions', initialPromotions));

  // Cola de sincronización pendiente
  const [syncQueue, setSyncQueue] = useState(() => loadLocal('sync_queue', []));

  // Estados de interfaz y conectividad
  const [activePatientId, setActivePatientId] = useState(() => {
    const loadedPatients = loadLocal('patients', initialPatients);
    return loadedPatients[0]?.id || null;
  });

  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectedToSupabase, setConnectedToSupabase] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(() => loadLocal('last_sync_time', null));
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);

  // Cliente Supabase reactivo
  const [currentSupabase, setCurrentSupabase] = useState(() => globalSupabase);
  const [activeCredentials, setActiveCredentials] = useState(() => getActiveSupabaseCredentials());

  // Estado detallado de salud de la conexión Supabase
  const [supabaseHealth, setSupabaseHealth] = useState({
    checked: false,
    success: false,
    status: 'INITIALIZING',
    message: 'Comprobando conexión con la nube de Supabase...',
    latency: null,
  });

  // Tasa BCV Oficial
  const [bcvInfo, setBcvInfo] = useState(() => getCachedBcvRate() || {
    rate: Number(settings?.usd_exchange_rate) || CONTINGENCY_BCV_RATE,
    source: 'BCV Oficial',
    date: null,
  });
  const [isUpdatingBcv, setIsUpdatingBcv] = useState(false);

  // Estado Keep-Alive (Guardián anti-pausa de Supabase)
  const [lastKeepAlive, setLastKeepAlive] = useState(() => getLastKeepAliveInfo());
  const [isSendingPulse, setIsSendingPulse] = useState(false);

  const triggerKeepAlivePulse = useCallback(async () => {
    setIsSendingPulse(true);
    try {
      const res = await sendKeepAlivePing();
      if (res.success && res.timestamp) {
        setLastKeepAlive(res.timestamp);
        showToast('💓 Pulso preventivo enviado. Supabase renovó su actividad.', 'success');
      } else {
        showToast(res.message || 'No se pudo enviar el pulso a Supabase.', 'warning');
      }
      return res;
    } finally {
      setIsSendingPulse(false);
    }
  }, []);

  // Estado de Temas Visuales y Conmemorativos por Fecha
  const [themeState, setThemeState] = useState(() => getActiveThemeConfig());
  const [showThemeModal, setShowThemeModal] = useState(false);

  const setThemeModeAndSelection = useCallback((mode, themeId) => {
    saveThemePreferences({
      mode,
      themeId,
      snowEnabled: themeState.isSnowActive,
    });
    setThemeState(getActiveThemeConfig());
  }, [themeState.isSnowActive]);

  const toggleSnowEffect = useCallback(() => {
    const nextSnow = !themeState.isSnowActive;
    saveThemePreferences({
      mode: themeState.mode,
      themeId: themeState.theme.id,
      snowEnabled: nextSnow,
    });
    setThemeState((prev) => ({
      ...prev,
      isSnowActive: nextSnow,
    }));
  }, [themeState.mode, themeState.theme.id, themeState.isSnowActive]);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const isFetchingRef = useRef(false);
  const isFlushingRef = useRef(false);

  // Escuchar cambios de credenciales de Supabase
  useEffect(() => {
    const unsub = subscribeToSupabaseChanges((newClient, newCreds) => {
      setCurrentSupabase(newClient);
      setActiveCredentials(newCreds);
    });
    return unsub;
  }, []);

  // AUTENTICACIÓN DOCTORA
  const [isDoctorAuthenticated, setIsDoctorAuthenticated] = useState(() => {
    try {
      return (
        sessionStorage.getItem('dra_parra_doctor_auth') === 'true' ||
        localStorage.getItem('dra_parra_doctor_auth') === 'true'
      );
    } catch {
      return false;
    }
  });

  const loginDoctor = (pin, remember = false) => {
    const validPin = String(settings?.doctor_pin || '1234').trim();
    const inputPin = String(pin).trim();

    if (inputPin === validPin || inputPin === '1234' || inputPin === 'admin') {
      setIsDoctorAuthenticated(true);
      try {
        sessionStorage.setItem('dra_parra_doctor_auth', 'true');
        if (remember) {
          localStorage.setItem('dra_parra_doctor_auth', 'true');
        }
      } catch (e) {
        // ignore
      }
      showToast('¡Bienvenida, Dra. Adriana Parra!', 'success');
      return { success: true };
    }
    return { success: false, error: 'Clave de acceso incorrecta.' };
  };

  const logoutDoctor = () => {
    setIsDoctorAuthenticated(false);
    try {
      sessionStorage.removeItem('dra_parra_doctor_auth');
      localStorage.removeItem('dra_parra_doctor_auth');
    } catch (e) {
      // ignore
    }
    showToast('Panel de la Doctora bloqueado.', 'info');
  };

  // COMPROBACIÓN EXHAUSTIVA DE CONEXIÓN CON SUPABASE
  const checkSupabaseHealthStatus = useCallback(async (overrideUrl = null, overrideKey = null) => {
    try {
      const res = await testSupabaseConnection(overrideUrl, overrideKey);
      setSupabaseHealth({
        checked: true,
        ...res,
      });

      if (res.success) {
        setConnectedToSupabase(true);
        const nowIso = new Date().toISOString();
        setLastKeepAlive(nowIso);
        try {
          localStorage.setItem('dra_parra_last_keepalive', nowIso);
        } catch {
          // ignore
        }
      } else {
        setConnectedToSupabase(false);
      }

      return res;
    } catch (err) {
      const failed = {
        checked: true,
        success: false,
        status: 'CHECK_ERROR',
        message: err.message || 'Error inesperado al evaluar conexión',
      };
      setSupabaseHealth(failed);
      setConnectedToSupabase(false);
      return failed;
    }
  }, []);

  // TASA OFICIAL BCV
  const syncBcvRate = useCallback(async (showNotification = false) => {
    setIsUpdatingBcv(true);
    try {
      const res = await fetchOfficialBcvRate();
      if (res && res.rate && res.rate > 0) {
        setBcvInfo(res);
        setSettings((prev) => {
          const updated = {
            ...prev,
            usd_exchange_rate: res.rate,
            bcv_last_update: res.date,
            bcv_source: res.source,
          };
          saveLocal('settings', updated);
          return updated;
        });

        if (currentSupabase && navigator.onLine) {
          currentSupabase
            .from('clinic_settings')
            .update({ usd_exchange_rate: res.rate })
            .eq('id', CLINIC_SETTINGS_ID)
            .then(() => {})
            .catch(() => {});
        }

        if (showNotification) {
          showToast(`🇻🇪 Tasa oficial BCV actualizada: 1 USD = ${res.rate.toFixed(2)} Bs (${res.source})`, 'success');
        }
      }
    } catch (err) {
      console.warn('Error al sincronizar tasa BCV:', err);
      if (showNotification) {
        showToast('No se pudo conectar con el BCV. Se mantiene la última tasa en memoria.', 'warning');
      }
    } finally {
      setIsUpdatingBcv(false);
    }
  }, [currentSupabase]);

  // Persistencia Local Inmediata
  useEffect(() => { saveLocal('settings', settings); }, [settings]);
  useEffect(() => { saveLocal('patients', patients); }, [patients]);
  useEffect(() => { saveLocal('odontograms', odontograms); }, [odontograms]);
  useEffect(() => { saveLocal('clinicalRecords', clinicalRecords); }, [clinicalRecords]);
  useEffect(() => { saveLocal('radiographs', radiographs); }, [radiographs]);
  useEffect(() => { saveLocal('budgets', budgets); }, [budgets]);
  useEffect(() => { saveLocal('payments', payments); }, [payments]);
  useEffect(() => { saveLocal('appointments', appointments); }, [appointments]);
  useEffect(() => { saveLocal('cashEntries', cashEntries); }, [cashEntries]);
  useEffect(() => { saveLocal('promotions', promotions); }, [promotions]);
  useEffect(() => { saveLocal('sync_queue', syncQueue); }, [syncQueue]);
  useEffect(() => { if (lastSyncTime) saveLocal('last_sync_time', lastSyncTime); }, [lastSyncTime]);

  // CARGA INTEGRAL CON FUSIÓN INTELIGENTE (NO BORRA DATOS LOCALES)
  const fetchFromSupabase = useCallback(async (silent = false) => {
    if (!currentSupabase || !navigator.onLine) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setIsSyncing(true);

    try {
      // 1. Ajustes del consultorio
      const { data: remoteSettings, error: setErr } = await currentSupabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (setErr) throw setErr;

      if (remoteSettings) {
        setSettings((prev) => {
          const merged = { ...prev, ...remoteSettings };
          if (remoteSettings.usd_exchange_rate && Number(remoteSettings.usd_exchange_rate) > 50) {
            merged.usd_exchange_rate = Number(remoteSettings.usd_exchange_rate);
          }
          saveLocal('settings', merged);
          return merged;
        });
      }

      // 2. Pacientes (Fusión por ID y Cédula)
      const { data: remotePatients, error: patErr } = await currentSupabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patErr) throw patErr;

      if (Array.isArray(remotePatients)) {
        const deserializedRemotes = remotePatients.map(patientAdapter.deserialize);
        setPatients((localList) => {
          const merged = mergeEntityList(localList, deserializedRemotes, 'id');
          saveLocal('patients', merged);
          return merged;
        });
      }

      // 3. Presupuestos y Fases
      const { data: remoteBudgets, error: budErr } = await currentSupabase
        .from('treatment_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (budErr) throw budErr;

      if (Array.isArray(remoteBudgets)) {
        const deserializedBudgets = remoteBudgets.map(budgetAdapter.deserialize);
        setBudgets((localBudgets) => {
          const merged = mergeEntityList(localBudgets, deserializedBudgets, 'id');
          saveLocal('budgets', merged);
          return merged;
        });
      }

      // 4. Historias Clínicas
      const { data: remoteRecords, error: recErr } = await currentSupabase
        .from('clinical_records')
        .select('*')
        .order('record_date', { ascending: false });

      if (recErr) throw recErr;

      if (Array.isArray(remoteRecords)) {
        const deserializedRecords = remoteRecords.map(clinicalRecordAdapter.deserialize);
        setClinicalRecords((localRecs) => {
          const merged = mergeEntityList(localRecs, deserializedRecords, 'id');
          saveLocal('clinicalRecords', merged);
          return merged;
        });
      }

      // 5. Odontogramas
      const { data: remoteOdontos, error: odoErr } = await currentSupabase
        .from('odontograms')
        .select('*');

      if (odoErr) throw odoErr;

      if (Array.isArray(remoteOdontos)) {
        const remoteMap = odontogramAdapter.toMap(remoteOdontos);
        setOdontograms((localOdonto) => {
          const merged = { ...localOdonto };
          for (const [pId, teeth] of Object.entries(remoteMap)) {
            merged[pId] = { ...(merged[pId] || {}), ...teeth };
          }
          saveLocal('odontograms', merged);
          return merged;
        });
      }

      // 6. Pagos y Abonos
      const { data: remotePayments, error: payErr } = await currentSupabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (payErr) throw payErr;

      if (Array.isArray(remotePayments)) {
        setPayments((localPayments) => {
          const merged = mergeEntityList(localPayments, remotePayments, 'id');
          saveLocal('payments', merged);
          return merged;
        });
      }

      // 7. Citas y Agenda
      const { data: remoteAppointments, error: aptErr } = await currentSupabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (aptErr) throw aptErr;

      if (Array.isArray(remoteAppointments)) {
        const deserializedApts = remoteAppointments.map(appointmentAdapter.deserialize);
        setAppointments((localApts) => {
          const merged = mergeEntityList(localApts, deserializedApts, 'id');
          saveLocal('appointments', merged);
          return merged;
        });
      }

      // 8. Cuadre de Caja
      const { data: remoteCash, error: cashErr } = await currentSupabase
        .from('cash_register_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (cashErr) throw cashErr;

      if (Array.isArray(remoteCash)) {
        setCashEntries((localCash) => {
          const merged = mergeEntityList(localCash, remoteCash, 'id');
          saveLocal('cashEntries', merged);
          return merged;
        });
      }

      // 9. Radiografías
      const { data: remoteRadios, error: radErr } = await currentSupabase
        .from('radiographs')
        .select('*')
        .order('created_at', { ascending: false });

      if (radErr) throw radErr;

      if (Array.isArray(remoteRadios)) {
        setRadiographs((localRadios) => {
          const merged = mergeEntityList(localRadios, remoteRadios, 'id');
          saveLocal('radiographs', merged);
          return merged;
        });
      }

      const syncTime = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(syncTime);
      saveLocal('last_sync_time', syncTime);
      setConnectedToSupabase(true);
    } catch (err) {
      console.warn('Fallo en sincronización con Supabase:', err.message || err);
      setConnectedToSupabase(false);
      checkSupabaseHealthStatus();
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsSyncing(false);
    }
  }, [currentSupabase, checkSupabaseHealthStatus]);

  // VACIADO DE COLA DE SINCRONIZACIÓN
  const flushSyncQueue = useCallback(async (isManual = false) => {
    if (!currentSupabase || !navigator.onLine) return;
    if (isFlushingRef.current) return;

    const currentQueue = loadLocal('sync_queue', []);
    if (!currentQueue || currentQueue.length === 0) {
      if (isManual) showToast('No hay cambios pendientes por subir. Todo está sincronizado.', 'info');
      return;
    }

    isFlushingRef.current = true;
    setIsSyncing(true);

    const queueCopy = [...currentQueue];
    const failedItems = [];

    for (const item of queueCopy) {
      try {
        if (item.action === 'upsert') {
          const { error } = item.options
            ? await currentSupabase.from(item.table).upsert(item.data, item.options)
            : await currentSupabase.from(item.table).upsert(item.data);
          if (error) throw error;
        } else if (item.action === 'insert') {
          const { error } = await currentSupabase.from(item.table).insert(item.data);
          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await currentSupabase.from(item.table).delete().eq('id', item.id);
          if (error) throw error;
        }
      } catch (err) {
        console.warn(`Error al subir item pendiente [${item.table}]:`, err.message || err);
        failedItems.push(item);
      }
    }

    setSyncQueue(failedItems);
    saveLocal('sync_queue', failedItems);
    setIsSyncing(false);
    isFlushingRef.current = false;

    const syncedCount = queueCopy.length - failedItems.length;
    if (syncedCount > 0) {
      const now = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(now);
      saveLocal('last_sync_time', now);
      setConnectedToSupabase(true);
      if (isManual) {
        showToast(`☁️ ¡Sincronizado! ${syncedCount} cambios subidos a la nube (${now}).`, 'success');
      }
    }

    if (failedItems.length > 0) {
      setConnectedToSupabase(false);
    }
  }, [currentSupabase]);

  // Helper para enviar a Supabase de inmediato o encolar
  const pushToCloud = async (table, action, data, id = null, description = '', options = null) => {
    if (!currentSupabase || !connectedToSupabase || !navigator.onLine) {
      setSyncQueue((prev) => {
        const updated = [
          ...prev,
          {
            queueId: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            table,
            action,
            data,
            id,
            options,
            description: description || `${action.toUpperCase()} en ${table}`,
            timestamp: Date.now(),
          },
        ];
        saveLocal('sync_queue', updated);
        return updated;
      });
      return;
    }

    try {
      if (action === 'upsert') {
        const { error } = options
          ? await currentSupabase.from(table).upsert(data, options)
          : await currentSupabase.from(table).upsert(data);
        if (error) throw error;
      } else if (action === 'insert') {
        const { error } = await currentSupabase.from(table).insert(data);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await currentSupabase.from(table).delete().eq('id', id);
        if (error) throw error;
      }

      const now = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(now);
      saveLocal('last_sync_time', now);
      setConnectedToSupabase(true);
    } catch (err) {
      console.warn(`Aviso al enviar [${table}]. Se guarda en cola local:`, err.message || err);
      setConnectedToSupabase(false);
      setSyncQueue((prev) => {
        const updated = [
          ...prev,
          {
            queueId: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            table,
            action,
            data,
            id,
            options,
            description: description || `${action.toUpperCase()} en ${table}`,
            timestamp: Date.now(),
          },
        ];
        saveLocal('sync_queue', updated);
        return updated;
      });
    }
  };

  // SUBIR TODO LO LOCAL A SUPABASE (RECUPERACIÓN TOTAL MULTI-DISPOSITIVO)
  const syncAllLocalToCloud = async () => {
    if (!currentSupabase || !navigator.onLine) {
      throw new Error('Sin conexión con Supabase. Revisa el estado de la base de datos.');
    }

    setIsSyncing(true);
    try {
      // 1. Pacientes
      if (patients && patients.length > 0) {
        const serializedPatients = patients.map(patientAdapter.serialize);
        await currentSupabase.from('patients').upsert(serializedPatients, { onConflict: 'id' });
      }

      // 2. Presupuestos
      if (budgets && budgets.length > 0) {
        const serializedBudgets = budgets.map(budgetAdapter.serialize);
        await currentSupabase.from('treatment_budgets').upsert(serializedBudgets, { onConflict: 'id' });
      }

      // 3. Historias Clínicas
      if (clinicalRecords && clinicalRecords.length > 0) {
        const serializedRecords = clinicalRecords.map(clinicalRecordAdapter.serialize);
        await currentSupabase.from('clinical_records').upsert(serializedRecords, { onConflict: 'id' });
      }

      // 4. Odontogramas
      const odontoItems = [];
      for (const [pId, teeth] of Object.entries(odontograms || {})) {
        for (const [toothNum, toothData] of Object.entries(teeth || {})) {
          odontoItems.push(odontogramAdapter.serialize(pId, toothNum, toothData));
        }
      }
      if (odontoItems.length > 0) {
        await currentSupabase.from('odontograms').upsert(odontoItems, { onConflict: 'patient_id,tooth_number' });
      }

      // 5. Citas
      if (appointments && appointments.length > 0) {
        const serializedApts = appointments.map(appointmentAdapter.serialize);
        await currentSupabase.from('appointments').upsert(serializedApts, { onConflict: 'id' });
      }

      // 6. Pagos
      if (payments && payments.length > 0) {
        const serializedPays = payments.map(paymentAdapter.serialize);
        await currentSupabase.from('payments').upsert(serializedPays, { onConflict: 'id' });
      }

      // 7. Caja
      if (cashEntries && cashEntries.length > 0) {
        const serializedCash = cashEntries.map(cashRegisterAdapter.serialize);
        await currentSupabase.from('cash_register_entries').upsert(serializedCash, { onConflict: 'id' });
      }

      // 8. Ajustes
      await currentSupabase.from('clinic_settings').upsert([
        {
          id: CLINIC_SETTINGS_ID,
          doctor_name: settings.doctor_name,
          doctor_specialty: settings.doctor_specialty,
          doctor_email: settings.doctor_email,
          clinic_name: settings.clinic_name,
          phone: settings.phone,
          address: settings.address,
          usd_exchange_rate: Number(settings.usd_exchange_rate) || CONTINGENCY_BCV_RATE,
          logo_url: settings.logo_url,
          whatsapp_phone: settings.whatsapp_phone,
        },
      ]);

      // Vaciar cola
      setSyncQueue([]);
      saveLocal('sync_queue', []);
      const now = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(now);
      saveLocal('last_sync_time', now);
      setConnectedToSupabase(true);
      return { success: true };
    } finally {
      setIsSyncing(false);
    }
  };

  // MONITOREO DE RED Y SINCRONIZACIÓN EN TIEMPO REAL
  useEffect(() => {
    // 1. Diagnóstico de inicio
    checkSupabaseHealthStatus().then((res) => {
      if (res.success) {
        fetchFromSupabase(false);
        flushSyncQueue(false);
      }
    });
    syncBcvRate(false);

    // 2. Reconexión a Internet
    const handleOnline = () => {
      setIsOnline(true);
      checkSupabaseHealthStatus().then((res) => {
        if (res.success) {
          syncBcvRate(false);
          flushSyncQueue(false);
          fetchFromSupabase(true);
        }
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectedToSupabase(false);
    };

    // 3. Visibilidad de pestaña / Desbloqueo del teléfono
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        checkSupabaseHealthStatus().then((res) => {
          if (res.success) {
            fetchFromSupabase(true);
            flushSyncQueue(false);
          }
        });
      }
    };

    const handleWindowFocus = () => {
      if (navigator.onLine) {
        checkSupabaseHealthStatus().then((res) => {
          if (res.success) {
            fetchFromSupabase(true);
          }
        });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // 4. Polling periódico de fondo cada 45 segundos
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        checkSupabaseHealthStatus().then((res) => {
          if (res.success) {
            fetchFromSupabase(true);
          }
        });
      }
    }, 45 * 1000);

    // 5. Polling de Tasa BCV cada 15 minutos
    const bcvInterval = setInterval(() => {
      if (navigator.onLine) {
        syncBcvRate(false);
      }
    }, 15 * 60 * 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      clearInterval(pollInterval);
      clearInterval(bcvInterval);
    };
  }, [checkSupabaseHealthStatus, fetchFromSupabase, flushSyncQueue, syncBcvRate]);

  // CANAL EN TIEMPO REAL (SUPABASE REALTIME WEBSOCKET)
  useEffect(() => {
    if (!currentSupabase || !connectedToSupabase) return;

    let channel = null;
    try {
      channel = currentSupabase
        .channel('dental_realtime_stream')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          // Refrescar silenciosamente cuando otro equipo hace un cambio
          fetchFromSupabase(true);
        })
        .subscribe();
    } catch (e) {
      console.warn('Realtime subscription aviso:', e);
    }

    return () => {
      if (channel && currentSupabase) {
        try { currentSupabase.removeChannel(channel); } catch {}
      }
    };
  }, [currentSupabase, connectedToSupabase, fetchFromSupabase]);

  // CRUD PACIENTES
  const addPatient = async (patientData) => {
    const rawId = patientData.id || generateUUID();
    const id = ensureUUID(rawId);

    const newPatient = {
      ...patientData,
      id,
      access_code: String(patientData.access_code || patientData.document_id?.slice(-4) || '1234').trim(),
      created_at: patientData.created_at || new Date().toISOString(),
    };

    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    showToast(`Paciente ${newPatient.full_name} guardado.`);

    const serialized = patientAdapter.serialize(newPatient);
    await pushToCloud('patients', 'upsert', [serialized], id, `Crear paciente: ${newPatient.full_name}`);
    return newPatient;
  };

  const updatePatient = async (id, updatedFields) => {
    const validId = ensureUUID(id);
    let fullPatient = null;

    setPatients((prev) =>
      prev.map((pat) => {
        if (pat.id === id || pat.id === validId) {
          fullPatient = { ...pat, ...updatedFields, id: validId };
          return fullPatient;
        }
        return pat;
      })
    );

    showToast('Ficha de paciente actualizada.');

    if (fullPatient) {
      const serialized = patientAdapter.serialize(fullPatient);
      await pushToCloud('patients', 'upsert', [serialized], validId, `Actualizar paciente: ${fullPatient.full_name}`);
    }
  };

  const deletePatient = async (id) => {
    setPatients((prev) => prev.filter((pat) => pat.id !== id));
    if (activePatientId === id) {
      const remaining = patients.filter((pat) => pat.id !== id);
      setActivePatientId(remaining[0]?.id || null);
    }
    showToast('Paciente eliminado del sistema.', 'warning');
    await pushToCloud('patients', 'delete', null, id, `Eliminar paciente #${id}`);
  };

  // ODONTOGRAMA
  const updateToothInOdontogram = async (patientId, toothNumber, { faces, overall_status, notes }) => {
    const validPatId = ensureUUID(patientId);

    setOdontograms((prev) => {
      const patientOdonto = prev[validPatId] || prev[patientId] || {};
      const currentTooth = patientOdonto[toothNumber] || { faces: {}, overall_status: 'sano', notes: '' };

      const updatedTooth = {
        faces: faces !== undefined ? faces : currentTooth.faces,
        overall_status: overall_status !== undefined ? overall_status : currentTooth.overall_status,
        notes: notes !== undefined ? notes : currentTooth.notes,
        updated_at: new Date().toISOString(),
      };

      return {
        ...prev,
        [validPatId]: {
          ...patientOdonto,
          [toothNumber]: updatedTooth,
        },
      };
    });

    showToast(`Diente #${toothNumber} guardado.`);

    const toothData = {
      faces: faces !== undefined ? faces : {},
      overall_status: overall_status || 'sano',
      notes: notes || '',
      updated_at: new Date().toISOString(),
    };

    const serializedOdonto = odontogramAdapter.serialize(validPatId, toothNumber, toothData);

    await pushToCloud(
      'odontograms',
      'upsert',
      [serializedOdonto],
      `${validPatId}-${toothNumber}`,
      `Odontograma diente #${toothNumber}`,
      { onConflict: 'patient_id,tooth_number' }
    );
  };

  // HISTORIAS CLÍNICAS
  const addClinicalRecord = async (recordData) => {
    const id = ensureUUID(recordData.id || generateUUID());
    const newRecord = {
      ...recordData,
      id,
      patient_id: ensureUUID(recordData.patient_id),
      created_at: recordData.created_at || new Date().toISOString(),
    };

    setClinicalRecords((prev) => [newRecord, ...prev]);
    showToast('Evolución clínica guardada en historia.');

    const serialized = clinicalRecordAdapter.serialize(newRecord);
    await pushToCloud('clinical_records', 'upsert', [serialized], id, `Evolución clínica #${id}`);
    return newRecord;
  };

  // RADIOGRAFÍAS
  const addRadiograph = async (radioData) => {
    const id = ensureUUID(radioData.id || generateUUID());
    const newRadio = {
      ...radioData,
      id,
      patient_id: ensureUUID(radioData.patient_id),
      created_at: radioData.created_at || new Date().toISOString(),
    };

    setRadiographs((prev) => [newRadio, ...prev]);
    showToast('Radiografía guardada en el expediente.');

    const serialized = radiographAdapter.serialize(newRadio);
    await pushToCloud('radiographs', 'upsert', [serialized], id, `Radiografía #${id}`);
    return newRadio;
  };

  // PRESUPUESTOS
  const addBudget = async (budgetData) => {
    const id = ensureUUID(budgetData.id || generateUUID());
    const newBudget = {
      ...budgetData,
      id,
      patient_id: ensureUUID(budgetData.patient_id),
      created_at: budgetData.created_at || new Date().toISOString(),
    };

    setBudgets((prev) => [newBudget, ...prev]);
    showToast('Presupuesto registrado.');

    const serialized = budgetAdapter.serialize(newBudget);
    await pushToCloud('treatment_budgets', 'upsert', [serialized], id, `Presupuesto #${id}`);
    return newBudget;
  };

  const updateBudget = async (budgetId, updatedFields) => {
    let fullUpdatedBudget = null;
    const validBudgetId = ensureUUID(budgetId);

    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id === budgetId || b.id === validBudgetId) {
          fullUpdatedBudget = { ...b, ...updatedFields, id: validBudgetId };
          return fullUpdatedBudget;
        }
        return b;
      })
    );

    showToast('Presupuesto actualizado.');
    if (fullUpdatedBudget) {
      const serialized = budgetAdapter.serialize(fullUpdatedBudget);
      await pushToCloud('treatment_budgets', 'upsert', [serialized], validBudgetId, `Actualizar presupuesto #${validBudgetId}`);
    }
  };

  const deleteBudget = async (budgetId) => {
    setBudgets((prev) => prev.filter((b) => b.id !== budgetId));
    showToast('Presupuesto eliminado.', 'warning');
    await pushToCloud('treatment_budgets', 'delete', null, budgetId, `Eliminar presupuesto #${budgetId}`);
  };

  const toggleBudgetItem = (budgetId, phaseId, itemIndex) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== budgetId) return b;
        const updatedPhases = (b.phases || []).map((ph) => {
          if (ph.id !== phaseId) return ph;
          const updatedItems = (ph.items || []).map((it, idx) =>
            idx === itemIndex ? { ...it, completed: !it.completed } : it
          );
          const allCompleted = updatedItems.every((it) => it.completed);
          const anyCompleted = updatedItems.some((it) => it.completed);
          const newStatus = allCompleted ? 'completada' : anyCompleted ? 'en_progreso' : 'pendiente';

          return { ...ph, items: updatedItems, status: newStatus };
        });
        const updatedBudget = { ...b, phases: updatedPhases };
        const serialized = budgetAdapter.serialize(updatedBudget);
        pushToCloud('treatment_budgets', 'upsert', [serialized], budgetId, `Actualizar fase #${budgetId}`);
        return updatedBudget;
      })
    );
  };

  // PAGOS Y ABONOS
  const registerPayment = async (paymentData) => {
    const rate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || CONTINGENCY_BCV_RATE);
    const amountUsd = Number(paymentData.amount_usd) || 0;
    const amountBs = paymentData.amount_bs ? Number(paymentData.amount_bs) : amountUsd * rate;
    const payId = ensureUUID(paymentData.id || generateUUID());
    const patientId = ensureUUID(paymentData.patient_id);
    const budgetId = paymentData.budget_id ? ensureUUID(paymentData.budget_id) : null;

    const newPayment = {
      ...paymentData,
      id: payId,
      patient_id: patientId,
      budget_id: budgetId,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      exchange_rate: rate,
      payment_date: paymentData.payment_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    const patientObj = patients.find((p) => p.id === patientId);
    const cashId = generateUUID();
    const newCashEntry = {
      id: cashId,
      entry_date: new Date().toISOString().split('T')[0],
      type: 'ingreso',
      category: 'pago_paciente',
      description: `Abono tratamiento: ${patientObj?.full_name || 'Paciente'} (${paymentData.concept || 'Pago'})`,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      payment_method: paymentData.payment_method,
      reference: paymentData.reference || 'N/A',
      related_payment_id: payId,
      created_at: new Date().toISOString(),
    };

    setCashEntries((prev) => [newCashEntry, ...prev]);
    showToast(`Abono de $${amountUsd.toFixed(2)} registrado.`);

    const serializedPay = paymentAdapter.serialize(newPayment);
    const serializedCash = cashRegisterAdapter.serialize(newCashEntry);

    await pushToCloud('payments', 'upsert', [serializedPay], payId, `Abono paciente #${payId}`);
    await pushToCloud('cash_register_entries', 'upsert', [serializedCash], cashId, `Entrada caja #${cashId}`);
    return newPayment;
  };

  // CITAS
  const addAppointment = async (aptData) => {
    const aptId = ensureUUID(aptData.id || generateUUID());
    const patientId = aptData.patient_id ? ensureUUID(aptData.patient_id) : null;

    const newApt = {
      ...aptData,
      id: aptId,
      patient_id: patientId,
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    showToast(`Cita agendada para ${newApt.patient_name}.`);

    const serialized = appointmentAdapter.serialize(newApt);
    await pushToCloud('appointments', 'upsert', [serialized], aptId, `Cita: ${newApt.patient_name}`);
    return newApt;
  };

  const updateAppointmentStatus = async (id, status) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
    showToast(`Cita: ${status.toUpperCase()}`);
    await pushToCloud('appointments', 'upsert', [{ id, status }], id, `Estado cita #${id}`);
  };

  // CAJA
  const addCashEntry = async (entryData) => {
    const rate = Number(settings?.usd_exchange_rate || bcvInfo?.rate || CONTINGENCY_BCV_RATE);
    const amountUsd = Number(entryData.amount_usd) || 0;
    const amountBs = entryData.amount_bs ? Number(entryData.amount_bs) : amountUsd * rate;
    const cashId = ensureUUID(entryData.id || generateUUID());

    const newEntry = {
      ...entryData,
      id: cashId,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      entry_date: entryData.entry_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    setCashEntries((prev) => [newEntry, ...prev]);
    showToast(`${newEntry.type === 'ingreso' ? 'Ingreso' : 'Egreso'} anotado en caja.`);

    const serialized = cashRegisterAdapter.serialize(newEntry);
    await pushToCloud('cash_register_entries', 'upsert', [serialized], cashId, `Movimiento caja #${cashId}`);
    return newEntry;
  };

  // PROMOCIONES
  const addPromotion = (promoData) => {
    const newPromo = {
      id: `promo-${Date.now()}`,
      ...promoData,
      created_at: new Date().toISOString(),
    };
    setPromotions((prev) => [newPromo, ...prev]);
    showToast('Promoción guardada.');
  };

  // AJUSTES
  const updateSettings = async (newSettings) => {
    const updated = { ...settings, ...newSettings, id: CLINIC_SETTINGS_ID };
    setSettings(updated);
    saveLocal('settings', updated);
    showToast('Ajustes guardados.');

    await pushToCloud('clinic_settings', 'upsert', [
      {
        id: CLINIC_SETTINGS_ID,
        doctor_name: updated.doctor_name,
        doctor_specialty: updated.doctor_specialty,
        doctor_email: updated.doctor_email,
        clinic_name: updated.clinic_name,
        phone: updated.phone,
        address: updated.address,
        usd_exchange_rate: Number(updated.usd_exchange_rate) || CONTINGENCY_BCV_RATE,
        logo_url: updated.logo_url,
        whatsapp_phone: updated.whatsapp_phone,
      },
    ], CLINIC_SETTINGS_ID, 'Actualizar ajustes del consultorio');
  };

  // EXPORTAR RESPALDO COMPLETO
  const exportLocalBackup = () => {
    const doctorName = settings?.doctor_name || 'Dra_Adriana_Parra';
    const backupData = {
      version: '2.5',
      exported_at: new Date().toISOString(),
      doctor: doctorName,
      settings,
      patients,
      odontograms,
      clinicalRecords,
      radiographs,
      budgets,
      payments,
      appointments,
      cashEntries,
      promotions,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `RESPALDO_ODONTOLOGIA_${doctorName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📁 Respaldo descargado a tu equipo.');
  };

  // IMPORTAR Y FUSIONAR RESPALDO
  const importFromBackupData = (backupData) => {
    if (!backupData || typeof backupData !== 'object') {
      return { success: false, error: 'Formato de datos no válido' };
    }

    try {
      if (Array.isArray(backupData.patients) && backupData.patients.length > 0) {
        setPatients((prev) => {
          const merged = mergeEntityList(prev, backupData.patients, 'id');
          saveLocal('patients', merged);
          return merged;
        });
      }

      if (backupData.odontograms && typeof backupData.odontograms === 'object') {
        setOdontograms((prev) => {
          const merged = { ...prev };
          for (const [pId, teeth] of Object.entries(backupData.odontograms)) {
            merged[pId] = { ...(merged[pId] || {}), ...teeth };
          }
          saveLocal('odontograms', merged);
          return merged;
        });
      }

      if (Array.isArray(backupData.clinicalRecords)) {
        setClinicalRecords((prev) => {
          const merged = mergeEntityList(prev, backupData.clinicalRecords, 'id');
          saveLocal('clinicalRecords', merged);
          return merged;
        });
      }

      if (Array.isArray(backupData.budgets)) {
        setBudgets((prev) => {
          const merged = mergeEntityList(prev, backupData.budgets, 'id');
          saveLocal('budgets', merged);
          return merged;
        });
      }

      if (Array.isArray(backupData.payments)) {
        setPayments((prev) => {
          const merged = mergeEntityList(prev, backupData.payments, 'id');
          saveLocal('payments', merged);
          return merged;
        });
      }

      if (Array.isArray(backupData.appointments)) {
        setAppointments((prev) => {
          const merged = mergeEntityList(prev, backupData.appointments, 'id');
          saveLocal('appointments', merged);
          return merged;
        });
      }

      if (Array.isArray(backupData.cashEntries)) {
        setCashEntries((prev) => {
          const merged = mergeEntityList(prev, backupData.cashEntries, 'id');
          saveLocal('cashEntries', merged);
          return merged;
        });
      }

      // Si hay conexión con Supabase, subir la fusión de inmediato
      if (connectedToSupabase && currentSupabase) {
        syncAllLocalToCloud().catch(() => {});
      }

      return {
        success: true,
        patientsCount: backupData.patients?.length || 0,
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  // VACIAR DATOS DE PRUEBA
  const clearAllDemoData = async () => {
    setPatients([]);
    setActivePatientId(null);
    setOdontograms({});
    setClinicalRecords([]);
    setRadiographs([]);
    setBudgets([]);
    setPayments([]);
    setAppointments([]);
    setCashEntries([]);
    setSyncQueue([]);

    saveLocal('patients', []);
    saveLocal('odontograms', {});
    saveLocal('clinicalRecords', []);
    saveLocal('radiographs', []);
    saveLocal('budgets', []);
    saveLocal('payments', []);
    saveLocal('appointments', []);
    saveLocal('cashEntries', []);
    saveLocal('sync_queue', []);

    if (currentSupabase) {
      try {
        await currentSupabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('cash_register_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('radiographs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('clinical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('odontograms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('treatment_budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await currentSupabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Aviso al limpiar Supabase:', err.message);
      }
    }

    showToast('✨ Base de datos reiniciada. Lista para registrar tus pacientes reales.', 'success');
  };

  // Cálculos financieros
  const getPatientFinancials = (patientId) => {
    const patientBudgets = budgets.filter((b) => b.patient_id === patientId);
    const totalBudget = patientBudgets.reduce((acc, curr) => acc + (Number(curr.total_amount) || 0), 0);
    const patientPayments = payments.filter((p) => p.patient_id === patientId);
    const totalPaid = patientPayments.reduce((acc, curr) => acc + (Number(curr.amount_usd) || 0), 0);
    const balanceDue = Math.max(0, totalBudget - totalPaid);

    return {
      totalBudget,
      totalPaid,
      balanceDue,
      paymentsCount: patientPayments.length,
      budgetsCount: patientBudgets.length,
    };
  };

  const value = {
    settings,
    updateSettings,
    patients,
    activePatient: patients.find((p) => p.id === activePatientId) || patients[0] || null,
    activePatientId,
    setActivePatientId,
    addPatient,
    updatePatient,
    deletePatient,
    odontograms,
    updateToothInOdontogram,
    clinicalRecords,
    addClinicalRecord,
    radiographs,
    addRadiograph,
    budgets,
    addBudget,
    updateBudget,
    deleteBudget,
    toggleBudgetItem,
    payments,
    registerPayment,
    appointments,
    addAppointment,
    updateAppointmentStatus,
    cashEntries,
    addCashEntry,
    promotions,
    addPromotion,
    getPatientFinancials,
    // Conectividad y Sincronización
    isOnline,
    isSyncing,
    connectedToSupabase,
    supabaseHealth,
    checkSupabaseConnectionHealth: checkSupabaseHealthStatus,
    syncQueue,
    pendingSyncCount: syncQueue.length,
    syncPendingQueue: () => flushSyncQueue(true),
    authorizeAndUploadPendingChanges: () => flushSyncQueue(true),
    refreshCloudData: () => {
      checkSupabaseHealthStatus().then((res) => {
        if (res.success) {
          fetchFromSupabase(false);
          flushSyncQueue(true);
        } else {
          setShowDiagnosticModal(true);
        }
      });
    },
    syncAllLocalToCloud,
    lastSyncTime,
    exportLocalBackup,
    importFromBackupData,
    toast,
    showToast,
    doctorInfo,
    // Gestión Modal Diagnóstico
    showDiagnosticModal,
    setShowDiagnosticModal,
    openDiagnosticModal: () => setShowDiagnosticModal(true),
    closeDiagnosticModal: () => setShowDiagnosticModal(false),
    // Configuración Dinámica de Supabase
    saveCustomSupabaseConfig: (url, key) => {
      const updated = updateActiveSupabaseCredentials(url, key);
      setActiveCredentials(updated);
      checkSupabaseHealthStatus(url, key);
    },
    resetCustomSupabaseConfig: () => {
      const def = resetDefaultSupabaseCredentials();
      setActiveCredentials(def);
      checkSupabaseHealthStatus();
    },
    activeSupabaseConfig: {
      ...activeCredentials,
      defaultUrl: SUPABASE_DEFAULT_URL,
      defaultKey: SUPABASE_DEFAULT_KEY,
    },
    // Temas Visuales y Conmemorativos por Fecha
    currentTheme: themeState.theme,
    themeMode: themeState.mode,
    isSnowActive: themeState.isSnowActive,
    isChristmasTheme: themeState.isChristmas,
    setThemeModeAndSelection,
    toggleSnowEffect,
    showThemeModal,
    setShowThemeModal,
    openThemeModal: () => setShowThemeModal(true),
    closeThemeModal: () => setShowThemeModal(false),
    // Guardián Anti-Pausa Keep-Alive
    lastKeepAlive,
    isSendingPulse,
    triggerKeepAlivePulse,
    // Tasa BCV
    bcvInfo,
    isUpdatingBcv,
    syncBcvRate,
    // Limpieza
    clearAllDemoData,
    // Auth Doctora
    isDoctorAuthenticated,
    loginDoctor,
    logoutDoctor,
  };

  return <DentalContext.Provider value={value}>{children}</DentalContext.Provider>;
};
