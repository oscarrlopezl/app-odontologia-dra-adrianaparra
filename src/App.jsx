import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DentalProvider, useDental } from './context/DentalContext';
import DoctorSidebar from './components/doctor/DoctorSidebar';
import PatientsPage from './pages/doctor/PatientsPage';
import AppointmentsPage from './pages/doctor/AppointmentsPage';
import BudgetsAndPaymentsPage from './pages/doctor/BudgetsAndPaymentsPage';
import CashRegisterPage from './pages/doctor/CashRegisterPage';
import ClinicSettingsPage from './pages/doctor/ClinicSettingsPage';
import DoctorLoginScreen from './components/doctor/DoctorLoginScreen';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';

function ToastContainer() {
  const { toast } = useDental();
  if (!toast) return null;

  const bgStyles = {
    success: 'bg-emerald-600 text-white shadow-emerald-500/20',
    warning: 'bg-amber-600 text-white shadow-amber-500/20',
    error: 'bg-rose-600 text-white shadow-rose-500/20',
    info: 'bg-teal-600 text-white shadow-teal-500/20',
  };

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 shrink-0" />,
    error: <AlertTriangle className="w-4 h-4 shrink-0" />,
    info: <Info className="w-4 h-4 shrink-0" />,
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div
        className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-xs font-bold ${
          bgStyles[toast.type] || bgStyles.success
        }`}
      >
        {icons[toast.type] || icons.success}
        <span>{toast.message}</span>
      </div>
    </div>
  );
}

// Layout para el entorno de escritorio de la Doctora (Protegido por Clave)
function DoctorLayout({ children }) {
  const { isDoctorAuthenticated } = useDental();

  if (!isDoctorAuthenticated) {
    return <DoctorLoginScreen />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <DoctorSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DentalProvider>
      <Router>
        <div className="min-h-screen text-slate-800 antialiased selection:bg-teal-500 selection:text-white">
          <Routes>
            {/* Rutas del Dashboard de la Doctora */}
            <Route
              path="/doctor"
              element={
                <DoctorLayout>
                  <PatientsPage />
                </DoctorLayout>
              }
            />
            <Route
              path="/doctor/citas"
              element={
                <DoctorLayout>
                  <AppointmentsPage />
                </DoctorLayout>
              }
            />
            <Route
              path="/doctor/presupuestos"
              element={
                <DoctorLayout>
                  <BudgetsAndPaymentsPage />
                </DoctorLayout>
              }
            />
            <Route
              path="/doctor/caja"
              element={
                <DoctorLayout>
                  <CashRegisterPage />
                </DoctorLayout>
              }
            />
            <Route
              path="/doctor/ajustes"
              element={
                <DoctorLayout>
                  <ClinicSettingsPage />
                </DoctorLayout>
              }
            />

            {/* Redirección directa al Panel de la Doctora (App Exclusiva para la Doctora) */}
            <Route path="/portal" element={<Navigate to="/doctor" replace />} />
            <Route path="/" element={<Navigate to="/doctor" replace />} />
            <Route path="*" element={<Navigate to="/doctor" replace />} />
          </Routes>

          {/* Aviso e Instalación de PWA en Celular / PC */}
          <PwaInstallPrompt />

          {/* Notificaciones globales */}
          <ToastContainer />
        </div>
      </Router>
    </DentalProvider>
  );
}
