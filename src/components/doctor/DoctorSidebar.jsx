import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useDental } from '../../context/DentalContext';
import {
  Users,
  Calendar,
  CreditCard,
  DollarSign,
  Settings,
  Sparkles,
  ExternalLink,
  Activity,
  HeartPulse,
} from 'lucide-react';

export default function DoctorSidebar() {
  const { settings, connectedToSupabase } = useDental();

  const navItems = [
    { to: '/doctor', label: 'Pacientes y Fichas', icon: Users, exact: true },
    { to: '/doctor/citas', label: 'Agenda y Citas', icon: Calendar },
    { to: '/doctor/presupuestos', label: 'Presupuestos y Pagos', icon: CreditCard },
    { to: '/doctor/caja', label: 'Cuadre de Caja Diario', icon: DollarSign },
    { to: '/doctor/ajustes', label: 'Ajustes del Consultorio', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800">
      <div>
        {/* Logo y Branding del Consultorio */}
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center text-white text-xl shadow-lg shadow-teal-500/20">
            🦷
          </div>
          <div>
            <h1 className="font-extrabold text-white text-sm leading-tight">
              {settings.doctor_name || 'Dra. Adriana Parra'}
            </h1>
            <p className="text-[11px] text-teal-400 font-medium">Odontología Especializada</p>
          </div>
        </div>

        {/* Estado de Supabase */}
        <div className="mx-4 mt-4 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                connectedToSupabase ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-amber-500'
              }`}
            ></span>
            <span className="text-slate-300 font-medium">
              {connectedToSupabase ? 'Supabase Conectado' : 'Modo Demo Activo'}
            </span>
          </div>
          <span className="text-[10px] text-slate-700 bg-slate-900 px-1.5 py-0.5 rounded">
            v1.0
          </span>
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

      {/* Acceso Directo al Portal del Paciente */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        <div className="p-3 bg-gradient-to-br from-teal-950/60 to-slate-800 rounded-xl border border-teal-800/40">
          <div className="flex items-center gap-2 text-teal-300 text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Portal del Paciente</span>
          </div>
          <p className="text-[11px] text-slate-400 mb-2">
            Vista responsive diseñada para el teléfono del paciente.
          </p>
          <Link
            to="/portal"
            target="_blank"
            className="flex items-center justify-center gap-1.5 w-full py-1.5 text-xs font-bold text-teal-300 bg-teal-900/50 hover:bg-teal-800/60 rounded-lg border border-teal-700/50 transition"
          >
            <span>Abrir Portal Móvil</span>
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        <div className="text-[10px] text-slate-500 text-center">
          Desarrollado para Guacara / Yagua 🇻🇪
        </div>
      </div>
    </aside>
  );
}
