import React from 'react';
import { NavLink } from 'react-router-dom';
import { Users, Calendar, CreditCard, DollarSign, Settings, MessageSquare } from 'lucide-react';
import { useDental } from '../../context/DentalContext';

export default function MobileBottomNav({ onOpenWhatsApp }) {
  const { pendingSyncCount, isOnline } = useDental();

  const items = [
    { to: '/doctor', label: 'Pacientes', icon: Users, exact: true },
    { to: '/doctor/citas', label: 'Citas', icon: Calendar },
    { to: '/doctor/presupuestos', label: 'Presupuestos', icon: CreditCard },
    { to: '/doctor/caja', label: 'Caja', icon: DollarSign },
    { to: '/doctor/ajustes', label: 'Ajustes', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 py-1 flex items-center justify-around shadow-2xl safe-area-pb">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition text-[10px] font-bold min-w-[56px] relative ${
                isActive
                  ? 'text-emerald-400 font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-xl transition ${isActive ? 'bg-emerald-500/15 text-emerald-400' : ''}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                <span className="truncate mt-0.5">{item.label}</span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>
                )}
              </>
            )}
          </NavLink>
        );
      })}

      {/* Botón Flotante Rápido de WhatsApp */}
      {onOpenWhatsApp && (
        <button
          type="button"
          onClick={onOpenWhatsApp}
          className="flex flex-col items-center justify-center py-1.5 px-2 text-[10px] font-bold text-emerald-300 hover:text-emerald-200 transition min-w-[56px]"
          title="Abrir WhatsApp para pacientes"
        >
          <div className="p-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <MessageSquare className="w-5 h-5 shrink-0" />
          </div>
          <span className="truncate mt-0.5">WhatsApp</span>
        </button>
      )}
    </nav>
  );
}
