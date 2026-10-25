import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Share, PlusSquare, Check } from 'lucide-react';

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('dra_parra_pwa_dismissed') === 'true';
  });

  useEffect(() => {
    // 1. Detectar si ya está instalada / abierta como app standalone
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches || 
      window.navigator.standalone || 
      document.referrer.includes('android-app://');
    
    setIsStandalone(isStandaloneMode);

    // 2. Detectar si es iOS (iPhone / iPad)
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Capturar evento de instalación nativa para Android, Chrome y PC
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (isStandalone || isDismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else if (isIos) {
      setShowIosGuide(true);
    } else {
      // Instrucción genérica si el navegador no soporta el prompt automático
      alert('Para instalar la aplicación:\n1. Toca los tres puntos de tu navegador (menú superior o inferior).\n2. Selecciona "Instalar aplicación" o "Agregar a la pantalla de inicio".');
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('dra_parra_pwa_dismissed', 'true');
  };

  return (
    <>
      {/* Banner / Píldora Flotante de Instalación */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-4 duration-200">
        <div className="bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl border border-teal-500/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center shrink-0 shadow-md">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-white truncate">¿Instalar App del Consultorio en tu Teléfono / PC?</h4>
              <p className="text-[11px] text-teal-200 truncate">Acceso directo al panel clínico de la Dra. Adriana Parra</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-extrabold rounded-xl shadow-md transition flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Instalar</span>
            </button>
            <button
              onClick={handleDismiss}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Guía para iPhone / iPad (Safari) */}
      {showIosGuide && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-slate-800 space-y-4 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto">
              <Smartphone className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-slate-900">Cómo instalar en tu iPhone</h3>
              <p className="text-xs text-slate-700">Sigue estos 2 sencillos pasos en Safari:</p>
            </div>

            <div className="space-y-3 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <span>Toca el botón <strong>Compartir</strong> <Share className="w-4 h-4 inline text-teal-700" /> en la barra inferior de Safari.</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <span>Baja y selecciona <strong>"Agregar a la pantalla de inicio"</strong> <PlusSquare className="w-4 h-4 inline text-teal-700" />.</span>
              </div>
            </div>

            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
