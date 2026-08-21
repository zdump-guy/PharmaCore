// ─── Database Entity Types ───────────────────────────────────────────────────

export type UserRole = 'dev' | 'super_admin' | 'mentor' | 'student';

export type StudentStatus = 'active' | 'pending' | 'suspended' | 'needs_setup';

export type DivisionTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone_number?: string | null;
  university?: string | null;
  faculty?: string | null;
  start_year?: number | null;
  predicted_end_year?: number | null;
  status?: StudentStatus;
  must_change_password?: boolean;
  role: UserRole;
  created_at: string;
  bio?: string | null;
  target_exam?: string | null;
  xp?: number;
  division?: DivisionTier;
}

export type CourseAccessPolicy = 'open' | 'students_only' | 'enrolled_only';

export type CourseCategory =
  | 'cardio'
  | 'antimicrobial'
  | 'cns'
  | 'endocrine'
  | 'renal'
  | 'clinical'
  | 'general';

export type CourseDifficulty = 'beginner' | 'intermediate' | 'advanced';

// ─── Feature Flags & Modular Activation ───────────────────────────────────────

export interface FeatureFlagsConfig {
  ai_assistant: boolean;
  practice_mode: boolean;
  certificates: boolean;
  community_qa: boolean;
  gradebook: boolean;
}

export interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string | null;
  description_ar: string | null;
  objectives_en: string | null;
  objectives_ar: string | null;
  prerequisites_en: string | null;
  prerequisites_ar: string | null;
  thumbnail_url: string | null;
  mentor_id: string | null;
  is_locked?: boolean;
  access_policy?: CourseAccessPolicy;
  feature_overrides?: Partial<FeatureFlagsConfig> | null;
  category?: CourseCategory;
  difficulty?: CourseDifficulty;
  estimated_hours?: number;
  is_preview?: boolean;
  badge_tag?: string;
  enrolled_count?: number;
  rating?: number;
  lectures_count?: number;
  quizzes_count?: number;
  created_at: string;
  mentor?: UserProfile;
}

export interface Lecture {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string;
  details_en: string | null;
  details_ar: string | null;
  youtube_url: string;
  order: number;
  duration_seconds?: number;
  is_preview?: boolean;
  created_at: string;
}

export type ResourceType = 'pdf' | 'image' | 'other';

export interface Resource {
  id: string;
  lecture_id: string;
  title_en: string;
  title_ar: string;
  url: string;
  type: ResourceType;
}

export type QuestionType = 'multiple_choice' | 'true_false' | 'short_text';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

export interface Quiz {
  id: string;
  title_en: string;
  title_ar: string;
  lecture_id: string | null;
  course_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  text_en: string;
  text_ar: string;
  type: QuestionType;
  options: string[] | null; // for MCQ / TF
  correct_answer: string;
  order: number;
  explanation_en?: string | null;
  explanation_ar?: string | null;
  clinical_reference?: string | null;
  difficulty?: QuestionDifficulty;
}

export interface CommunityQuestion {
  id: string;
  lecture_id: string;
  author_name: string;
  author_email?: string;
  text: string;
  created_at: string;
  answers?: CommunityAnswer[];
}

export interface CommunityAnswer {
  id: string;
  question_id: string;
  responder_id: string | null;
  text: string;
  created_at: string;
  responder?: UserProfile;
}

// ─── AI Clinical Assistant ───────────────────────────────────────────────────

export type AIConsultToolType =
  | 'general_consult'
  | 'dose_calculator'
  | 'interaction_checker'
  | 'lecture_qa'
  | 'custom';

export interface AIConsultPatientData {
  age?: number;
  weight_kg?: number;
  serum_creatinine_mg_dl?: number;
  gender?: 'male' | 'female';
  drug_a?: string;
  drug_b?: string;
  indication?: string;
  concomitant_drugs?: string[];
  allergies?: string[];
  [key: string]: unknown;
}

export interface AIConsultContext {
  lecture_id?: string;
  lecture_title?: string;
  objectives?: string[];
  patient_data?: AIConsultPatientData;
  [key: string]: unknown;
}

export interface AIConsultRequest {
  tool_type: AIConsultToolType;
  prompt: string;
  context?: AIConsultContext;
}

export interface AIConsultResponse {
  result: string;
  clinical_warnings?: string[];
  recommendations?: string[];
  references?: string[];
  calculations?: Record<string, unknown>;
  sources?: string[];
}

