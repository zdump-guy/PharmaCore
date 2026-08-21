/**
 * Visual Polish, Confetti Celebrations & Navigation Engine
 * for PharmaCore Expansion Suite Tests.
 */

export const GLASS_TOKENS = {
  container: 'bg-white/10 dark:bg-slate-900/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-xl',
  card: 'bg-white/70 dark:bg-slate-900/60 backdrop-blur-lg border border-slate-200/50 dark:border-slate-800/60 shadow-lg',
  dropdown: 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800',
  glowAmber: 'shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  glowCyan: 'shadow-[0_0_20px_rgba(6,182,212,0.25)]',
  glowPurple: 'shadow-[0_0_20px_rgba(168,85,247,0.25)]',
};

export const CONFETTI_PRESETS = {
  quiz_pass: {
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#10B981', '#3B82F6', '#F59E0B'],
    decay: 0.92,
  },
  rank_up: {
    particleCount: 100,
    spread: 90,
    origin: { y: 0.6 },
    colors: ['#F59E0B', '#E11D48', '#8B5CF6', '#3B82F6'],
    decay: 0.94,
  },
  certificate_unlock: {
    particleCount: 150,
    spread: 120,
    origin: { y: 0.5 },
    colors: ['#FFD700', '#FFA500', '#00FFFF', '#FF69B4', '#7B68EE'],
    decay: 0.96,
  },
};

/**
 * Simulates confetti burst calculations without DOM/Canvas dependency
 */
export function simulateConfettiBurst(presetType = 'quiz_pass', customOptions = {}) {
  const preset = CONFETTI_PRESETS[presetType] || CONFETTI_PRESETS.quiz_pass;
  const options = { ...preset, ...customOptions };

  const particleCount = options.particleCount !== undefined ? options.particleCount : 50;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * (options.spread || 60) - (options.spread || 60) / 2;
    const velocity = 25 + Math.random() * 20;
    const colorsList = options.colors && options.colors.length > 0 ? options.colors : preset.colors;
    const color = colorsList[i % colorsList.length];

    particles.push({
      id: i + 1,
      angle,
      velocity,
      color,
      decay: options.decay,
      alpha: 1.0,
    });
  }

  return {
    presetType,
    particleCount: particles.length,
    particles,
    origin: options.origin,
    colors: options.colors && options.colors.length > 0 ? options.colors : preset.colors,
    durationMs: Math.round(1000 / (1 - options.decay)),
  };
}

/**
 * Global Navigation Route Manifest Validator
 */
export const GLOBAL_NAV_ROUTES = [
  { path: '/', label_en: 'Home', label_ar: 'الرئيسية', requiresAuth: false },
  { path: '/courses', label_en: 'Courses', label_ar: 'المقررات', requiresAuth: false },
  { path: '/dashboard', label_en: 'Dashboard', label_ar: 'لوحة التعلم', requiresAuth: true },
  { path: '/leaderboard', label_en: 'Leaderboard', label_ar: 'المتصدرون', requiresAuth: false },
  { path: '/profile', label_en: 'Profile', label_ar: 'الملف الشخصي', requiresAuth: true },
];

/**
 * Evaluates route accessibility and active state
 */
export function resolveNavState(currentPath, isAuthenticated = false) {
  const matchingRoute = GLOBAL_NAV_ROUTES.find((r) => r.path === currentPath) || null;
  const isAccessible = !matchingRoute || !matchingRoute.requiresAuth || isAuthenticated;

  return {
    currentPath,
    matchingRoute,
    isAccessible,
    shouldRedirectToLogin: matchingRoute ? Boolean(matchingRoute.requiresAuth && !isAuthenticated) : false,
  };
}
