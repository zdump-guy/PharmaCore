import type { Course, CourseCategory, CourseDifficulty } from "@/types"

export interface EnrichedCourse extends Course {
  lectures_count?: number
  quizzes_count?: number
  enrolled_count?: number
  rating?: number
  reviews_count?: number
}

export const CATEGORY_DEFINITIONS: {
  id: CourseCategory | "all"
  label_en: string
  label_ar: string
  iconName: string
  color: string
}[] = [
  { id: "all", label_en: "All Specialties", label_ar: "كافة التخصصات", iconName: "Layers", color: "from-primary/20 to-teal-500/20" },
  { id: "cardio", label_en: "Cardiovascular", label_ar: "القلب والأوعية", iconName: "Heart", color: "from-rose-500/20 to-pink-500/20" },
  { id: "antimicrobial", label_en: "Antimicrobial & ID", label_ar: "المضادات الحيوية والعدوى", iconName: "Shield", color: "from-amber-500/20 to-orange-500/20" },
  { id: "cns", label_en: "CNS & Neuro", label_ar: "الأعصاب والنفسية", iconName: "Zap", color: "from-purple-500/20 to-indigo-500/20" },
  { id: "endocrine", label_en: "Endocrine & Diabetes", label_ar: "الغدد والسكري", iconName: "Activity", color: "from-emerald-500/20 to-teal-500/20" },
  { id: "renal", label_en: "Renal & Critical Care", label_ar: "الكلى والعناية الحرجة", iconName: "Cpu", color: "from-blue-500/20 to-cyan-500/20" },
  { id: "clinical", label_en: "Clinical & TDM", label_ar: "الممارسة الإكلينيكية و TDM", iconName: "Clipboard", color: "from-teal-500/20 to-emerald-500/20" },
]

export const DIFFICULTY_DEFINITIONS: {
  id: CourseDifficulty | "all"
  label_en: string
  label_ar: string
  badgeClass: string
}[] = [
  { id: "all", label_en: "All Levels", label_ar: "جميع المستويات", badgeClass: "bg-muted text-foreground" },
  { id: "beginner", label_en: "Core / Beginner", label_ar: "أساسي", badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { id: "intermediate", label_en: "Intermediate", label_ar: "متوسط", badgeClass: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "advanced", label_en: "Clinical Specialist", label_ar: "متقدم / تخصصي", badgeClass: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30" },
]

export const FALLBACK_COURSES: EnrichedCourse[] = []
