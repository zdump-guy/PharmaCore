/**
 * Feature Flag Matrix & Two-Tier Resolution Engine
 * Conforms to PROJECT.md § Interface Contracts and ORIGINAL_REQUEST § R1
 */

export const DEFAULT_FEATURE_FLAGS = {
  ai_assistant: true,
  practice_mode: true,
  certificates: true,
  community_qa: true,
  gradebook: true
};

export const ALL_FLAG_KEYS = Object.keys(DEFAULT_FEATURE_FLAGS);

/**
 * Resolves effective course feature flags given global settings and course-level overrides.
 * Two-tier resolution rule:
 * 1. Explicit course override (boolean) takes highest precedence.
 * 2. If course override is undefined/null for a key, fallback to global flag.
 * 3. If global flag is undefined/null, fallback to default value (true).
 *
 * @param {Object} [globalFlags] - Global feature flags from site_content.features
 * @param {Object} [courseOverrides] - Course-level overrides from courses.feature_overrides
 * @returns {Object} Full resolved FeatureFlagsConfig
 */
export function resolveCourseFeatures(globalFlags, courseOverrides) {
  const result = { ...DEFAULT_FEATURE_FLAGS };

  for (const key of ALL_FLAG_KEYS) {
    if (courseOverrides && courseOverrides[key] !== undefined && courseOverrides[key] !== null) {
      result[key] = Boolean(courseOverrides[key]);
    } else if (globalFlags && globalFlags[key] !== undefined && globalFlags[key] !== null) {
      result[key] = Boolean(globalFlags[key]);
    } else {
      result[key] = DEFAULT_FEATURE_FLAGS[key];
    }
  }

  return result;
}

/**
 * Validates a feature flags object schema
 * @param {any} flags
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateFeatureFlagsSchema(flags) {
  const errors = [];
  if (!flags || typeof flags !== 'object' || Array.isArray(flags)) {
    return { valid: false, errors: ['Flags must be a non-null object'] };
  }

  for (const [key, value] of Object.entries(flags)) {
    if (!ALL_FLAG_KEYS.includes(key)) {
      errors.push(`Unknown feature flag key: "${key}"`);
    } else if (typeof value !== 'boolean') {
      errors.push(`Feature flag "${key}" must be a boolean, got ${typeof value}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
