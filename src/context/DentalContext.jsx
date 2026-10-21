import React, { createContext, useContext, useState, useEffect } from 'react';
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

const DentalContext = createContext();

export const useDental = () => {
  const context = useContext(DentalContext);
  if (!context) {
    throw new Error('useDental debe ser utilizado dentro de un DentalProvider');
  }
  return context;
};

export const DentalProvider = ({ children }) => {
  // Helper para persistencia local de respaldo
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
      console.warn(`Error guardando en localStorage [${key}]:`, err);
    }
  };

  // Estados
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

  // Estados de interfaz
  const [activePatientId, setActivePatientId] = useState(patients[0]?.id || null);
  const [toast, setToast] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connectedToSupabase, setConnectedToSupabase] = useState(isConfigured);

  const showToast = (message, type = 'success') => {
    setToast({ id: Date.now(), message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Sincronizar en localStorage
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

  // Carga inicial desde Supabase si está disponible
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
      } catch (err) {
        console.warn('Nota: Trabajando en modo local sincronizado. Supabase no respondió:', err);
      } finally {
        setIsSyncing(false);
      }
    };

    fetchFromSupabase();
  }, []);

  // PACIENTES (CRUD)
  const addPatient = async (patientData) => {
    const newPatient = {
      id: `pat-${Date.now()}`,
      ...patientData,
      access_code: patientData.access_code || patientData.document_id.slice(-4),
      created_at: new Date().toISOString(),
    };

    setPatients((prev) => [newPatient, ...prev]);
    setActivePatientId(newPatient.id);
    showToast(`Paciente ${newPatient.full_name} registrado con éxito.`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('patients').insert([newPatient]);
      } catch (err) {
        console.warn('Error sincronizando paciente en Supabase:', err);
      }
    }
    return newPatient;
  };

  const updatePatient = async (id, updatedFields) => {
    setPatients((prev) =>
      prev.map((pat) => (pat.id === id ? { ...pat, ...updatedFields } : pat))
    );
    showToast('Ficha de paciente actualizada.');

    if (isConfigured && supabase) {
      try {
        await supabase.from('patients').update(updatedFields).eq('id', id);
      } catch (err) {
        console.warn('Error actualizando paciente en Supabase:', err);
      }
    }
  };

  const deletePatient = async (id) => {
    setPatients((prev) => prev.filter((pat) => pat.id !== id));
    if (activePatientId === id) {
      const remaining = patients.filter((pat) => pat.id !== id);
      setActivePatientId(remaining[0]?.id || null);
    }
    showToast('Paciente eliminado del sistema.', 'warning');

    if (isConfigured && supabase) {
      try {
        await supabase.from('patients').delete().eq('id', id);
      } catch (err) {
        console.warn('Error eliminando paciente en Supabase:', err);
      }
    }
  };

  // ODONTOGRAMA
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

    showToast(`Diente ${toothNumber} actualizado en odontograma.`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('odontograms').upsert({
          patient_id: patientId,
          tooth_number: Number(toothNumber),
          faces,
          overall_status,
          notes,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'patient_id, tooth_number' });
      } catch (err) {
        console.warn('Error guardando diente en Supabase:', err);
      }
    }
  };

  // HISTORIAS CLÍNICAS (EVOLUCIÓN)
  const addClinicalRecord = async (recordData) => {
    const newRecord = {
      id: `rec-${Date.now()}`,
      ...recordData,
      created_at: new Date().toISOString(),
    };

    setClinicalRecords((prev) => [newRecord, ...prev]);
    showToast('Evolución clínica guardada en la historia.');

    if (isConfigured && supabase) {
      try {
        await supabase.from('clinical_records').insert([newRecord]);
      } catch (err) {
        console.warn('Error guardando evolución en Supabase:', err);
      }
    }
    return newRecord;
  };

  // RADIOGRAFÍAS Y FOTOS
  const addRadiograph = async (radioData) => {
    const newRadio = {
      id: `rad-${Date.now()}`,
      ...radioData,
      created_at: new Date().toISOString(),
    };

    setRadiographs((prev) => [newRadio, ...prev]);
    showToast('Imagen radiográfica añadida al expediente.');

    if (isConfigured && supabase) {
      try {
        await supabase.from('radiographs').insert([newRadio]);
      } catch (err) {
        console.warn('Error guardando radiografía en Supabase:', err);
      }
    }
    return newRadio;
  };

  // PRESUPUESTOS Y FASES
  const addBudget = async (budgetData) => {
    const newBudget = {
      id: `bud-${Date.now()}`,
      ...budgetData,
      created_at: new Date().toISOString(),
    };

    setBudgets((prev) => [newBudget, ...prev]);
    showToast('Presupuesto por fases creado con éxito.');

    if (isConfigured && supabase) {
      try {
        await supabase.from('treatment_budgets').insert([newBudget]);
      } catch (err) {
        console.warn('Error guardando presupuesto en Supabase:', err);
      }
    }
    return newBudget;
  };

  const updateBudget = async (budgetId, updatedFields) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === budgetId ? { ...b, ...updatedFields } : b))
    );
    showToast('Presupuesto actualizado.');
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
        return { ...b, phases: updatedPhases };
      })
    );
  };

  // PAGOS Y ABONOS (Con impacto automático en cuadre de caja)
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

    // Añadir al registro de pagos
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
    showToast(`Abono de $${amountUsd.toFixed(2)} registrado e ingresado a caja.`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('payments').insert([newPayment]);
        await supabase.from('cash_register_entries').insert([newCashEntry]);
      } catch (err) {
        console.warn('Error registrando pago en Supabase:', err);
      }
    }

    return newPayment;
  };

  // AGENDA Y CITAS
  const addAppointment = async (aptData) => {
    const newApt = {
      id: `apt-${Date.now()}`,
      ...aptData,
      created_at: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    showToast(`Cita agendada para ${newApt.patient_name}.`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('appointments').insert([newApt]);
      } catch (err) {
        console.warn('Error guardando cita en Supabase:', err);
      }
    }
    return newApt;
  };

  const updateAppointmentStatus = async (id, status) => {
    setAppointments((prev) =>
      prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
    );
    showToast(`Estado de cita actualizado a: ${status.toUpperCase()}`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('appointments').update({ status }).eq('id', id);
      } catch (err) {
        console.warn('Error actualizando cita en Supabase:', err);
      }
    }
  };

  // CUADRE DE CAJA (Egresos y otros ingresos)
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
    showToast(`${newEntry.type === 'ingreso' ? 'Ingreso' : 'Egreso'} anotado en el cuadre de caja.`);

    if (isConfigured && supabase) {
      try {
        await supabase.from('cash_register_entries').insert([newEntry]);
      } catch (err) {
        console.warn('Error guardando movimiento de caja en Supabase:', err);
      }
    }
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
    showToast('Nueva promoción publicada para los pacientes.');
  };

  // AJUSTES
  const updateSettings = async (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
    showToast('Configuración del consultorio actualizada.');

    if (isConfigured && supabase) {
      try {
        await supabase.from('clinic_settings').upsert({
          id: settings.id || undefined,
          ...newSettings,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Error guardando ajustes en Supabase:', err);
      }
    }
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

  // Valor exportado del contexto
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
    toast,
    showToast,
    isSyncing,
    connectedToSupabase,
    doctorInfo,
  };

  return <DentalContext.Provider value={value}>{children}</DentalContext.Provider>;
};
