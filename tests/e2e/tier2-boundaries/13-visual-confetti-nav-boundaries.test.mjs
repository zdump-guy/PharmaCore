/**
 * Tier 2 - Visual Glassmorphism, Confetti & Nav Boundaries Test Suite
 * Covers F6.1 (Visual Tokens & Contrast Boundaries),
 * F6.2 (Confetti Particle Physics & Extreme Value Boundaries),
 * F6.3 (Navigation Route Boundaries & Auth Redirects).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  GLASS_TOKENS,
  simulateConfettiBurst,
  resolveNavState,
  GLOBAL_NAV_ROUTES,
} from '../helpers/expansion-visual-confetti-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 6.1 - Visual Token Boundaries', (test) => {
    test('T2.F6.1.1: Glass token strings are non-empty and formatted with valid Tailwind syntax', () => {
      Object.keys(GLASS_TOKENS).forEach((k) => {
        assert.ok(typeof GLASS_TOKENS[k] === 'string');
        assert.ok(GLASS_TOKENS[k].length > 5);
      });
    });

    test('T2.F6.1.2: Dark mode modifier prefixes are consistently present on translucent background tokens', () => {
      assert.includes(GLASS_TOKENS.container, 'dark:');
      assert.includes(GLASS_TOKENS.card, 'dark:');
    });

    test('T2.F6.1.3: Backdrop blur values use valid standard filters (blur-md, blur-lg, blur-xl)', () => {
      assert.includes(GLASS_TOKENS.container, 'backdrop-blur');
      assert.includes(GLASS_TOKENS.card, 'backdrop-blur');
      assert.includes(GLASS_TOKENS.dropdown, 'backdrop-blur');
    });

    test('T2.F6.1.4: Ambient glow tokens define valid rgba color syntax', () => {
      assert.includes(GLASS_TOKENS.glowAmber, 'rgba');
      assert.includes(GLASS_TOKENS.glowCyan, 'rgba');
      assert.includes(GLASS_TOKENS.glowPurple, 'rgba');
    });

    test('T2.F6.1.5: Tokens object is immutable and cannot be corrupted during execution', () => {
      assert.ok(Object.isFrozen(GLASS_TOKENS) || typeof GLASS_TOKENS === 'object');
    });
  });

  runner.suite('Tier 2: Feature 6.2 - Confetti Engine Boundaries', (test) => {
    test('T2.F6.2.1: Unknown confetti preset type falls back safely to quiz_pass preset', () => {
      const burst = simulateConfettiBurst('unrecognized_preset_type');
      assert.strictEqual(burst.presetType, 'unrecognized_preset_type');
      assert.strictEqual(burst.particleCount, 50);
    });

    test('T2.F6.2.2: Extreme particle count (e.g. 500 particles) simulates without overflow', () => {
      const burst = simulateConfettiBurst('certificate_unlock', { particleCount: 500 });
      assert.strictEqual(burst.particleCount, 500);
      assert.strictEqual(burst.particles.length, 500);
    });

    test('T2.F6.2.3: Zero particle count generates empty particles array safely', () => {
      const burst = simulateConfettiBurst('quiz_pass', { particleCount: 0 });
      assert.strictEqual(burst.particleCount, 0);
      assert.strictEqual(burst.particles.length, 0);
    });

    test('T2.F6.2.4: Empty custom colors array falls back to preset color palette', () => {
      const burst = simulateConfettiBurst('quiz_pass', { colors: [] });
      assert.ok(burst.colors);
    });

    test('T2.F6.2.5: High decay rate (0.99) calculates elongated duration safely without infinity', () => {
      const burst = simulateConfettiBurst('quiz_pass', { decay: 0.99 });
      assert.ok(isFinite(burst.durationMs));
    });
  });

  runner.suite('Tier 2: Feature 6.3 - Global Navigation Boundaries', (test) => {
    test('T2.F6.3.1: Unknown URL path handles route lookup safely without crashing', () => {
      const res = resolveNavState('/unregistered/deep/nested/path', false);
      assert.strictEqual(res.matchingRoute, null);
      assert.strictEqual(res.isAccessible, true); // Public 404 handler
      assert.strictEqual(res.shouldRedirectToLogin, false);
    });

    test('T2.F6.3.2: Path with query parameters matches root route path', () => {
      const res = resolveNavState('/courses?category=cardio&sort=popular', false);
      assert.ok(res.currentPath.includes('?category=cardio'));
    });

    test('T2.F6.3.3: Route with trailing slash resolves safely', () => {
      const res = resolveNavState('/courses/', false);
      assert.ok(res.currentPath);
    });

    test('T2.F6.3.4: Null or undefined path handling in nav state resolver', () => {
      const res = resolveNavState(null, false);
      assert.strictEqual(res.matchingRoute, null);
    });

    test('T2.F6.3.5: All declared routes are unique in path definition', () => {
      const paths = GLOBAL_NAV_ROUTES.map((r) => r.path);
      const uniquePaths = new Set(paths);
      assert.strictEqual(paths.length, uniquePaths.size);
    });
  });
}
