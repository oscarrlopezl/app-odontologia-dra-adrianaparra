import React, { useState } from 'react';
import { useDental } from '../../context/DentalContext';
import { Lock, Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export default function DoctorLoginScreen() {
  const { loginDoctor, settings } = useDental();
  const [pin, setPin] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor ingresa la clave de acceso');
      return;
    }

    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const res = loginDoctor(pin, remember);
      setIsLoading(false);
      if (!res.success) {
        setError(res.error || 'Clave de acceso incorrecta');
      }
    }, 200);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-7 sm:p-9 border border-teal-500/20 space-y-6 animate-in zoom-in-95 duration-200">
        
        {/* Logo y Encabezado */}
        <div className="text-center space-y-3">
          <div className="inline-block p-3 bg-teal-50 rounded-2xl border border-teal-100 shadow-xs">
            <img
              src={settings?.logo_url || '/logo-dra-adrianaparra.png'}
              alt="Dra. Adriana Parra"
              className="max-h-16 w-auto object-contain mx-auto"
            />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {settings?.doctor_name || 'Dra. Adriana Parra'}
            </h2>
            <p className="text-xs font-semibold text-teal-700 mt-0.5">
              Acceso Seguro al Panel Clínico y Administrativo
            </p>
          </div>
        </div>

        {/* Formulario de Acceso */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2 font-medium animate-in shake">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Clave de Acceso de la Doctora *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-700">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Ingresa tu clave o PIN"
                className="w-full pl-10 pr-10 py-3 text-sm font-bold text-slate-900 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 transition"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-700 mt-1">
              Clave inicial por defecto: <span className="font-mono font-bold text-teal-700">1234</span>
            </p>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-700">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium">Recordar en este equipo</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-teal-600/30 transition flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            <span>{isLoading ? 'Verificando...' : 'Ingresar al Panel Clínico'}</span>
          </button>
        </form>

        {/* Pie informativo */}
        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-700">
            Guacara / Yagua, Edo. Carabobo 🇻🇪 • Sistema Privado
          </p>
        </div>
      </div>
    </div>
  );
}
