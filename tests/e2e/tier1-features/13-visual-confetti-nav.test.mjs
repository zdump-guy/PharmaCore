/**
 * Tier 1 - Visual Polish, Confetti & Navigation Wiring Test Suite
 * Covers F6.1 (Visual Glassmorphism Polish),
 * F6.2 (Confetti Celebrations Engine),
 * F6.3 (Global Navigation Wiring).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  GLASS_TOKENS,
  CONFETTI_PRESETS,
  simulateConfettiBurst,
  GLOBAL_NAV_ROUTES,
  resolveNavState,
} from '../helpers/expansion-visual-confetti-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 6.1 - Visual Glassmorphism Polish', (test) => {
    test('T1.F6.1.1: Glassmorphism tokens define backdrop-blur and border translucency for light/dark themes', () => {
      assert.includes(GLASS_TOKENS.container, 'backdrop-blur-md');
      assert.includes(GLASS_TOKENS.container, 'border-white/20');
      assert.includes(GLASS_TOKENS.container, 'dark:bg-slate-900/40');
    });

    test('T1.F6.1.2: Card glass token provides elevated shadow and backdrop blur', () => {
      assert.includes(GLASS_TOKENS.card, 'backdrop-blur-lg');
      assert.includes(GLASS_TOKENS.card, 'shadow-lg');
    });

    test('T1.F6.1.3: Ambient glow shadow tokens are defined for Amber, Cyan, and Purple accents', () => {
      assert.includes(GLASS_TOKENS.glowAmber, 'rgba(245,158,11');
      assert.includes(GLASS_TOKENS.glowCyan, 'rgba(6,182,212');
      assert.includes(GLASS_TOKENS.glowPurple, 'rgba(168,85,247');
    });

    test('T1.F6.1.4: Glassmorphism dropdown menu defines high-opacity blurred background for readability', () => {
      assert.includes(GLASS_TOKENS.dropdown, 'backdrop-blur-xl');
      assert.includes(GLASS_TOKENS.dropdown, 'bg-white/95');
    });

    test('T1.F6.1.5: Gradient borders maintain high contrast across themes', () => {
      assert.includes(GLASS_TOKENS.card, 'dark:border-slate-800/60');
    });
  });

  runner.suite('Tier 1: Feature 6.2 - Confetti Celebrations Engine', (test) => {
    test('T1.F6.2.1: Quiz pass celebration generates 50 particle bursts with emerald/blue colors', () => {
      const burst = simulateConfettiBurst('quiz_pass');
      assert.strictEqual(burst.presetType, 'quiz_pass');
      assert.strictEqual(burst.particleCount, 50);
      assert.ok(burst.particles.length === 50);
      assert.includes(burst.colors, '#10B981');
    });

    test('T1.F6.2.2: Division rank-up celebration generates 100 particles with wider spread', () => {
      const burst = simulateConfettiBurst('rank_up');
      assert.strictEqual(burst.presetType, 'rank_up');
      assert.strictEqual(burst.particleCount, 100);
      assert.ok(burst.particles[0].velocity >= 25);
    });

    test('T1.F6.2.3: Certificate unlock celebration generates 150 gold/cyan confetti particles', () => {
      const burst = simulateConfettiBurst('certificate_unlock');
      assert.strictEqual(burst.presetType, 'certificate_unlock');
      assert.strictEqual(burst.particleCount, 150);
      assert.includes(burst.colors, '#FFD700');
    });

    test('T1.F6.2.4: Physics simulation calculates finite duration in milliseconds for clean animation tear-down', () => {
      const burst = simulateConfettiBurst('quiz_pass');
      assert.ok(burst.durationMs > 0 && burst.durationMs < 30000);
    });

    test('T1.F6.2.5: Custom override options allow dynamic particle count adjustment', () => {
      const customBurst = simulateConfettiBurst('quiz_pass', { particleCount: 80 });
      assert.strictEqual(customBurst.particleCount, 80);
    });
  });

  runner.suite('Tier 1: Feature 6.3 - Global Navigation Wiring', (test) => {
    test('T1.F6.3.1: Global navigation route registry includes Home, Courses, Dashboard, Leaderboard, and Profile', () => {
      const paths = GLOBAL_NAV_ROUTES.map((r) => r.path);
      assert.includes(paths, '/');
      assert.includes(paths, '/courses');
      assert.includes(paths, '/dashboard');
      assert.includes(paths, '/leaderboard');
      assert.includes(paths, '/profile');
    });

    test('T1.F6.3.2: Unauthenticated guest accessing public routes (/courses, /leaderboard) is permitted', () => {
      const coursesNav = resolveNavState('/courses', false);
      assert.strictEqual(coursesNav.isAccessible, true);
      assert.strictEqual(coursesNav.shouldRedirectToLogin, false);

      const leaderNav = resolveNavState('/leaderboard', false);
      assert.strictEqual(leaderNav.isAccessible, true);
      assert.strictEqual(leaderNav.shouldRedirectToLogin, false);
    });

    test('T1.F6.3.3: Unauthenticated guest accessing protected route (/dashboard) triggers login redirect', () => {
      const dashNav = resolveNavState('/dashboard', false);
      assert.strictEqual(dashNav.isAccessible, false);
      assert.strictEqual(dashNav.shouldRedirectToLogin, true);
    });

    test('T1.F6.3.4: Authenticated student accessing /dashboard and /profile is granted access', () => {
      const dashNav = resolveNavState('/dashboard', true);
      assert.strictEqual(dashNav.isAccessible, true);
      assert.strictEqual(dashNav.shouldRedirectToLogin, false);

      const profNav = resolveNavState('/profile', true);
      assert.strictEqual(profNav.isAccessible, true);
    });

    test('T1.F6.3.5: Bilingual navigation labels are defined for all global links', () => {
      GLOBAL_NAV_ROUTES.forEach((r) => {
        assert.ok(r.label_en, `Route ${r.path} missing English label`);
        assert.ok(r.label_ar, `Route ${r.path} missing Arabic label`);
      });
    });
  });
}
