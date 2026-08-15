// ─── Database Entity Types ───────────────────────────────────────────────────

export type UserRole = 'dev' | 'super_admin' | 'mentor';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: string;
  title_en: string;
  title_ar: string;
  description_en: string;
  description_ar: string;
  objectives_en: string;
  objectives_ar: string;
  prerequisites_en: string;
  prerequisites_ar: string;
  thumbnail_url: string | null;
  mentor_id: string | null;
  created_at: string;
  mentor?: UserProfile;
}

export interface Lecture {
  id: string;
  course_id: string;
  title_en: string;
  title_ar: string;
  details_en: string;
  details_ar: string;
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
  created_by: string;
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
  author_email: string;
  text: string;
  created_at: string;
  answers?: CommunityAnswer[];
}

export interface CommunityAnswer {
  id: string;
  question_id: string;
  responder_id: string;
  text: string;
  created_at: string;
  responder?: UserProfile;
}

// ─── UI / Utility Types ───────────────────────────────────────────────────────

export type Locale = 'en' | 'ar';

export type Theme = 'light' | 'dark';
