/**
 * Course Catalog & Grid/List Engine for PharmaCore Expansion Suite Tests
 * Implements opaque-box models for `/courses` catalog filtering, search,
 * sorting, switchable views, and course card metrics.
 */

export const MOCK_COURSES = [
  {
    id: 'c-cardio-101',
    title_en: 'Cardiovascular Pharmacology Masterclass',
    title_ar: 'ماستر كلاس فارماكولوجي القلب والأوعية الدموية',
    description_en: 'Comprehensive breakdown of antihypertensives, antiarrhythmics, and heart failure drugs.',
    description_ar: 'شرح شامل لأدوية ضغط الدم ومثبطات اضطراب نظم القلب وأدوية فشل عضلة القلب.',
    category: 'cardiology',
    difficulty: 'intermediate',
    duration_minutes: 180,
    total_lectures: 12,
    total_quizzes: 4,
    enrolled_students: 1240,
    is_featured: true,
    promo_badge: 'High Yield',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'c-anti-201',
    title_en: 'Antimicrobial Stewardship & Antibiotics',
    title_ar: 'الإشراف على مضادات الميكروبات والمضادات الحيوية',
    description_en: 'Mechanism of action, resistance profiles, and empiric antibiotic therapy guidelines.',
    description_ar: 'آليات العمل، ملفات المقاومة البكتيرية، وإرشادات العلاج التجريبي بالمضادات الحيوية.',
    category: 'antimicrobial',
    difficulty: 'advanced',
    duration_minutes: 240,
    total_lectures: 16,
    total_quizzes: 6,
    enrolled_students: 2150,
    is_featured: true,
    promo_badge: 'Best Seller',
    created_at: '2026-02-01T12:00:00Z',
  },
  {
    id: 'c-intro-001',
    title_en: 'Foundations of Clinical Pharmacokinetics',
    title_ar: 'أسس الحركية الدوائية الإكلينيكية',
    description_en: 'Absorption, distribution, metabolism, elimination, and clearance equations for PharmD.',
    description_ar: 'الامتصاص والتوزيع والأيض والإخراج ومعادلات التصفية لطلاب دكتور صيدلي.',
    category: 'foundations',
    difficulty: 'beginner',
    duration_minutes: 90,
    total_lectures: 6,
    total_quizzes: 2,
    enrolled_students: 850,
    is_featured: false,
    promo_badge: 'New',
    created_at: '2026-03-15T08:00:00Z',
  },
  {
    id: 'c-neuro-301',
    title_en: 'Neuropharmacology & Psychotropics',
    title_ar: 'علم الأدوية العصبية والمؤثرات العقلية',
    description_en: 'Antidepressants, antipsychotics, anxiolytics, and epilepsy therapeutic regimens.',
    description_ar: 'مضادات الاكتئاب والذهان ومهدئات القلق وأدوية الصرع والاضطرابات العصبية.',
    category: 'neuroscience',
    difficulty: 'advanced',
    duration_minutes: 210,
    total_lectures: 14,
    total_quizzes: 5,
    enrolled_students: 980,
    is_featured: false,
    promo_badge: null,
    created_at: '2026-02-20T14:00:00Z',
  },
  {
    id: 'c-endo-102',
    title_en: 'Endocrine & Metabolic Pharmacology',
    title_ar: 'أدوية الغدد الصماء والتمثيل الغذائي',
    description_en: 'Insulins, GLP-1 agonists, SGLT-2 inhibitors, thyroid hormones, and steroids.',
    description_ar: 'الإنسولين ومحفزات GLP-1 ومثبطات SGLT-2 وهرمونات الغدة الدرقية والستيرويدات.',
    category: 'endocrine',
    difficulty: 'intermediate',
    duration_minutes: 150,
    total_lectures: 10,
    total_quizzes: 3,
    enrolled_students: 1420,
    is_featured: true,
    promo_badge: 'High Yield',
    created_at: '2026-03-01T09:00:00Z',
  },
];

