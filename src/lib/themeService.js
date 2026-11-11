/**
 * SERVICIO DE TEMAS VISUALES CONMEMORATIVOS POR FECHAS
 * Centro Odontológico Especializado Dra. Adriana Parra
 * 
 * Gestiona la selección automática de temas según el calendario:
 * - 🎄 Navidad & Año Nuevo (1 de Noviembre al 15 de Enero)
 * - 💖 Amor y Amistad / San Valentín (1 al 28 de Febrero)
 * - 🦷 Día del Odontólogo (1 al 10 de Octubre)
 * - 💎 Clásico Clínico Odontológico (Resto del año)
 * - 🌸 Rosa Estética Dental (Seleccionable)
 * - 🌙 Clínica Nocturna / Dark Mode (Seleccionable)
 */

export const THEME_CONFIGS = {
  christmas: {
    id: 'christmas',
    name: 'Navidad & Fin de Año',
    shortName: 'Navidad',
    emoji: '🎄',
    badgeText: 'Navidad 2026',
    greeting: '¡Feliz Navidad y Próspero Año Nuevo! 🎄✨',
    subGreeting: 'Temporada conmemorativa festiva en el Centro Odontológico Dra. Adriana Parra',
    description: 'Verde pino abeto, rojo cereza, detalles dorados y sutil nieve flotante.',
    isSeasonal: true,
    seasonRangeText: '1 Noviembre – 15 Enero',
    colors: {
      primaryAccent: 'text-emerald-700',
      primaryBg: 'bg-emerald-600 hover:bg-emerald-700',
      primaryGradient: 'from-emerald-700 via-teal-700 to-rose-700',
      headerBg: 'bg-gradient-to-r from-emerald-950 via-slate-900 to-rose-950',
      headerBorder: 'border-emerald-800/40',
      bannerBg: 'bg-gradient-to-r from-rose-900 via-emerald-900 to-slate-900',
      bannerBorder: 'border-amber-400/30',
      cardHighlight: 'border-emerald-500/30',
      festiveTagBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      festiveAccent: '#dc2626',
      festiveGold: '#f59e0b',
    },
    defaultSnow: true,
  },
  valentine: {
    id: 'valentine',
    name: 'Amor y Amistad',
    shortName: 'San Valentín',
    emoji: '💖',
    badgeText: 'Mes del Amor',
    greeting: '¡Sonrisas que enamoran! Mes de la Amistad 💖',
    subGreeting: 'Edición especial San Valentín en el consultorio',
    description: 'Tonos rubí, fucsia suave y dorado cálido.',
    isSeasonal: true,
    seasonRangeText: '1 Febrero – 28 Febrero',
    colors: {
      primaryAccent: 'text-rose-600',
      primaryBg: 'bg-rose-600 hover:bg-rose-700',
      primaryGradient: 'from-rose-600 to-pink-600',
      headerBg: 'bg-gradient-to-r from-rose-950 via-slate-900 to-pink-950',
      headerBorder: 'border-rose-800/40',
      bannerBg: 'bg-gradient-to-r from-rose-900 via-pink-950 to-slate-900',
      bannerBorder: 'border-rose-400/30',
      cardHighlight: 'border-rose-500/30',
      festiveTagBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      festiveAccent: '#e11d48',
      festiveGold: '#ec4899',
    },
    defaultSnow: false,
  },
  dentist_day: {
    id: 'dentist_day',
    name: 'Día del Odontólogo',
    shortName: 'Día Odontólogo',
    emoji: '🦷',
    badgeText: 'Semana de la Odontología',
    greeting: '¡Feliz Día del Odontólogo! Celebrando la salud bucal 🦷✨',
    subGreeting: 'Vocación, pasión y sonrisas saludables con la Dra. Adriana Parra',
    description: 'Azul zafiro con destellos dorados conmemorativos.',
    isSeasonal: true,
    seasonRangeText: '1 Octubre – 10 Octubre',
    colors: {
      primaryAccent: 'text-indigo-600',
      primaryBg: 'bg-indigo-600 hover:bg-indigo-700',
      primaryGradient: 'from-indigo-600 to-amber-500',
      headerBg: 'bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950',
      headerBorder: 'border-amber-500/30',
      bannerBg: 'bg-gradient-to-r from-indigo-950 via-slate-900 to-amber-950',
      bannerBorder: 'border-amber-400/40',
      cardHighlight: 'border-indigo-500/30',
      festiveTagBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      festiveAccent: '#4f46e5',
      festiveGold: '#f59e0b',
    },
    defaultSnow: false,
  },
  rose: {
    id: 'rose',
    name: 'Rosa Estética Dental',
    shortName: 'Rosa Estética',
    emoji: '🌸',
    badgeText: 'Estética Dental',
    greeting: 'Estética y Diseño de Sonrisa 🌸',
    subGreeting: 'Armonía y delicadeza en cada detalle odontológico',
    description: 'Paleta delicada en rosa cuarzo, malva y blanco perla.',
    isSeasonal: false,
    seasonRangeText: 'Todo el año',
    colors: {
      primaryAccent: 'text-pink-600',
      primaryBg: 'bg-pink-600 hover:bg-pink-700',
      primaryGradient: 'from-pink-600 to-rose-500',
      headerBg: 'bg-gradient-to-r from-pink-950 via-slate-900 to-rose-950',
      headerBorder: 'border-pink-800/40',
      bannerBg: 'bg-gradient-to-r from-pink-950 via-slate-900 to-rose-950',
      bannerBorder: 'border-pink-400/30',
      cardHighlight: 'border-pink-500/30',
      festiveTagBg: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      festiveAccent: '#ec4899',
      festiveGold: '#f43f5e',
    },
    defaultSnow: false,
  },
  dark: {
    id: 'dark',
    name: 'Clínica Nocturna (Dark)',
    shortName: 'Modo Oscuro',
    emoji: '🌙',
    badgeText: 'Noche Clínica',
    greeting: 'Modo Descanso Visual Nocturno 🌙',
    subGreeting: 'Mayor confort visual para jornadas clínicas',
    description: 'Contrastes oscuros profundos en grafito y azul titanio.',
    isSeasonal: false,
    seasonRangeText: 'Todo el año',
    colors: {
      primaryAccent: 'text-teal-400',
      primaryBg: 'bg-teal-600 hover:bg-teal-500',
      primaryGradient: 'from-slate-800 to-slate-900',
      headerBg: 'bg-slate-950',
      headerBorder: 'border-slate-800',
      bannerBg: 'bg-slate-900',
      bannerBorder: 'border-teal-500/30',
      cardHighlight: 'border-slate-700',
      festiveTagBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      festiveAccent: '#14b8a6',
      festiveGold: '#38bdf8',
    },
    defaultSnow: false,
  },
  classic: {
    id: 'classic',
    name: 'Clásico Clínico (Menta & Turquesa)',
    shortName: 'Clásico Menta',
    emoji: '💎',
    badgeText: 'Clásico Clínico',
    greeting: 'Centro Odontológico Especializado Dra. Adriana Parra 💎',
    subGreeting: 'Atención dental integral, estética y quirúrgica de excelencia',
    description: 'El diseño profesional insignia en tonos verde menta, turquesa zafiro y blanco clínico.',
    isSeasonal: false,
    seasonRangeText: 'Por defecto anual',
    colors: {
      primaryAccent: 'text-teal-600',
      primaryBg: 'bg-teal-600 hover:bg-teal-700',
      primaryGradient: 'from-teal-600 to-emerald-600',
      headerBg: 'bg-slate-900',
      headerBorder: 'border-slate-800',
      bannerBg: 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900',
      bannerBorder: 'border-teal-500/30',
      cardHighlight: 'border-teal-500/20',
      festiveTagBg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      festiveAccent: '#0d9488',
      festiveGold: '#14b8a6',
    },
    defaultSnow: false,
  },
};

