import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import { fetchOfficialBcvRate, getCachedBcvRate } from '../lib/bcvRateService';

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
  const [settings, setSettings] = useState(() => loadLocal('settings', initialClinicSettings));
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
  const [activePatientId, setActivePatientId] = useState(patients[0]?.id || null);
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [connectedToSupabase, setConnectedToSupabase] = useState(isConfigured);
  const [lastSyncTime, setLastSyncTime] = useState(() => loadLocal('last_sync_time', null));

  // Estados y Sincronización Automática de Tasa BCV Oficial
  const [bcvInfo, setBcvInfo] = useState(() => getCachedBcvRate() || {
    rate: Number(settings?.usd_exchange_rate) || 883.40,
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

  // Función para obtener y sincronizar la tasa del BCV en vivo
  const syncBcvRate = useCallback(async (showNotification = false) => {
    setIsUpdatingBcv(true);
    try {
      const res = await fetchOfficialBcvRate();
      if (res && res.rate) {
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

  // Auto-actualizar tasa BCV al iniciar la app y cada 30 minutos
  useEffect(() => {
    syncBcvRate(false);

    const bcvInterval = setInterval(() => {
      if (navigator.onLine) {
        syncBcvRate(false);
      }
    }, 30 * 60 * 1000);

    return () => clearInterval(bcvInterval);
  }, [syncBcvRate]);

  // 1. Guardado local inmediato e hiper-seguro en cada cambio
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

  // 2. Monitor de Conexión en Tiempo Real (Detector de Apagones / Pérdida de WiFi)
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showToast('⚡ ¡Conexión restaurada! Sincronizando con la nube y tasa BCV...', 'info');
      syncPendingQueue();
      syncBcvRate(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      showToast('⚠️ Sin señal de internet. Modo Offline Seguro: todo se sigue guardando en la memoria de este equipo.', 'warning');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncQueue]);

  // 3. Procesador de Cola de Sincronización hacia Supabase
  const syncPendingQueue = useCallback(async () => {
    if (!isConfigured || !supabase || syncQueue.length === 0) return;

    setIsSyncing(true);
    const queueCopy = [...syncQueue];
    const failedItems = [];

    for (const item of queueCopy) {
      try {
        if (item.action === 'upsert') {
          await supabase.from(item.table).upsert(item.data);
        } else if (item.action === 'insert') {
          await supabase.from(item.table).insert(item.data);
        } else if (item.action === 'delete') {
          await supabase.from(item.table).delete().eq('id', item.id);
        }
      } catch (err) {
        console.warn(`Error al sincronizar item [${item.table}]:`, err);
        failedItems.push(item);
      }
    }

    setSyncQueue(failedItems);
    setIsSyncing(false);
    const syncedCount = queueCopy.length - failedItems.length;

    if (syncedCount > 0) {
      const now = new Date().toLocaleTimeString('es-VE');
      setLastSyncTime(now);
      showToast(`☁️ ${syncedCount} cambios pendientes fueron subidos con éxito a la nube (${now}).`);
    }
  }, [syncQueue]);

  // Helper para encolar o enviar directamente a Supabase
  const pushToCloud = async (table, action, data, id = null) => {
    // Si no hay Supabase o estamos offline, encolar de inmediato
    if (!isConfigured || !supabase || !navigator.onLine) {
      setSyncQueue((prev) => [...prev, { table, action, data, id, timestamp: Date.now() }]);
      return;
    }

    try {
      if (action === 'upsert') {
        await supabase.from(table).upsert(data);
      } else if (action === 'insert') {
        await supabase.from(table).insert(data);
      } else if (action === 'delete') {
        await supabase.from(table).delete().eq('id', id);
      }
      setLastSyncTime(new Date().toLocaleTimeString('es-VE'));
    } catch (err) {
      console.warn(`Fallo conexión temporal con Supabase. Guardado en cola para reintento:`, err);
      setSyncQueue((prev) => [...prev, { table, action, data, id, timestamp: Date.now() }]);
    }
  };

  // Carga inicial y reconciliación desde Supabase si hay señal
  useEffect(() => {
    if (!isConfigured || !supabase) return;

    const fetchFromSupabase = async () => {
      setIsSyncing(true);
      try {
        const { data: remotePatients, error: patErr } = await supabase.from('patients').select('*');
        if (!patErr && remotePatients && remotePatients.length > 0) {
          setPatients(remotePatients);
          setConnectedToSupabase(true);
        }

        const { data: remoteAppointments } = await supabase.from('appointments').select('*');
        if (remoteAppointments && remoteAppointments.length > 0) {
          setAppointments(remoteAppointments);
        }

        const { data: remoteSettings } = await supabase.from('clinic_settings').select('*').limit(1).maybeSingle();
        if (remoteSettings) {
          setSettings(remoteSettings);
        }

        setLastSyncTime(new Date().toLocaleTimeString('es-VE'));
      } catch (err) {
        console.warn('Nota: Trabajando en modo local sincronizado. Supabase no respondió:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    if (navigator.onLine) {
      fetchFromSupabase();
    }
  }, []);

  // PACIENTES (CRUD con Doble Guardado)
  const addPatient = async (patientData) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      ...patientData,
      access_code: patientData.access_code || patientData.document_id.slice(-4),
      created_at: new Date().toISOString(),
    };

    // 1. Guardar local primero (¡Instantáneo!)
    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    showToast(`Paciente ${newPatient.full_name} guardado en memoria local.`);

    // 2. Subir a la nube / Encolar si no hay luz o internet
    await pushToCloud('patients', 'insert', [newPatient], newPatient.id);
    return newPatient;
  };

  const updatePatient = async (id, updatedFields) => {
    setPatients((prev) =>
      prev.map((pat) => (pat.id === id ? { ...pat, ...updatedFields } : pat))
    );
    showToast('Ficha de paciente actualizada en memoria.');

    const patientObj = patients.find((p) => p.id === id);
    await pushToCloud('patients', 'upsert', [{ ...patientObj, ...updatedFields }], id);
  };

  const deletePatient = async (id) => {
    setPatients((prev) => prev.filter((pat) => pat.id !== id));
    if (activePatientId === id) {
      const remaining = patients.filter((pat) => pat.id !== id);
      setActivePatientId(remaining[0]?.id || null);
    }
    showToast('Paciente eliminado del sistema.', 'warning');
    await pushToCloud('patients', 'delete', null, id);
  };

  // ODONTOGRAMA (Doble Guardado)
  const updateToothInOdontogram = async (patientId, toothNumber, { faces, overall_status, notes }) => {
    setOdontograms((prev) => {
      const patientOdonto = prev[patientId] || {};
      const currentTooth = patientOdonto[toothNumber] || { faces: {}, overall_status: 'sano', notes: '' };

      const updatedTooth = {
        faces: faces !== undefined ? faces : currentTooth.faces,
        overall_status: overall_status !== undefined ? overall_status : currentTooth.overall_status,
        notes: notes !== undefined ? notes : currentTooth.notes,
        updated_at: new Date().toISOString(),
      };

      return {
        ...prev,
        [patientId]: {
          ...patientOdonto,
          [toothNumber]: updatedTooth,
        },
      };
    });

    showToast(`Diente #${toothNumber} guardado en odontograma.`);

    await pushToCloud('odontograms', 'upsert', {
      patient_id: patientId,
      tooth_number: Number(toothNumber),
      faces,
      overall_status,
      notes,
      updated_at: new Date().toISOString(),
    });
  };

  // HISTORIAS CLÍNICAS (Doble Guardado)
  const addClinicalRecord = async (recordData) => {
    const newRecord = {
      id: `rec-${Date.now()}`,
      ...recordData,
      created_at: new Date().toISOString(),
    };

    setClinicalRecords((prev) => [newRecord, ...prev]);
    showToast('Evolución y récipe médico guardados en historia.');
    await pushToCloud('clinical_records', 'insert', [newRecord], newRecord.id);
    return newRecord;
  };

  // RADIOGRAFÍAS Y FOTOS (Doble Guardado)
  const addRadiograph = async (radioData) => {
    const newRadio = {
      id: `rad-${Date.now()}`,
      ...radioData,
      created_at: new Date().toISOString(),
    };

    setRadiographs((prev) => [newRadio, ...prev]);
    showToast('Radiografía guardada en el expediente.');
    await pushToCloud('radiographs', 'insert', [newRadio], newRadio.id);
    return newRadio;
  };

  // PRESUPUESTOS Y FASES (Doble Guardado)
  const addBudget = async (budgetData) => {
    const newBudget = {
      id: `bud-${Date.now()}`,
      ...budgetData,
      created_at: new Date().toISOString(),
    };

    setBudgets((prev) => [newBudget, ...prev]);
    showToast('Presupuesto por fases registrado.');
    await pushToCloud('treatment_budgets', 'insert', [newBudget], newBudget.id);
    return newBudget;
  };

  const updateBudget = async (budgetId, updatedFields) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, ...updatedFields } : b))
    );
    showToast('Presupuesto actualizado.');
    await pushToCloud('treatment_budgets', 'upsert', [{ id: budgetId, ...updatedFields }], budgetId);
  };

  const toggleBudgetItem = (budgetId, phaseId, itemIndex) => {
    setBudgets((prev) =>
      prev.map((b) => {
        if (b.id !== budgetId) return b;
        const updatedPhases = b.phases.map((ph) => {
          if (ph.id !== phaseId) return ph;
          const updatedItems = ph.items.map((it, idx) =>
            idx === itemIndex ? { ...it, completed: !it.completed } : it
          );
          const allCompleted = updatedItems.every((it) => it.completed);
          const anyCompleted = updatedItems.some((it) => it.completed);
          const newStatus = allCompleted ? 'completada' : anyCompleted ? 'en_progreso' : 'pendiente';

          return { ...ph, items: updatedItems, status: newStatus };
        });
        const updatedBudget = { ...b, phases: updatedPhases };
        pushToCloud('treatment_budgets', 'upsert', [updatedBudget], budgetId);
        return updatedBudget;
      })
    );
  };

  // PAGOS Y ABONOS (Con impacto en caja y doble guardado)
  const registerPayment = async (paymentData) => {
    const rate = Number(settings.usd_exchange_rate) || 40.0;
    const amountUsd = Number(paymentData.amount_usd) || 0;
    const amountBs = paymentData.amount_bs ? Number(paymentData.amount_bs) : amountUsd * rate;

    const newPayment = {
      id: `pay-${Date.now()}`,
      ...paymentData,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      exchange_rate: rate,
      payment_date: paymentData.payment_date || new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    setPayments((prev) => [newPayment, ...prev]);

    // Generar automáticamente el ingreso en el Cuadre de Caja Diario
    const patientObj = patients.find((p) => p.id === paymentData.patient_id);
    const newCashEntry = {
      id: `cash-${Date.now()}`,
      entry_date: new Date().toISOString().split('T')[0],
      type: 'ingreso',
      category: 'pago_paciente',
      description: `Abono tratamiento: ${patientObj?.full_name || 'Paciente'} (${paymentData.concept || 'Pago'})`,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      payment_method: paymentData.payment_method,
      reference: paymentData.reference || 'N/A',
      related_payment_id: newPayment.id,
    };

    setCashEntries((prev) => [newCashEntry, ...prev]);
    showToast(`Abono de $${amountUsd.toFixed(2)} registrado en memoria y caja.`);

    await pushToCloud('payments', 'insert', [newPayment], newPayment.id);
    await pushToCloud('cash_register_entries', 'insert', [newCashEntry], newCashEntry.id);
    return newPayment;
  };

  // AGENDA Y CITAS (Doble Guardado)
  const addAppointment = async (aptData) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      ...aptData,
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    showToast(`Cita agendada para ${newApt.patient_name}.`);
    await pushToCloud('appointments', 'insert', [newApt], newApt.id);
    return newApt;
  };

  const updateAppointmentStatus = async (id, status) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
    showToast(`Cita marcada como: ${status.toUpperCase()}`);
    await pushToCloud('appointments', 'upsert', [{ id, status }], id);
  };

  // CUADRE DE CAJA (Egresos e Ingresos con Doble Guardado)
  const addCashEntry = async (entryData) => {
    const rate = Number(settings.usd_exchange_rate) || 40.0;
    const amountUsd = Number(entryData.amount_usd) || 0;
    const amountBs = entryData.amount_bs ? Number(entryData.amount_bs) : amountUsd * rate;

    const newEntry = {
      id: `cash-${Date.now()}`,
      ...entryData,
      amount_usd: amountUsd,
      amount_bs: amountBs,
      entry_date: entryData.entry_date || new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };

    setCashEntries((prev) => [newEntry, ...prev]);
    showToast(`${newEntry.type === 'ingreso' ? 'Ingreso' : 'Egreso'} anotado en caja.`);
    await pushToCloud('cash_register_entries', 'insert', [newEntry], newEntry.id);
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
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Ajustes guardados.');
    await pushToCloud('clinic_settings', 'upsert', [{ id: settings.id || undefined, ...newSettings }]);
  };

  // EXPORTAR RESPALDO DE SEGURIDAD EN 1 CLIC (.JSON)
  // Permite a la doctora guardar una copia en su pendrive o disco duro
  const exportLocalBackup = () => {
    const backupData = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      doctor: settings.doctor_name,
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
    a.download = `RESPALDO_ODONTOLOGIA_${settings.doctor_name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('📁 Respaldo completo descargado a tu computador.');
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
    syncPendingQueue,
    lastSyncTime,
    exportLocalBackup,
    toast,
    showToast,
    doctorInfo,
    // Tasa BCV Oficial en vivo
    bcvInfo,
    isUpdatingBcv,
    syncBcvRate,
  };

  return <DentalContext.Provider value={value}>{children}</DentalContext.Provider>;
};
