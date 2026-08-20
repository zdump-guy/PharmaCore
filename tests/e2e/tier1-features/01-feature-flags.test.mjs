/**
 * Tier 1 - Feature 1: Feature Flag Matrix & Modular Activation Engine
 * Verifies global feature flags and course-level overrides resolution.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  DEFAULT_FEATURE_FLAGS,
  resolveCourseFeatures,
  validateFeatureFlagsSchema
} from '../helpers/feature-flag-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 1 - Feature Flag Matrix', (test) => {
    test('T1.1.1: Global default flags initialization returns all 5 core flags as true', () => {
      const resolved = resolveCourseFeatures(undefined, undefined);
      assert.strictEqual(resolved.ai_assistant, true, 'ai_assistant should default to true');
      assert.strictEqual(resolved.practice_mode, true, 'practice_mode should default to true');
      assert.strictEqual(resolved.certificates, true, 'certificates should default to true');
      assert.strictEqual(resolved.community_qa, true, 'community_qa should default to true');
      assert.strictEqual(resolved.gradebook, true, 'gradebook should default to true');
    });

    test('T1.1.2: Global flags override changes resolution when no course override is present', () => {
      const globalFlags = {
        ai_assistant: false,
        practice_mode: true,
        certificates: false,
        community_qa: true,
        gradebook: true
      };
      const resolved = resolveCourseFeatures(globalFlags, null);
      assert.strictEqual(resolved.ai_assistant, false, 'ai_assistant should be false from global settings');
      assert.strictEqual(resolved.practice_mode, true, 'practice_mode should be true from global settings');
      assert.strictEqual(resolved.certificates, false, 'certificates should be false from global settings');
    });

    test('T1.1.3: Course-level override explicitly overrides global flag from true to false', () => {
      const globalFlags = {
        ai_assistant: true,
        practice_mode: true,
        certificates: true,
        community_qa: true,
        gradebook: true
      };
      const courseOverrides = {
        practice_mode: false
      };
      const resolved = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(resolved.practice_mode, false, 'practice_mode must be overridden to false for this course');
      assert.strictEqual(resolved.ai_assistant, true, 'ai_assistant remains true from global');
    });

    test('T1.1.4: Course-level override explicitly overrides global flag from false to true', () => {
      const globalFlags = {
        ai_assistant: false,
        practice_mode: false,
        certificates: true,
        community_qa: true,
        gradebook: true
      };
      const courseOverrides = {
        ai_assistant: true
      };
      const resolved = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(resolved.ai_assistant, true, 'ai_assistant must be overridden to true for this course');
      assert.strictEqual(resolved.practice_mode, false, 'practice_mode remains false from global');
    });

    test('T1.1.5: Partial course overrides merge correctly with partial global flags and defaults', () => {
      const globalFlags = {
        ai_assistant: false
      };
      const courseOverrides = {
        certificates: false
      };
      const resolved = resolveCourseFeatures(globalFlags, courseOverrides);
      assert.strictEqual(resolved.ai_assistant, false, 'ai_assistant from global');
      assert.strictEqual(resolved.certificates, false, 'certificates from course override');
      assert.strictEqual(resolved.practice_mode, true, 'practice_mode should fallback to default true');
      assert.strictEqual(resolved.community_qa, true, 'community_qa should fallback to default true');
      assert.strictEqual(resolved.gradebook, true, 'gradebook should fallback to default true');
    });

    test('T1.1.6: Schema validation validates types and rejects unknown flag keys', () => {
      const validFlags = { ai_assistant: true, practice_mode: false };
      const validResult = validateFeatureFlagsSchema(validFlags);
      assert.strictEqual(validResult.valid, true);

      const invalidFlags = { unknown_module: true, ai_assistant: 'yes' };
      const invalidResult = validateFeatureFlagsSchema(invalidFlags);
      assert.strictEqual(invalidResult.valid, false);
      assert.strictEqual(invalidResult.errors.length, 2);
    });
  });
}