/**
 * Determina el tema conmemorativo automático según la fecha del calendario.
 * En Venezuela, la Navidad y fin de año se celebra desde Noviembre hasta mediados de Enero.
 */
export function getAutoSeasonalTheme(date = new Date()) {
  const month = date.getMonth() + 1; // 1 - 12
  const day = date.getDate();

  // 1. Temporada Navideña & Fin de Año (1 de Noviembre al 15 de Enero)
  if (month === 11 || month === 12 || (month === 1 && day <= 15)) {
    return THEME_CONFIGS.christmas;
  }

  // 2. Mes del Amor y la Amistad / San Valentín (1 al 28 de Febrero)
  if (month === 2) {
    return THEME_CONFIGS.valentine;
  }

  // 3. Semana del Odontólogo (1 al 10 de Octubre - 3 de Octubre es el Día del Odontólogo)
  if (month === 10 && day >= 1 && day <= 10) {
    return THEME_CONFIGS.dentist_day;
  }

  // Resto del año: Clásico Clínico
  return THEME_CONFIGS.classic;
}

/**
 * Obtiene la configuración de tema activa considerando la preferencia del usuario
 * (Automático por fecha vs selección manual).
 */
export function getActiveThemeConfig() {
  let mode = 'auto'; // 'auto' | 'manual'
  let manualThemeId = 'christmas';
  let snowPref = null;

  try {
    if (typeof localStorage !== 'undefined') {
      mode = localStorage.getItem('dra_parra_theme_mode') || 'auto';
      manualThemeId = localStorage.getItem('dra_parra_manual_theme') || 'christmas';
      const storedSnow = localStorage.getItem('dra_parra_snow_enabled');
      if (storedSnow !== null) {
        snowPref = storedSnow === 'true';
      }
    }
  } catch {
    // ignore
  }

  const autoTheme = getAutoSeasonalTheme();
  const activeTheme = mode === 'auto'
    ? autoTheme
    : (THEME_CONFIGS[manualThemeId] || THEME_CONFIGS.christmas);

  const isSnowActive = snowPref !== null ? snowPref : Boolean(activeTheme.defaultSnow);

  return {
    theme: activeTheme,
    mode, // 'auto' | 'manual'
    isAuto: mode === 'auto',
    autoThemeId: autoTheme.id,
    isSnowActive,
    isChristmas: activeTheme.id === 'christmas',
  };
}

/**
 * Guarda las preferencias de tema en localStorage
 */
export function saveThemePreferences({ mode = 'auto', themeId = 'christmas', snowEnabled = true }) {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('dra_parra_theme_mode', mode);
      if (themeId) {
        localStorage.setItem('dra_parra_manual_theme', themeId);
      }
      localStorage.setItem('dra_parra_snow_enabled', String(snowEnabled));
    }
  } catch {
    // ignore
  }
}