export interface AIConsultationRecord {
  id: string;
  user_id: string | null;
  lecture_id?: string | null;
  tool_type: AIConsultToolType | string;
  prompt: string;
  response: string;
  patient_context?: Record<string, unknown> | null;
  created_at: string;
}

// ─── Certificates & Gamification ─────────────────────────────────────────────

export type CertificateStatus = 'valid' | 'revoked';

export interface CertificateRecord {
  id: string;
  certificate_code: string;
  user_id: string;
  course_id: string;
  student_name: string;
  course_title_en: string;
  course_title_ar?: string | null;
  final_score: number;
  watch_completion_rate: number;
  status: CertificateStatus;
  issue_date: string;
  metadata?: Record<string, unknown> | null;
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  updated_at: string;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_type: string;
  awarded_at: string;
  metadata?: Record<string, unknown> | null;
}

// ─── Quiz Submissions & Lecture Progress (Gradebook Foundations) ─────────────

export interface QuizAnswerRecord {
  question_id: string;
  selected_answer: string;
  is_correct?: boolean;
  explanation_en?: string | null;
  explanation_ar?: string | null;
  clinical_reference?: string | null;
}

export interface QuizSubmission {
  id: string;
  user_id: string;
  quiz_id: string;
  course_id?: string | null;
  answers: Record<string, string> | QuizAnswerRecord[] | Record<string, unknown>;
  score: number;
  passed: boolean;
  is_practice?: boolean;
  submitted_at: string;
  quiz?: Quiz;
  course?: Course;
  user?: UserProfile;
}

export interface LectureProgress {
  id: string;
  user_id: string;
  lecture_id: string;
  course_id?: string | null;
  watched_seconds: number;
  duration_seconds: number;
  completed: boolean;
  last_watched_at: string;
  lecture?: Lecture;
  course?: Course;
}

// ─── Faculty Gradebook Matrix ────────────────────────────────────────────────

export interface GradebookQuizResult {
  quiz_id: string;
  quiz_title_en: string;
  quiz_title_ar?: string;
  score: number;
  passed: boolean;
  attempts_count?: number;
  last_submitted_at: string;
}

export interface GradebookLectureProgress {
  lecture_id: string;
  lecture_title_en: string;
  lecture_title_ar?: string;
  watched_seconds: number;
  duration_seconds: number;
  completed: boolean;
}

export interface GradebookEntry {
  user_id: string;
  student_name: string;
  email: string;
  university?: string | null;
  faculty?: string | null;
  course_id: string;
  course_title_en: string;
  total_lectures: number;
  completed_lectures: number;
  lecture_completion_rate: number;
  total_quizzes: number;
  completed_quizzes: number;
  average_quiz_score: number;
  certificate_issued: boolean;
  certificate_code?: string | null;
  last_active_at?: string | null;
  quiz_results?: GradebookQuizResult[];
  lecture_progress?: GradebookLectureProgress[];
}

// ─── University & Faculty Directory Types ────────────────────────────────────

export interface University {
  id: string;
  name_en: string;
  name_ar: string;
}

export interface Faculty {
  id: string;
  name_en: string;
  name_ar: string;
  duration_years: number; // e.g. 5 for PharmD
}

export type SignupMode = 'approval_required' | 'open_registration' | 'admin_provisioned';

export interface EnrollmentSettings {
  signup_mode: SignupMode;
  universities: University[];
  faculties: Faculty[];
}

// ─── Course Enrollment Types ──────────────────────────────────────────────────

export type CourseEnrollmentStatus = 'active' | 'pending' | 'rejected' | 'completed';

export interface CourseEnrollment {
  id: string;
  user_id: string;
  course_id: string;
  status: CourseEnrollmentStatus;
  enrolled_at: string;
  course?: Course;
  user?: UserProfile;
}

export interface EnrolledCourseProgress {
  enrollmentId: string;
  courseId: string;
  course: Course;
  status: CourseEnrollmentStatus;
  enrolledAt: string;
  totalLectures: number;
  completedLectures: number;
  progressPercent: number;
  totalQuizzes: number;
  completedQuizzes: number;
  lastActiveLectureId?: string | null;
  lastActiveLectureTitle?: string | null;
}

// ─── UI / Utility Types ───────────────────────────────────────────────────────

export type Locale = 'en' | 'ar';

export type Theme = 'light' | 'dark';

