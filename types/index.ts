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
