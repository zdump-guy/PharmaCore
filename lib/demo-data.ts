import type { CommunityQuestion, Course, Lecture, Question, Quiz, Resource } from "@/types"

export const demoCourses: Course[] = [
  { id: "demo-pharmacology", title_en: "Foundations of Pharmacology", title_ar: "أساسيات علم الأدوية", description_en: "Build a durable understanding of drug action, dosage, and safe clinical decision-making.", description_ar: "ابنِ فهمًا راسخًا لعمل الدواء والجرعات واتخاذ القرارات السريرية الآمنة.", objectives_en: "Understand pharmacokinetics, pharmacodynamics, dose-response relationships, and medication safety.", objectives_ar: "فهم الحرائك والديناميكا الدوائية وعلاقة الجرعة بالاستجابة وسلامة الدواء.", prerequisites_en: "Basic physiology and biochemistry.", prerequisites_ar: "مبادئ علم وظائف الأعضاء والكيمياء الحيوية.", thumbnail_url: null, mentor_id: null, created_at: "2026-08-01T00:00:00Z" },
  { id: "demo-clinical", title_en: "Clinical Pharmacy Practice", title_ar: "ممارسة الصيدلة الإكلينيكية", description_en: "Translate pharmaceutical knowledge into confident patient-centered care.", description_ar: "حوّل المعرفة الصيدلانية إلى رعاية واثقة تتمحور حول المريض.", objectives_en: "Review prescriptions, identify interactions, and communicate clinical recommendations.", objectives_ar: "مراجعة الوصفات وتحديد التداخلات وصياغة التوصيات السريرية.", prerequisites_en: "Foundations of Pharmacology.", prerequisites_ar: "أساسيات علم الأدوية.", thumbnail_url: null, mentor_id: null, created_at: "2026-08-02T00:00:00Z" },
  { id: "demo-medicinal", title_en: "Medicinal Chemistry Essentials", title_ar: "أساسيات الكيمياء الدوائية", description_en: "See how molecular structure shapes drug activity, selectivity, and metabolism.", description_ar: "اكتشف كيف يحدد التركيب الجزيئي نشاط الدواء وانتقائيته واستقلابه.", objectives_en: "Connect chemical structure with therapeutic action and metabolism.", objectives_ar: "ربط التركيب الكيميائي بالتأثير العلاجي والاستقلاب.", prerequisites_en: "Organic chemistry fundamentals.", prerequisites_ar: "مبادئ الكيمياء العضوية.", thumbnail_url: null, mentor_id: null, created_at: "2026-08-03T00:00:00Z" },
]

export const demoLectures: Lecture[] = [
  { id: "demo-lecture", course_id: "demo-pharmacology", title_en: "How medicines move through the body", title_ar: "كيف تتحرك الأدوية داخل الجسم", details_en: "A practical introduction to absorption, distribution, metabolism, and excretion.", details_ar: "مقدمة عملية للامتصاص والتوزيع والاستقلاب والإخراج.", youtube_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", order: 1, created_at: "2026-08-01T00:00:00Z" },
  { id: "demo-lecture-2", course_id: "demo-pharmacology", title_en: "Receptors and dose response", title_ar: "المستقبلات والاستجابة للجرعة", details_en: "Read dose-response curves and compare potency with efficacy.", details_ar: "قراءة منحنيات الجرعة والاستجابة ومقارنة القوة بالفعالية.", youtube_url: "", order: 2, created_at: "2026-08-02T00:00:00Z" },
  { id: "demo-lecture-3", course_id: "demo-pharmacology", title_en: "Medication safety essentials", title_ar: "أساسيات سلامة الدواء", details_en: "Prevent common medication errors with a repeatable checking workflow.", details_ar: "تجنب أخطاء الدواء الشائعة بخطوات مراجعة قابلة للتكرار.", youtube_url: "", order: 3, created_at: "2026-08-03T00:00:00Z" },
]

export const demoResources: Resource[] = [
  { id: "res-1", lecture_id: "demo-lecture", title_en: "Lecture summary", title_ar: "ملخص المحاضرة", url: "#", type: "pdf" },
  { id: "res-2", lecture_id: "demo-lecture", title_en: "ADME visual map", title_ar: "خريطة ADME المرئية", url: "#", type: "image" },
]

export const demoQuizzes: Quiz[] = [
  { id: "demo-quiz", title_en: "Pharmacokinetics checkpoint", title_ar: "اختبار الحرائك الدوائية", lecture_id: "demo-lecture", course_id: "demo-pharmacology", created_by: "demo", created_at: "2026-08-01T00:00:00Z" },
]

export const demoQuestions: CommunityQuestion[] = [
  { id: "qa-1", lecture_id: "demo-lecture", author_name: "Mariam", author_email: "student@example.com", text: "How does first-pass metabolism affect oral bioavailability?", created_at: "2026-08-12T10:00:00Z", answers: [{ id: "answer-1", question_id: "qa-1", responder_id: "mentor", text: "It can reduce the amount of active drug reaching systemic circulation before distribution.", created_at: "2026-08-12T12:00:00Z", responder: { id: "mentor", email: "mentor@example.com", full_name: "Dr. Ahmed", role: "mentor", created_at: "2026-01-01T00:00:00Z" } }] },
]

export const demoQuizQuestions: Question[] = [
  { id: "quiz-q1", quiz_id: "demo-quiz", text_en: "Which process describes movement of a drug from its administration site into blood?", text_ar: "ما العملية التي تصف انتقال الدواء من موقع إعطائه إلى الدم؟", type: "multiple_choice", options: ["Absorption", "Distribution", "Metabolism", "Excretion"], correct_answer: "Absorption", order: 1 },
  { id: "quiz-q2", quiz_id: "demo-quiz", text_en: "The liver is a major site of drug metabolism.", text_ar: "الكبد موقع رئيسي لاستقلاب الدواء.", type: "true_false", options: ["True", "False"], correct_answer: "True", order: 2 },
  { id: "quiz-q3", quiz_id: "demo-quiz", text_en: "What does the acronym ADME stand for?", text_ar: "إلى ماذا يشير الاختصار ADME؟", type: "short_text", options: null, correct_answer: "Absorption Distribution Metabolism Excretion", order: 3 },
]