export interface AnalyticsEventRecord {
  id: string;
  event_name: string;
  properties: Record<string, unknown>;
  distinct_id?: string;
  user_id?: string | null;
  created_at: string;
}

// ─── PharmaCore Expansion Suite Types ─────────────────────────────────────────

// 1. Marketing Banner & Lead Magnet Engine
export interface MarketingBannerConfig {
  enabled: boolean;
  badge_en?: string;
  badge_ar?: string;
  text_en: string;
  text_ar: string;
  coupon_code?: string;
  target_date?: string; // ISO 8601 string e.g. "2026-09-01T00:00:00Z"
  cta_text_en?: string;
  cta_text_ar?: string;
  cta_url?: string;
}

export interface LeadMagnetConfig {
  enabled: boolean;
  preview_all_first_lectures: boolean;
  modal_title_en: string;
  modal_title_ar: string;
  modal_body_en: string;
  modal_body_ar: string;
}

// 2. Gamification & 5-Tier Division Leagues
export interface DivisionInfo {
  tier: DivisionTier;
  name_en: string;
  name_ar: string;
  minXp: number;
  nextTierMinXp: number | null;
  badgeColor: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  iconName: string;
}

export interface XpRulesConfig {
  lecture_completion_xp: number;
  quiz_pass_xp: number;
  quiz_perfect_bonus_xp: number;
  daily_challenge_xp: number;
  certificate_issued_xp: number;
  discussion_upvote_xp: number;
  division_thresholds: {
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    diamond: number;
  };
}

export type LeaderboardScope = 'global' | 'university' | 'course';
export type LeaderboardTimeframe = 'weekly' | 'all_time';

export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  avatar_url?: string | null;
  university?: string | null;
  faculty?: string | null;
  division: DivisionTier;
  total_xp: number;
  weekly_xp: number;
  streak_days: number;
  badges_count: number;
  certificates_count: number;
  course_id?: string | null;
  enrolled_courses?: string[];
  is_current_user?: boolean;
}

// 3. Daily Pharmacology Challenge ("Drug of the Day")
export interface DailyChallengeQuestion {
  id: string;
  date: string; // "YYYY-MM-DD"
  drug_name: string;
  drug_class: string;
  question_en: string;
  question_ar: string;
  options_en: string[];
  options_ar: string[];
  correct_index: number;
  rationale_en: string;
  rationale_ar: string;
  clinical_pearl_en?: string;
  clinical_pearl_ar?: string;
  reference?: string;
  xp_reward: number; // 25
}

export interface DailyChallengeSubmission {
  id: string;
  user_id: string;
  challenge_date: string;
  selected_index: number;
  is_correct: boolean;
  xp_awarded: number;
  submitted_at: string;
}

// 4. Classroom Discussions & Timestamped Notes
export type DiscussionCategory = 'clinical_qa' | 'mnemonics' | 'faculty_solutions' | 'general';
export type ClinicalNoteTag = 'pearl' | 'warning' | 'exam' | 'mechanism' | 'general';

export interface TimestampedClinicalNote {
  id: string;
  user_id: string;
  lecture_id: string;
  course_id?: string | null;
  lecture_title: string;
  timestamp_seconds: number;
  timestamp_formatted: string; // "MM:SS"
  note_text: string;
  tag: ClinicalNoteTag;
  created_at: string;
  updated_at: string;
}

export interface LectureNote {
  id: string;
  user_id: string;
  lecture_id: string;
  course_id?: string;
  timestamp_seconds: number;
  note_text: string;
  created_at: string;
  updated_at: string;
  lecture_title_en?: string;
  lecture_title_ar?: string;
}

export interface CourseDiscussionReply {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  author_avatar?: string | null;
  author_university?: string | null;
  content: string;
  is_faculty_solution: boolean;
  is_faculty_verified?: boolean;
  verifier_title?: string;
  upvotes_count: number;
  created_at: string;
  user_has_upvoted?: boolean;
}

export interface CourseDiscussionThread {
  id: string;
  course_id: string;
  lecture_id?: string | null;
  lecture_title?: string | null;
  author_id: string;
  author_name: string;
  author_role: UserRole;
  author_avatar?: string | null;
  author_university?: string | null;
  title: string;
  content: string;
  category: DiscussionCategory;
  tags: string[];
  upvotes_count: number;
  replies_count: number;
  has_faculty_solution: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at?: string;
  user_has_upvoted?: boolean;
  upvoted_user_ids?: string[];
  replies?: CourseDiscussionReply[];
}


