import type { FeatureFlagsConfig } from "@/types"

/**
 * Default platform feature flags.
 * All core capabilities are enabled by default across the platform.
 */
export const defaultFeatureFlags: FeatureFlagsConfig = {
  ai_assistant: true,
  practice_mode: true,
  certificates: true,
  community_qa: true,
  gradebook: true,
}

/**
 * Array of all supported feature flag keys for iteration, validation, and testing.
 */
export const FEATURE_FLAG_KEYS: Array<keyof FeatureFlagsConfig> = [
  "ai_assistant",
  "practice_mode",
  "certificates",
  "community_qa",
  "gradebook",
]

export interface FeatureFlagMeta {
  key: keyof FeatureFlagsConfig
  title_en: string
  title_ar: string
  description_en: string
  description_ar: string
  category: "ai" | "assessment" | "gamification" | "collaboration" | "analytics"
}

export const FEATURE_FLAG_DEFINITIONS: FeatureFlagMeta[] = [
  {
    key: "ai_assistant",
    title_en: "AI Clinical Pharmacology Assistant",
    title_ar: "المساعد الإكلينيكي الذكي لعلم الأدوية",
    description_en:
      "Context-aware lecture side drawer, renal & pediatric dose calculators, and drug-drug interaction checkers.",
    description_ar:
      "مساعد ذكي سياقي داخل المحاضرات، حاسبات الجرعات الكلوية وطب الأطفال، وفاحص التفاعلات الدوائية.",
    category: "ai",
  },
  {
    key: "practice_mode",
    title_en: "Practice Mode & Instant Clinical Rationales",
    title_ar: "وضع التدريب والتعليلات السريرية الفورية",
    description_en:
      "Untimed practice mode in quizzes revealing immediate feedback, bilingual rationales, and textbook citations.",
    description_ar:
      "وضع تدريبي غير محدد بوقت مع كشف فوري للتعليلات السريرية ثنائية اللغة ومراجع الكتب المعتمدة.",
    category: "assessment",
  },
  {
    key: "certificates",
    title_en: "Verifiable Certificates & Learning Streaks",
    title_ar: "الشهادات المعتمدة وأيام التعلم المتتالية",
    description_en:
      "Automated QR-verifiable PDF certificates upon course mastery, student study streaks, and achievement badges.",
    description_ar:
      "إصدار تلقائي للشهادات المعتمدة برمز QR عند إتقان المقرر، وتتبع أيام التعلم المتتالية وأوسمة الإنجاز.",
    category: "gamification",
  },
  {
    key: "community_qa",
    title_en: "Peer & Mentor Community Q&A",
    title_ar: "مجتمع النقاش والأسئلة مع المشرفين والزملاء",
    description_en:
      "Interactive Q&A discussion thread below every lecture for asking questions and receiving mentor feedback.",
    description_ar:
      "مساحة تفاعلية أسفل كل محاضرة لطرح الأسئلة ومناقشة الحالات السريرية مع المشرفين والزملاء.",
    category: "collaboration",
  },
  {
    key: "gradebook",
    title_en: "Faculty Gradebook & Performance Analytics",
    title_ar: "سجل الدرجات وتحليلات الأداء لهيئة التدريس",
    description_en:
      "Student-by-student lecture completion progress, itemized quiz matrix, cohort filters, and CSV export.",
    description_ar:
      "مصفوفة أداء تفصيلية للطلاب، نسب استكمال المحاضرات، فلاتر الدفعات والكليات، وتصدير التقارير بصيغة CSV.",
    category: "analytics",
  },
]

/**
 * Resolves the effective feature flags for a given course or scope by combining
 * global settings with course-level overrides and falling back to platform defaults.
 *
 * Precedence:
 * 1. `courseOverrides[feature]` (if explicitly boolean `true` or `false`)
 * 2. `globalFlags[feature]` (if defined)
 * 3. `defaultFeatureFlags[feature]` (`true` for all defaults)
 *
 * @param globalFlags Global platform feature flags from `site_content.features`
 * @param courseOverrides Optional course-level overrides from `courses.feature_overrides`
 * @returns Fully resolved `FeatureFlagsConfig` object
 */
export function resolveCourseFeatures(
  globalFlags?: Partial<FeatureFlagsConfig> | null,
  courseOverrides?: Partial<FeatureFlagsConfig> | null
): FeatureFlagsConfig {
  const globalBase: FeatureFlagsConfig = {
    ai_assistant:
      typeof globalFlags?.ai_assistant === "boolean"
        ? globalFlags.ai_assistant
        : defaultFeatureFlags.ai_assistant,
    practice_mode:
      typeof globalFlags?.practice_mode === "boolean"
        ? globalFlags.practice_mode
        : defaultFeatureFlags.practice_mode,
    certificates:
      typeof globalFlags?.certificates === "boolean"
        ? globalFlags.certificates
        : defaultFeatureFlags.certificates,
    community_qa:
      typeof globalFlags?.community_qa === "boolean"
        ? globalFlags.community_qa
        : defaultFeatureFlags.community_qa,
    gradebook:
      typeof globalFlags?.gradebook === "boolean"
        ? globalFlags.gradebook
        : defaultFeatureFlags.gradebook,
  }

  if (!courseOverrides) {
    return globalBase
  }

  return {
    ai_assistant:
      typeof courseOverrides.ai_assistant === "boolean"
        ? courseOverrides.ai_assistant
        : globalBase.ai_assistant,
    practice_mode:
      typeof courseOverrides.practice_mode === "boolean"
        ? courseOverrides.practice_mode
        : globalBase.practice_mode,
    certificates:
      typeof courseOverrides.certificates === "boolean"
        ? courseOverrides.certificates
        : globalBase.certificates,
    community_qa:
      typeof courseOverrides.community_qa === "boolean"
        ? courseOverrides.community_qa
        : globalBase.community_qa,
    gradebook:
      typeof courseOverrides.gradebook === "boolean"
        ? courseOverrides.gradebook
        : globalBase.gradebook,
  }
}

/**
 * Checks if a single feature flag is active for a given course or global context.
 *
 * @param feature The feature flag key to check
 * @param globalFlags Optional global flags
 * @param courseOverrides Optional course overrides
 * @returns boolean indicating whether the feature is enabled
 */
export function isFeatureEnabled(
  feature: keyof FeatureFlagsConfig,
  globalFlags?: Partial<FeatureFlagsConfig> | null,
  courseOverrides?: Partial<FeatureFlagsConfig> | null
): boolean {
  const resolved = resolveCourseFeatures(globalFlags, courseOverrides)
  return Boolean(resolved[feature])
}
