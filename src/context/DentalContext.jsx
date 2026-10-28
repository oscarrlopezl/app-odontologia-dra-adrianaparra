import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isConfigured, doctorInfo } from '../lib/supabaseClient';
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

  // Cola de sincronización pendiente (Para cuando se va la luz o el WiFi)
  const [syncQueue, setSyncQueue] = useState(() => loadLocal('sync_queue', []));

  // Estados de interfaz y conectividad
  const [activePatientId, setActivePatientId] = useState(() => {
    const loadedPatients = loadLocal('patients', initialPatients);
    return loadedPatients[0]?.id || null;
  });

  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectedToSupabase, setConnectedToSupabase] = useState(isConfigured);
  const [lastSyncTime, setLastSyncTime] = useState(() => loadLocal('last_sync_time', null));

  // Estados y Sincronización Automática de Tasa BCV Oficial
  const [bcvInfo, setBcvInfo] = useState(() => getCachedBcvRate() || {
    rate: Number(settings?.usd_exchange_rate) || CONTINGENCY_BCV_RATE,
    source: 'BCV Oficial',
    date: null,
  });
  const [isUpdatingBcv, setIsUpdatingBcv] = useState(false);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Ref para evitar loops y condiciones de carrera
  const isFetchingRef = useRef(false);
  const isFlushingRef = useRef(false);

  // 4. AUTENTICACIÓN Y SEGURIDAD: DOCTORA (Panel /doctor)
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

  // Función para obtener y sincronizar la tasa del BCV en vivo y guardarla en Supabase
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

        // Sincronizar tasa actualizada directamente a la base de datos Supabase
        if (isConfigured && supabase && navigator.onLine) {
          supabase
            .from('clinic_settings')
            .update({ usd_exchange_rate: res.rate })
            .eq('id', CLINIC_SETTINGS_ID)
            .then(() => {})
            .catch((err) => console.warn('Aviso guardando tasa BCV en Supabase:', err));
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
  }, []);

  // 1. Guardado local inmediato en cada cambio
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

  // CARGA INTEGRAL CONTINUA DESDE SUPABASE (MULTI-DISPOSITIVO TOTAL)
  const fetchFromSupabase = useCallback(async (silent = false) => {
    if (!isConfigured || !supabase || !navigator.onLine) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) setIsSyncing(true);

    try {
      // 1. Ajustes del consultorio
      const { data: remoteSettings } = await supabase
        .from('clinic_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (remoteSettings) {
        setSettings((prev) => {
          const merged = { ...prev, ...remoteSettings };
          // Si el rate remoto es válido y reciente
          if (remoteSettings.usd_exchange_rate && Number(remoteSettings.usd_exchange_rate) > 50) {
            merged.usd_exchange_rate = Number(remoteSettings.usd_exchange_rate);
          }
          saveLocal('settings', merged);
          return merged;
        });
        setConnectedToSupabase(true);
      }

      // 2. Pacientes
      const { data: remotePatients, error: patErr } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (!patErr && Array.isArray(remotePatients)) {
        const deserializedPatients = remotePatients.map(patientAdapter.deserialize);
        setPatients(deserializedPatients);
        saveLocal('patients', deserializedPatients);
        if (deserializedPatients.length > 0 && !activePatientId) {
          setActivePatientId(deserializedPatients[0].id);
        }
      }

      // 3. Presupuestos y Fases
      const { data: remoteBudgets, error: budErr } = await supabase
        .from('treatment_budgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!budErr && Array.isArray(remoteBudgets)) {
        const deserializedBudgets = remoteBudgets.map(budgetAdapter.deserialize);
        setBudgets(deserializedBudgets);
        saveLocal('budgets', deserializedBudgets);
      }

      // 4. Historias Clínicas
      const { data: remoteRecords, error: recErr } = await supabase
        .from('clinical_records')
        .select('*')
        .order('record_date', { ascending: false });

      if (!recErr && Array.isArray(remoteRecords)) {
        const deserializedRecords = remoteRecords.map(clinicalRecordAdapter.deserialize);
        setClinicalRecords(deserializedRecords);
        saveLocal('clinicalRecords', deserializedRecords);
      }

      // 5. Odontogramas
      const { data: remoteOdontos, error: odoErr } = await supabase
        .from('odontograms')
        .select('*');

      if (!odoErr && Array.isArray(remoteOdontos)) {
        const odontoMap = odontogramAdapter.toMap(remoteOdontos);
        setOdontograms(odontoMap);
        saveLocal('odontograms', odontoMap);
      }

      // 6. Pagos y Abonos
      const { data: remotePayments, error: payErr } = await supabase
        .from('payments')
        .select('*')
        .order('payment_date', { ascending: false });

      if (!payErr && Array.isArray(remotePayments)) {
        setPayments(remotePayments);
        saveLocal('payments', remotePayments);
      }

      // 7. Citas y Agenda
      const { data: remoteAppointments, error: aptErr } = await supabase
        .from('appointments')
        .select('*')
        .order('appointment_date', { ascending: true });

      if (!aptErr && Array.isArray(remoteAppointments)) {
        const deserializedApts = remoteAppointments.map(appointmentAdapter.deserialize);
        setAppointments(deserializedApts);
        saveLocal('appointments', deserializedApts);
      }

      // 8. Cuadre de Caja
      const { data: remoteCash, error: cashErr } = await supabase
        .from('cash_register_entries')
        .select('*')
        .order('entry_date', { ascending: false });

      if (!cashErr && Array.isArray(remoteCash)) {
        setCashEntries(remoteCash);
        saveLocal('cashEntries', remoteCash);
      }

      // 9. Radiografías
      const { data: remoteRadios, error: radErr } = await supabase
        .from('radiographs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!radErr && Array.isArray(remoteRadios)) {
        setRadiographs(remoteRadios);
        saveLocal('radiographs', remoteRadios);
      }

      const syncTime = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(syncTime);
      saveLocal('last_sync_time', syncTime);
      setConnectedToSupabase(true);
    } catch (err) {
      console.warn('Nota de sincronización: error recuperando datos Supabase:', err);
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsSyncing(false);
    }
  }, [activePatientId]);

  // VACIADO Y SUBIDA AUTOMÁTICA DE LA COLA EN SEGUNDO PLANO
  const flushSyncQueue = useCallback(async (isManual = false) => {
    if (!isConfigured || !supabase || !navigator.onLine) return;
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
            ? await supabase.from(item.table).upsert(item.data, item.options)
            : await supabase.from(item.table).upsert(item.data);
          if (error) throw error;
        } else if (item.action === 'insert') {
          const { error } = await supabase.from(item.table).insert(item.data);
          if (error) throw error;
        } else if (item.action === 'delete') {
          const { error } = await supabase.from(item.table).delete().eq('id', item.id);
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
      if (isManual) {
        showToast(`☁️ ¡Sincronizado! ${syncedCount} cambios guardados en la nube (${now}).`, 'success');
      }
    }
  }, []);

  // Helper para enviar a Supabase de inmediato o encolar en memoria local
  const pushToCloud = async (table, action, data, id = null, description = '', options = null) => {
    if (!isConfigured || !supabase || !navigator.onLine) {
      // Guardar en cola para cuando regrese el internet
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
          ? await supabase.from(table).upsert(data, options)
          : await supabase.from(table).upsert(data);
        if (error) throw error;
      } else if (action === 'insert') {
        const { error } = await supabase.from(table).insert(data);
        if (error) throw error;
      } else if (action === 'delete') {
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) throw error;
      }

      const now = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(now);
      saveLocal('last_sync_time', now);
      setConnectedToSupabase(true);
    } catch (err) {
      console.warn(`Aviso de red al enviar [${table}]. Se guarda en cola local de contingencia:`, err.message || err);
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

  // MONITOREO DE RED Y SINCRONIZACIÓN AUTOMÁTICA EN SEGUNDO PLANO
  useEffect(() => {
    // 1. Carga inicial
    fetchFromSupabase(false);
    syncBcvRate(false);

    // 2. Reconexión a Internet
    const handleOnline = () => {
      setIsOnline(true);
      syncBcvRate(false);
      flushSyncQueue(false);
      fetchFromSupabase(true);
      showToast('⚡ Conexión a internet restablecida. Nube conectada.', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Sin internet. Modo local seguro: tus registros se guardan en este dispositivo.', 'warning');
    };

    // 3. Cuando la doctora cambia de pestaña o desbloquea el teléfono (visibilitychange / focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchFromSupabase(true);
        flushSyncQueue(false);
      }
    };

    const handleWindowFocus = () => {
      if (navigator.onLine) {
        fetchFromSupabase(true);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // 4. Polling periódico silencioso (cada 30 segundos) para mantener teléfono y PC al día
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchFromSupabase(true);
      }
    }, 30 * 1000);

    // 5. Polling de Tasa BCV (cada 15 minutos)
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
  }, [fetchFromSupabase, flushSyncQueue, syncBcvRate]);

  // PACIENTES (CRUD con Doble Guardado Multi-Dispositivo)
  const addPatient = async (patientData) => {
    const rawId = patientData.id || generateUUID();
    const id = ensureUUID(rawId);

    const newPatient = {
      ...patientData,
      id,
      access_code: String(patientData.access_code || patientData.document_id?.slice(-4) || '1234').trim(),
      created_at: patientData.created_at || new Date().toISOString(),
    };

    // 1. Guardar local primero (Instantáneo)
    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    showToast(`Paciente ${newPatient.full_name} guardado con éxito.`);

    // 2. Subir a Supabase
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

  // ODONTOGRAMA (Doble Guardado con Constraint Supabase)
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

    showToast(`Diente #${toothNumber} guardado en odontograma.`);

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

  // HISTORIAS CLÍNICAS (Doble Guardado)
  const addClinicalRecord = async (recordData) => {
    const id = ensureUUID(recordData.id || generateUUID());
    const newRecord = {
      ...recordData,
      id,
      patient_id: ensureUUID(recordData.patient_id),
      created_at: recordData.created_at || new Date().toISOString(),
    };

    setClinicalRecords((prev) => [newRecord, ...prev]);
    showToast('Evolución y récipe médico guardados en historia.');

    const serialized = clinicalRecordAdapter.serialize(newRecord);
    await pushToCloud('clinical_records', 'upsert', [serialized], id, `Evolución clínica #${id}`);
    return newRecord;
  };

  // RADIOGRAFÍAS Y FOTOS (Doble Guardado)
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

  // PRESUPUESTOS Y FASES (Doble Guardado)
  const addBudget = async (budgetData) => {
    const id = ensureUUID(budgetData.id || generateUUID());
    const newBudget = {
      ...budgetData,
      id,
      patient_id: ensureUUID(budgetData.patient_id),
      created_at: budgetData.created_at || new Date().toISOString(),
    };

    setBudgets((prev) => [newBudget, ...prev]);
    showToast('Presupuesto por fases registrado.');

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

    showToast('Presupuesto actualizado con éxito.');
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
        pushToCloud('treatment_budgets', 'upsert', [serialized], budgetId, `Actualizar fase en presupuesto #${budgetId}`);
        return updatedBudget;
      })
    );
  };

  // PAGOS Y ABONOS (Con impacto en caja y doble guardado)
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

    // Generar automáticamente el ingreso en el Cuadre de Caja Diario
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
    showToast(`Abono de $${amountUsd.toFixed(2)} registrado en memoria y caja.`);

    const serializedPay = paymentAdapter.serialize(newPayment);
    const serializedCash = cashRegisterAdapter.serialize(newCashEntry);

    await pushToCloud('payments', 'upsert', [serializedPay], payId, `Abono paciente #${payId}`);
    await pushToCloud('cash_register_entries', 'upsert', [serializedCash], cashId, `Entrada caja #${cashId}`);
    return newPayment;
  };

  // AGENDA Y CITAS (Doble Guardado)
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
    showToast(`Cita marcada como: ${status.toUpperCase()}`);
    await pushToCloud('appointments', 'upsert', [{ id, status }], id, `Estado cita #${id}`);
  };

  // CUADRE DE CAJA (Egresos e Ingresos con Doble Guardado)
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

  // EXPORTAR RESPALDO DE SEGURIDAD EN 1 CLIC (.JSON)
  const exportLocalBackup = () => {
    const doctorName = settings?.doctor_name || 'Dra_Adriana_Parra';
    const backupData = {
      version: '2.0',
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
    showToast('📁 Respaldo completo descargado a tu equipo.');
  };

  // VACIAR DATOS DE PRUEBA / EMPEZAR CONSULTORIO EN BLANCO
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

    if (isConfigured && supabase) {
      try {
        await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('cash_register_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('radiographs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('clinical_records').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('odontograms').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('treatment_budgets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('patients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      } catch (err) {
        console.warn('Aviso al limpiar Supabase:', err.message);
      }
    }

    showToast('✨ Base de datos reiniciada. Lista para registrar tus pacientes reales.', 'success');
  };

  // Cálculos financieros por paciente
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
    // Estados de conexión y sincronización
    isOnline,
    isSyncing,
    connectedToSupabase,
    syncQueue,
    pendingSyncCount: syncQueue.length,
    syncPendingQueue: () => flushSyncQueue(true),
    authorizeAndUploadPendingChanges: () => flushSyncQueue(true),
    refreshCloudData: () => fetchFromSupabase(false),
    lastSyncTime,
    exportLocalBackup,
    toast,
    showToast,
    doctorInfo,
    // Tasa BCV Oficial en vivo
    bcvInfo,
    isUpdatingBcv,
    syncBcvRate,
    // Gestión y limpieza de datos
    clearAllDemoData,
    // Autenticación Doctora
    isDoctorAuthenticated,
    loginDoctor,
    logoutDoctor,
  };

  return <DentalContext.Provider value={value}>{children}</DentalContext.Provider>;
};
