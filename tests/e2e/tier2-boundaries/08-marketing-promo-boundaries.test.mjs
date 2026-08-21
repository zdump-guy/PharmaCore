/**
 * Tier 2 - Marketing & Promo Boundaries & Corner Cases Test Suite
 * Covers extreme boundaries, invalid timers, missing fields, coupon edge cases,
 * and lead magnet permission limits.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  calculateCountdown,
  isBannerVisible,
  processCouponCode,
  evaluateLectureAccess,
  validateMarketingConfigSchema,
} from '../helpers/expansion-marketing-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 1.1 - Promo Banner Boundaries', (test) => {
    test('T2.F1.1.1: Null and undefined target_date gracefully returns expired timer without crashing', () => {
      const resNull = calculateCountdown(null);
      assert.strictEqual(resNull.isExpired, true);
      assert.strictEqual(resNull.formatted, '00:00:00');

      const resUndef = calculateCountdown(undefined);
      assert.strictEqual(resUndef.isExpired, true);
    });

    test('T2.F1.1.2: Invalid non-date string returns expired countdown safely', () => {
      const res = calculateCountdown('not-a-real-date');
      assert.strictEqual(res.isExpired, true);
      assert.strictEqual(res.totalSeconds, 0);
    });

    test('T2.F1.1.3: Target date exactly equal to current timestamp evaluates to 0s expired', () => {
      const nowStr = '2026-08-20T12:00:00Z';
      const res = calculateCountdown(nowStr, nowStr);
      assert.strictEqual(res.isExpired, true);
      assert.strictEqual(res.totalSeconds, 0);
    });

    test('T2.F1.1.4: Milliseconds before deadline calculates remaining 1 second correctly', () => {
      const future = '2026-08-20T12:00:01Z';
      const now = '2026-08-20T12:00:00.500Z';
      const res = calculateCountdown(future, now);
      assert.strictEqual(res.isExpired, false);
      assert.strictEqual(res.seconds, 0); // floor of 0.5s is 0s
    });

    test('T2.F1.1.5: Banner with null config object safely returns isBannerVisible = false', () => {
      assert.strictEqual(isBannerVisible(null), false);
      assert.strictEqual(isBannerVisible(undefined), false);
      assert.strictEqual(isBannerVisible({}), false);
    });
  });

  runner.suite('Tier 2: Feature 1.2 - Lead Magnet Boundaries', (test) => {
    test('T2.F1.2.1: Lecture order 0 or negative values handle boundary without exceptions', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 0,
        isGuest: true,
        courseAccessPolicy: 'students_only',
      });
      assert.strictEqual(access.canAccess, false);
      assert.strictEqual(access.showConversionModal, true);
    });

    test('T2.F1.2.2: Extreme lecture order (e.g. 9999) correctly triggers conversion modal for guests', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 9999,
        isGuest: true,
        courseAccessPolicy: 'students_only',
      });
      assert.strictEqual(access.canAccess, false);
    });

    test('T2.F1.2.3: Null leadMagnetConfig defaults safely without throwing errors', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 1,
        isGuest: true,
        leadMagnetConfig: null,
        courseAccessPolicy: 'students_only',
      });
      assert.strictEqual(access.canAccess, false);
      assert.strictEqual(access.showConversionModal, true);
    });

    test('T2.F1.2.4: Unknown courseAccessPolicy falls back to strict lock for guests', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 2,
        isGuest: true,
        courseAccessPolicy: 'unknown_policy',
      });
      assert.strictEqual(access.canAccess, false);
    });

    test('T2.F1.2.5: Enrolled student with isGuest=false always has unrestricted access regardless of policy', () => {
      const access = evaluateLectureAccess({
        lectureOrder: 10,
        isGuest: false,
        isEnrolled: true,
        courseAccessPolicy: 'enrolled_only',
      });
      assert.strictEqual(access.canAccess, true);
      assert.strictEqual(access.showConversionModal, false);
    });
  });

  runner.suite('Tier 2: Feature 1.3 - Coupon & Discount Boundaries', (test) => {
    test('T2.F1.3.1: Empty, whitespace-only, or null coupon code returns valid=false', () => {
      assert.strictEqual(processCouponCode('').valid, false);
      assert.strictEqual(processCouponCode('   ').valid, false);
      assert.strictEqual(processCouponCode(null).valid, false);
      assert.strictEqual(processCouponCode(undefined).valid, false);
    });

    test('T2.F1.3.2: Non-string coupon input returns valid=false', () => {
      assert.strictEqual(processCouponCode(12345).valid, false);
      assert.strictEqual(processCouponCode({ code: 'DISCOUNT' }).valid, false);
    });

    test('T2.F1.3.3: Case-insensitive coupon matching normalizes lowercase input to uppercase', () => {
      const res = processCouponCode('pharmacore50');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.code, 'PHARMACORE50');
      assert.strictEqual(res.discountPercent, 50);
    });

    test('T2.F1.3.4: Unknown coupon code applies default discount rate safely', () => {
      const res = processCouponCode('WELCOME_STUDENT');
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.discountPercent, 10);
    });

    test('T2.F1.3.5: Extremely long coupon string (e.g. 200 chars) is processed safely without regex catastrophic backtracking', () => {
      const longCode = 'DISCOUNT_' + 'A'.repeat(200);
      const res = processCouponCode(longCode);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.code, longCode);
    });
  });

  runner.suite('Tier 2: Feature 1.4 - Admin CMS Config Boundaries', (test) => {
    test('T2.F1.4.1: Null or non-object CMS payload returns validation failure', () => {
      const res = validateMarketingConfigSchema(null);
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'object');
    });

    test('T2.F1.4.2: Missing enabled property fails validation', () => {
      const res = validateMarketingConfigSchema({ text_en: 'Sale' });
      assert.strictEqual(res.valid, false);
    });

    test('T2.F1.4.3: Non-string text_en or text_ar is rejected by validator', () => {
      const res = validateMarketingConfigSchema({ enabled: true, text_en: 12345 });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'text_en');
    });

    test('T2.F1.4.4: Non-string coupon_code in CMS update is rejected', () => {
      const res = validateMarketingConfigSchema({ enabled: true, coupon_code: ['CODE'] });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'coupon_code');
    });

    test('T2.F1.4.5: Multiple invalid fields aggregate all error messages simultaneously', () => {
      const res = validateMarketingConfigSchema({
        enabled: 'invalid',
        text_en: 99,
        target_date: 'bad-date',
      });
      assert.strictEqual(res.valid, false);
      assert.ok(res.errors.length >= 3);
    });
  });
}
