import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { DentalProvider, useDental } from './context/DentalContext';
import DoctorSidebar from './components/doctor/DoctorSidebar';
import MobileBottomNav from './components/doctor/MobileBottomNav';
import OfflineSyncAuthorizationBanner from './components/common/OfflineSyncAuthorizationBanner';
import WhatsAppModal from './components/doctor/WhatsAppModal';
import PatientsPage from './pages/doctor/PatientsPage';
import AppointmentsPage from './pages/doctor/AppointmentsPage';
import BudgetsAndPaymentsPage from './pages/doctor/BudgetsAndPaymentsPage';
import CashRegisterPage from './pages/doctor/CashRegisterPage';
import ClinicSettingsPage from './pages/doctor/ClinicSettingsPage';
import DoctorLoginScreen from './components/doctor/DoctorLoginScreen';
import PwaInstallPrompt from './components/common/PwaInstallPrompt';
import { CheckCircle2, AlertTriangle, Info, Menu, Lock } from 'lucide-react';

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

// Layout para el entorno de la Doctora (Totalmente adaptable a Teléfono y PC)
function DoctorLayout({ children }) {
  const {
    isDoctorAuthenticated,
    settings,
    logoutDoctor,
    patients,
    activePatient,
  } = useDental();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showQuickMobileWhatsApp, setShowQuickMobileWhatsApp] = useState(false);

  if (!isDoctorAuthenticated) {
    return <DoctorLoginScreen />;
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* 1. Barra Superior Móvil (Solo en teléfonos / pantallas pequeñas) */}
      <header className="md:hidden sticky top-0 z-40 bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1 text-slate-300 hover:text-white rounded-xl bg-slate-800/80 active:scale-95 transition"
            title="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-white p-0.5 flex items-center justify-center shrink-0">
              <img
                src={settings?.logo_url || '/logo-dra-adrianaparra.png'}
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="leading-tight min-w-0">
              <h2 className="font-extrabold text-xs text-white truncate">
                {settings?.doctor_name || 'Dra. Adriana Parra'}
              </h2>
              <p className="text-[10px] text-teal-400 font-semibold truncate">
                Odontología Especializada
              </p>
            </div>
          </div>
        </div>

        {/* Indicadores en Barra Móvil: Tasa BCV y Bloqueo */}
        <div className="flex items-center gap-1.5">
          <div className="bg-teal-950/80 border border-teal-500/40 text-teal-300 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1">
            <span>🇻🇪</span>
            <span>Bs.{Number(settings?.usd_exchange_rate || 883.4).toFixed(1)}</span>
          </div>

          <button
            type="button"
            onClick={logoutDoctor}
            className="p-1.5 text-rose-300 hover:text-white rounded-lg bg-rose-950/50 border border-rose-800/50 transition"
            title="Bloquear panel"
          >
            <Lock className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* 2. Menú Lateral (Escritorio fijo + Drawer móvil deslizable) */}
      <DoctorSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 3. Área de Contenido Principal con Banner de Sincronización y Padding para barra móvil */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Banner de Modo Sin Señal / Autorización de Subida a la Nube */}
        <OfflineSyncAuthorizationBanner />

        {children}
      </div>

      {/* 4. Barra de Navegación Inferior para Teléfonos Móviles */}
      <MobileBottomNav
        onOpenWhatsApp={() => setShowQuickMobileWhatsApp(true)}
      />

      {/* Modal de WhatsApp Rápido en Móvil */}
      {showQuickMobileWhatsApp && (activePatient || patients?.[0]) && (
        <WhatsAppModal
          isOpen={showQuickMobileWhatsApp}
          onClose={() => setShowQuickMobileWhatsApp(false)}
          patient={activePatient || patients?.[0]}
          initialTab="cita"
        />
      )}
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