/**
 * Filter and sort courses in catalog
 */
export function filterAndSortCourses({
  courses = MOCK_COURSES,
  category = 'all',
  difficulty = 'all',
  searchQuery = '',
  sortBy = 'newest',
}) {
  let result = [...courses];

  // Category filter
  if (category && category !== 'all') {
    result = result.filter((c) => c.category === category);
  }

  // Difficulty filter
  if (difficulty && difficulty !== 'all') {
    result = result.filter((c) => c.difficulty === difficulty);
  }

  // Search query (English & Arabic support, case-insensitive)
  if (searchQuery && typeof searchQuery === 'string' && searchQuery.trim().length > 0) {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter((c) => {
      const matchTitleEn = c.title_en?.toLowerCase().includes(q);
      const matchTitleAr = c.title_ar?.includes(q);
      const matchDescEn = c.description_en?.toLowerCase().includes(q);
      const matchDescAr = c.description_ar?.includes(q);
      const matchBadge = c.promo_badge?.toLowerCase().includes(q);
      return matchTitleEn || matchTitleAr || matchDescEn || matchDescAr || matchBadge;
    });
  }

  // Sorting
  result.sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case 'oldest':
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case 'title_asc':
        return a.title_en.localeCompare(b.title_en);
      case 'title_desc':
        return b.title_en.localeCompare(a.title_en);
      case 'popular':
        return (b.enrolled_students || 0) - (a.enrolled_students || 0);
      case 'duration':
        return (b.duration_minutes || 0) - (a.duration_minutes || 0);
      default:
        return 0;
    }
  });

  return result;
}

/**
 * Switchable View Mode Controller
 */
export function resolveCatalogViewMode(requestedMode = null, savedMode = null) {
  const validModes = ['grid', 'list'];
  if (requestedMode && validModes.includes(requestedMode)) {
    return requestedMode;
  }
  if (savedMode && validModes.includes(savedMode)) {
    return savedMode;
  }
  return 'grid';
}

/**
 * Formats duration from minutes to human-readable string
 */
export function formatDuration(minutes) {
  if (typeof minutes !== 'number' || isNaN(minutes) || minutes <= 0) {
    return '0m';
  }
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;
  if (hours > 0 && remainingMins > 0) {
    return `${hours}h ${remainingMins}m`;
  }
  if (hours > 0) {
    return `${hours}h`;
  }
  return `${remainingMins}m`;
}

/**
 * Calculates card presentation metrics including enrollment progress
 */
export function computeCourseCardMetrics(course, userEnrollment = null) {
  if (!course) return null;

  const isEnrolled = !!userEnrollment;
  const progressPercent = userEnrollment ? Math.min(100, Math.max(0, userEnrollment.progressPercent || 0)) : 0;
  const isCompleted = isEnrolled && progressPercent >= 100;

  let primaryAction = 'enroll';
  let primaryLabelEn = 'Enroll Now';
  let primaryLabelAr = 'سجل الآن';

  if (isCompleted) {
    primaryAction = 'review';
    primaryLabelEn = 'Review Course';
    primaryLabelAr = 'مراجعة المقرر';
  } else if (isEnrolled) {
    primaryAction = 'continue';
    primaryLabelEn = 'Continue Learning';
    primaryLabelAr = 'متابعة التعلم';
  }

  return {
    courseId: course.id,
    formattedDuration: formatDuration(course.duration_minutes),
    quizCountLabel: `${course.total_quizzes} ${course.total_quizzes === 1 ? 'Quiz' : 'Quizzes'}`,
    lectureCountLabel: `${course.total_lectures} ${course.total_lectures === 1 ? 'Lecture' : 'Lectures'}`,
    isEnrolled,
    progressPercent,
    isCompleted,
    primaryAction,
    primaryLabelEn,
    primaryLabelAr,
    promoBadge: course.promo_badge || null,
  };
}
