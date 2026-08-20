/**
 * Tier 2 - Feature 1: Feature Flag Matrix Boundary & Corner Cases
 * Tests edge cases: null/undefined, empty objects, type coercion, immutability.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  DEFAULT_FEATURE_FLAGS,
  resolveCourseFeatures,
  validateFeatureFlagsSchema
} from '../helpers/feature-flag-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 1 - Feature Flags Boundaries', (test) => {
    test('T2.1.1: Null and undefined inputs for global and course flags fallback cleanly', () => {
      const res1 = resolveCourseFeatures(null, null);
      assert.deepStrictEqual(res1, DEFAULT_FEATURE_FLAGS);

      const res2 = resolveCourseFeatures(undefined, null);
      assert.deepStrictEqual(res2, DEFAULT_FEATURE_FLAGS);
    });

    test('T2.1.2: Empty object inputs for flags return all defaults', () => {
      const res = resolveCourseFeatures({}, {});
      assert.deepStrictEqual(res, DEFAULT_FEATURE_FLAGS);
    });

    test('T2.1.3: Falsy and truthy non-boolean values in overrides are safely coerced to boolean', () => {
      const overrides = {
        ai_assistant: 0,
        practice_mode: 1,
        certificates: ''
      };
      const res = resolveCourseFeatures(undefined, overrides);
      assert.strictEqual(res.ai_assistant, false);
      assert.strictEqual(res.practice_mode, true);
      assert.strictEqual(res.certificates, false);
    });

    test('T2.1.4: Explicit null value in courseOverrides falls back to global flag', () => {
      const globalFlags = { ai_assistant: true, practice_mode: false };
      const courseOverrides = { ai_assistant: null, practice_mode: null };
      const res = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(res.ai_assistant, true);
      assert.strictEqual(res.practice_mode, false);
    });

    test('T2.1.5: Extra unrecognized properties do not leak into resolved config', () => {
      const globalFlags = { ai_assistant: true, rogue_key: 'malicious' };
      const courseOverrides = { injection_flag: true };
      const res = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(res.rogue_key, undefined);
      assert.strictEqual(res.injection_flag, undefined);
      assert.strictEqual(Object.keys(res).length, 5);
    });

    test('T2.1.6: Mutating resolved object does not affect DEFAULT_FEATURE_FLAGS constant', () => {
      const res = resolveCourseFeatures(undefined, undefined);
      res.ai_assistant = false;
      assert.strictEqual(DEFAULT_FEATURE_FLAGS.ai_assistant, true, 'DEFAULT_FEATURE_FLAGS must remain immutable');
    });
  });
}
