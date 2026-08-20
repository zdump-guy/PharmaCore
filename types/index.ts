// ─── Database Entity Types ───────────────────────────────────────────────────

export type UserRole = 'dev' | 'super_admin' | 'mentor' | 'student';

export type StudentStatus = 'active' | 'pending' | 'suspended' | 'needs_setup';

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
}

export type CourseAccessPolicy = 'open' | 'students_only' | 'enrolled_only';

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
