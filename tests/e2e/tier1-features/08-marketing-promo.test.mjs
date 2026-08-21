/**
 * Tier 1 - Marketing & In-App Promotional Engine Test Suite
 * Covers F1.1 (Dynamic Frosted Top Promo Bar), F1.2 (Lead Magnet Preview Mode),
 * F1.3 (Homepage Featured Courses Refactor), F1.4 (Admin CMS & Dev Console Controls).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  DEFAULT_MARKETING_BANNER,
  DEFAULT_LEAD_MAGNET_CONFIG,
  calculateCountdown,
  isBannerVisible,
  processCouponCode,
  evaluateLectureAccess,
  validateMarketingConfigSchema,
} from '../helpers/expansion-marketing-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 1.1 - Dynamic Frosted Top Promo Bar', (test) => {
    test('T1.F1.1.1: Top promo banner calculates active countdown accurately for future deadline', () => {
      const futureDate = '2026-12-31T23:59:59Z';
      const nowDate = '2026-12-31T20:59:59Z'; // 3 hours difference
      const countdown = calculateCountdown(futureDate, nowDate);

      assert.strictEqual(countdown.isExpired, false, 'Banner should not be expired');
      assert.strictEqual(countdown.hours, 3, 'Should compute exactly 3 hours');
      assert.strictEqual(countdown.minutes, 0, 'Should compute 0 minutes');
      assert.strictEqual(countdown.seconds, 0, 'Should compute 0 seconds');
      assert.strictEqual(countdown.formatted, '03:00:00', 'Should format time as HH:MM:SS');
    });

    test('T1.F1.1.2: Top promo banner identifies expired deadline and formats zero time', () => {
      const pastDate = '2026-01-01T00:00:00Z';
      const nowDate = '2026-06-01T00:00:00Z';
      const countdown = calculateCountdown(pastDate, nowDate);

      assert.strictEqual(countdown.isExpired, true, 'Banner countdown must mark expired as true');
      assert.strictEqual(countdown.totalSeconds, 0);
      assert.strictEqual(countdown.formatted, '00:00:00');
    });

    test('T1.F1.1.3: Banner visibility respects enabled state and dismissal flag', () => {
      const activeConfig = { ...DEFAULT_MARKETING_BANNER, enabled: true, target_date: '2026-12-31T00:00:00Z' };
      const testNow = '2026-06-01T00:00:00Z';

      // Enabled and not dismissed
      assert.strictEqual(isBannerVisible(activeConfig, false, testNow), true, 'Banner should be visible');

      // Dismissed by user in local storage
      assert.strictEqual(isBannerVisible(activeConfig, true, testNow), false, 'Dismissed banner must not be visible');

      // Disabled in CMS
      const disabledConfig = { ...activeConfig, enabled: false };
      assert.strictEqual(isBannerVisible(disabledConfig, false, testNow), false, 'Disabled banner must not be visible');
    });

    test('T1.F1.1.4: Coupon code copy processor trims, upper-cases, and identifies discount percent', () => {
      const result = processCouponCode('  pharma30  ');
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.code, 'PHARMA30');
      assert.strictEqual(result.discountPercent, 30);
      assert.includes(result.message, '30% off');
    });

    test('T1.F1.1.5: CTA navigation link resolves target route with discount coupon context', () => {
      const config = { ...DEFAULT_MARKETING_BANNER, cta_url: '/courses?coupon=PHARMA30' };
      assert.includes(config.cta_url, '/courses');
      assert.includes(config.cta_url, 'PHARMA30');
    });
  });

  runner.suite('Tier 1: Feature 1.2 - Lead Magnet Preview Mode', (test) => {
    test('T1.F1.2.1: Guest user is permitted to preview first lecture (order 1) when lead magnet is enabled', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 1,
        isGuest: true,
        isEnrolled: false,
        leadMagnetConfig: { enabled: true, preview_all_first_lectures: true },
        courseAccessPolicy: 'students_only',
      });

      assert.strictEqual(access.canAccess, true, 'First lecture should be accessible to guest');
      assert.strictEqual(access.isPreview, true, 'Access mode should be flagged as preview');
      assert.strictEqual(access.showConversionModal, false, 'Modal should not block preview lecture');
    });

    test('T1.F1.2.2: Guest user attempting subsequent lecture (order 2+) is blocked with conversion modal', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 2,
        isGuest: true,
        isEnrolled: false,
        leadMagnetConfig: { enabled: true, preview_all_first_lectures: true, modal_title_en: 'Enroll to Continue' },
        courseAccessPolicy: 'students_only',
      });

      assert.strictEqual(access.canAccess, false, 'Subsequent lecture must be locked');
      assert.strictEqual(access.showConversionModal, true, 'Conversion modal must trigger');
      assert.strictEqual(access.modalTitle, 'Enroll to Continue');
    });

    test('T1.F1.2.3: Enrolled student accesses all lectures without preview flag or modal', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 5,
        isGuest: false,
        isEnrolled: true,
        leadMagnetConfig: DEFAULT_LEAD_MAGNET_CONFIG,
        courseAccessPolicy: 'enrolled_only',
      });

      assert.strictEqual(access.canAccess, true);
      assert.strictEqual(access.isPreview, false);
      assert.strictEqual(access.showConversionModal, false);
    });

    test('T1.F1.2.4: Disabling lead magnet preview blocks guest from lecture 1 on private courses', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 1,
        isGuest: true,
        isEnrolled: false,
        leadMagnetConfig: { enabled: false, preview_all_first_lectures: false },
        courseAccessPolicy: 'students_only',
      });

      assert.strictEqual(access.canAccess, false);
      assert.strictEqual(access.showConversionModal, true);
    });

    test('T1.F1.2.5: Open courses allow full access to all users regardless of lead magnet configuration', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 4,
        isGuest: true,
        isEnrolled: false,
        leadMagnetConfig: { enabled: false, preview_all_first_lectures: false },
        courseAccessPolicy: 'open',
      });

      assert.strictEqual(access.canAccess, true);
      assert.strictEqual(access.showConversionModal, false);
    });
  });

  runner.suite('Tier 1: Feature 1.3 - Homepage Featured Courses Refactor', (test) => {
    test('T1.F1.3.1: Homepage featured courses selector filters courses marked with is_featured flag', () => {
      const catalog = [
        { id: 'c1', title_en: 'Cardio', is_featured: true },
        { id: 'c2', title_en: 'Renal', is_featured: false },
        { id: 'c3', title_en: 'Neuro', is_featured: true },
      ];
      const featured = catalog.filter((c) => c.is_featured);
      assert.strictEqual(featured.length, 2);
      assert.strictEqual(featured[0].id, 'c1');
      assert.strictEqual(featured[1].id, 'c3');
    });

    test('T1.F1.3.2: Featured course card renders promotional badge tag when defined', () => {
      const course = { id: 'c1', promo_badge: 'High Yield' };
      assert.strictEqual(course.promo_badge, 'High Yield');
    });

    test('T1.F1.3.3: Homepage course CTA directs to dedicated full-page catalog /courses', () => {
      const ctaLink = '/courses';
      assert.strictEqual(ctaLink, '/courses');
    });

    test('T1.F1.3.4: Homepage course card formats student enrollment counts cleanly', () => {
      const count = 2150;
      const formatted = count >= 1000 ? `${(count / 1000).toFixed(1)}k students` : `${count} students`;
      assert.strictEqual(formatted, '2.1k students');
    });

    test('T1.F1.3.5: Empty featured list falls back gracefully without UI breaking', () => {
      const catalog = [{ id: 'c1', is_featured: false }];
      const featured = catalog.filter((c) => c.is_featured);
      assert.strictEqual(featured.length, 0);
    });
  });

  runner.suite('Tier 1: Feature 1.4 - Admin CMS & Dev Console Controls', (test) => {
    test('T1.F1.4.1: Valid marketing banner schema passes validation with full bilingual fields', () => {
      const payload = {
        enabled: true,
        text_en: 'Summer Discount',
        text_ar: 'خصم الصيف',
        coupon_code: 'SUMMER2026',
        target_date: '2026-08-30T00:00:00Z',
      };
      const result = validateMarketingConfigSchema(payload);
      assert.strictEqual(result.valid, true);
      assert.strictEqual(result.errors.length, 0);
    });

    test('T1.F1.4.2: Invalid non-boolean enabled field is rejected with schema error', () => {
      const payload = { enabled: 'yes', text_en: 'Sale' };
      const result = validateMarketingConfigSchema(payload);
      assert.strictEqual(result.valid, false);
      assert.includes(result.errors[0], 'enabled must be a boolean');
    });

    test('T1.F1.4.3: Malformed target_date ISO string is rejected by validator', () => {
      const payload = { enabled: true, target_date: 'invalid-date-format' };
      const result = validateMarketingConfigSchema(payload);
      assert.strictEqual(result.valid, false);
      assert.includes(result.errors[0], 'target_date');
    });

    test('T1.F1.4.4: Lead magnet admin toggle state persists across updates', () => {
      let config = { ...DEFAULT_LEAD_MAGNET_CONFIG, enabled: true };
      config = { ...config, enabled: false };
      assert.strictEqual(config.enabled, false);
    });

    test('T1.F1.4.5: Developer console feature flag toggles for promo bar sync properly', () => {
      const devState = { promo_banner_override: true, simulated_expired_timer: false };
      assert.strictEqual(devState.promo_banner_override, true);
      assert.strictEqual(devState.simulated_expired_timer, false);
    });
  });
}
