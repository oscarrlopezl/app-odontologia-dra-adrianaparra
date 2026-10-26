import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDental } from '../../context/DentalContext';
import WhatsAppModal from './WhatsAppModal';
import {
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  Settings,
  Activity,
  HeartPulse,
  Lock,
  MessageSquare,
  X,
  Database,
  Wifi,
  WifiOff
} from 'lucide-react';

export default function DoctorSidebar({ isOpen = false, onClose = () => {} }) {
  const { settings, connectedToSupabase, logoutDoctor, patients, activePatient, isOnline, pendingSyncCount } = useDental();
  const [showGlobalWhatsappModal, setShowGlobalWhatsappModal] = useState(false);
  const [targetPatient, setTargetPatient] = useState(null);

  const navItems = [
    { to: '/doctor', label: 'Pacientes y Fichas', icon: Users, exact: true },
    { to: '/doctor/citas', label: 'Agenda y Citas', icon: Calendar },
    { to: '/doctor/presupuestos', label: 'Presupuestos y Pagos', icon: CreditCard },
    { to: '/doctor/caja', label: 'Cuadre de Caja Diario', icon: DollarSign },
    { to: '/doctor/ajustes', label: 'Ajustes del Consultorio', icon: Settings },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const sidebarContent = (
    <>
      <div>
        {/* Logo y Branding del Consultorio */}
        <div className="p-4 border-b border-slate-800">
          <div className="bg-white rounded-2xl p-3 shadow-md flex flex-col items-center justify-center">
            <img
              src={settings?.logo_url || "/logo-dra-adrianaparra.png"}
              alt="Dra. Adriana Parra - Odontología Especializada"
              className="max-h-16 w-auto object-contain"
            />
          </div>
          <div className="text-center mt-2.5">
            <h3 className="font-extrabold text-white text-xs tracking-tight">
              {settings?.doctor_name || 'Dra. Adriana Parra'}
            </h3>
            <p className="text-[10px] text-teal-400 font-semibold truncate">
              Odontología Especializada
            </p>
          </div>
        </div>

        {/* Estado de Supabase y Modo Offline */}
        <div className="mx-4 mt-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            ></span>
            <span className="text-slate-300 font-medium text-[11px]">
              {isOnline ? (connectedToSupabase ? 'Supabase Nube' : 'En Línea') : 'Modo Offline Seguro'}
            </span>
          </div>
          {pendingSyncCount > 0 ? (
            <span className="text-[10px] text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded font-bold border border-amber-500/30">
              {pendingSyncCount} pend.
            </span>
          ) : (
            <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded font-mono">
              Al día
            </span>
          )}
        </div>

        {/* Navegación Principal */}
        <nav className="p-4 space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Panel de la Doctora
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                onClick={handleNavClick}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30 font-bold'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Centro de Mensajería WhatsApp para Pacientes */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="p-3.5 bg-gradient-to-br from-emerald-950/70 to-slate-800 rounded-2xl border border-emerald-700/40 shadow-xs">
          <div className="flex items-center justify-between gap-1 mb-1.5">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-extrabold">
              <span className="text-sm">💬</span>
              <span>WhatsApp Pacientes</span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase">
              Directo
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2.5 leading-tight">
            Envía citas, cuidados y presupuestos directo al WhatsApp del paciente.
          </p>

          {/* Selector de paciente si desea elegir uno específico */}
          {(patients || []).length > 0 && (
            <select
              value={targetPatient?.id || activePatient?.id || ''}
              onChange={(e) => {
                const found = (patients || []).find((p) => p.id === e.target.value);
                setTargetPatient(found);
              }}
              className="w-full mb-2 bg-slate-900 border border-emerald-700/50 rounded-xl px-2.5 py-1.5 text-[11px] text-white font-medium focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              {(patients || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.full_name} ({p.phone})
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => {
              if (!targetPatient && (activePatient || patients?.[0])) {
                setTargetPatient(activePatient || patients?.[0]);
              }
              setShowGlobalWhatsappModal(true);
            }}
            className="flex items-center justify-center gap-2 w-full py-2 text-xs font-extrabold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition shadow-md shadow-emerald-500/20"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Redactar WhatsApp</span>
          </button>
        </div>

        {/* Bloquear Panel de la Doctora */}
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            logoutDoctor();
          }}
          className="flex items-center justify-center gap-2 w-full py-2 text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 rounded-xl border border-rose-800/40 transition"
          title="Bloquear el panel de la doctora con clave"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Bloquear Panel Clínico</span>
        </button>

        <div className="text-[10px] text-slate-500 text-center">
          Desarrollado para Guacara / Yagua 🇻🇪
        </div>
      </div>

      {/* Modal Global de WhatsApp (Se monta únicamente al abrirse para evitar errores de renderizado de fondo) */}
      {showGlobalWhatsappModal && (targetPatient || activePatient || patients?.[0]) && (
        <WhatsAppModal
          isOpen={showGlobalWhatsappModal}
          onClose={() => setShowGlobalWhatsappModal(false)}
          patient={targetPatient || activePatient || patients?.[0]}
          initialTab="cita"
        />
      )}
    </>
  );

  return (
    <>
      {/* 1. Versión de Escritorio (visible en pantallas medianas y grandes: md+) */}
      <aside className="hidden md:flex w-64 bg-slate-900 text-slate-300 flex-col justify-between shrink-0 min-h-screen border-r border-slate-800">
        {sidebarContent}
      </aside>

      {/* 2. Versión Móvil: Drawer deslizable off-canvas */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop con desenfoque suave para cerrar al tocar afuera */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={onClose}
          />
          {/* Panel deslizante */}
          <aside className="relative w-72 max-w-[85vw] bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 h-full border-r border-slate-800 shadow-2xl z-10 animate-in slide-in-from-left duration-200 overflow-y-auto">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800/80 z-20 transition"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
