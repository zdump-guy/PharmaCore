export interface DailyChallengeQuestion {
  id: string
  drug_name: string
  drug_class: string
  question_en: string
  question_ar: string
  options_en: string[]
  options_ar: string[]
  correct_index: number
  rationale_en: string
  rationale_ar: string
  clinical_pearl_en?: string
  clinical_pearl_ar?: string
  reference?: string
  xp_reward: number
}

export const DAILY_CHALLENGE_BANK: DailyChallengeQuestion[] = [
  {
    id: "dc-001",
    drug_name: "Dapagliflozin",
    drug_class: "SGLT-2 Inhibitor",
    question_en:
      "A 58-year-old patient with type 2 diabetes and heart failure with reduced ejection fraction (HFrEF) is initiated on Dapagliflozin. What is the primary renal mechanism responsible for its cardioprotective and glucosuric effects?",
    question_ar:
      "مريض يبلغ من العمر 58 عامًا يعاني من داء السكري النوع الثاني وفشل القلب مع انخفاض الكسر القذفي (HFrEF) وبدأ في تناول داباجليفلوزين. ما هي الآلية الكلوية الرئيسية المسؤولة عن آثاره الوقائية للقلب وإفراز الجلوكوز في البول؟",
    options_en: [
      "Inhibition of sodium-glucose cotransporter 2 in the proximal convoluted tubule",
      "Blockade of aldosterone receptors in the cortical collecting duct",
      "Inhibition of the Na+/K+/2Cl- cotransporter in the thick ascending limb",
      "Agonism of GLP-1 receptors in the pancreatic beta cells",
    ],
    options_ar: [
      "تثبيط الناقل المشارك للصوديوم والجلوكوز 2 في الأنبوب الملتف القريب",
      "حصر مستقبلات الألدوستيرون في القناة الجامعة القشرية",
      "تثبيط الناقل المشارك Na+/K+/2Cl- في الجزء الصاعد السميك لعروة هنلي",
      "تحفيز مستقبلات GLP-1 في خلايا بيتا البنكرياسية",
    ],
    correct_index: 0,
    rationale_en:
      "SGLT-2 inhibitors selectively inhibit sodium-glucose cotransporter 2 located in the S1 segment of the proximal renal tubule, reducing renal glucose reabsorption, inducing osmotic diuresis, reducing cardiac preload/afterload, and decreasing intraglomerular pressure.",
    rationale_ar:
      "تعمل مثبطات SGLT-2 على تثبيط الناقل المشارك للصوديوم والجلوكوز 2 في الجزء الأول من الأنبوب الملتف القريب، مما يقلل إعادة امتصاص الجلوكوز، ويحدث إدرارًا تناضحيًا، ويقلل الحمل القبلي والبعدي على القلب ويحمي الكلى.",
    clinical_pearl_en:
      "SGLT2 inhibitors reduce cardiovascular death and heart failure hospitalizations regardless of the presence of diabetes.",
    clinical_pearl_ar:
      "تقلل مثبطات SGLT2 من وفيات القلب والأوعية الدموية ودخول المستشفى بسبب فشل القلب بغض النظر عن وجود مرض السكري.",
    reference: "2023 ADA & ACC/AHA Heart Failure Guidelines",
    xp_reward: 25,
  },
  {
    id: "dc-002",
    drug_name: "Sacubitril / Valsartan",
    drug_class: "ARNI (Angiotensin Receptor-Neprilysin Inhibitor)",
    question_en:
      "When switching a patient from an ACE inhibitor (e.g., Enalapril) to Sacubitril/Valsartan, how long of a mandatory washout period is required to prevent life-threatening angioedema?",
    question_ar:
      "عند تحويل مريض من مثبطات الإنزيم المحول للأنجيوتنسين (مثل إنالابريل) إلى ساكوبيتريل/فالسارتان، ما هي فترة التوقف الإلزامية المطلوبة لتجنب الوذمة الوعائية المهددة للحياة؟",
    options_en: [
      "12 hours",
      "24 hours",
      "36 hours",
      "72 hours",
    ],
    options_ar: [
      "12 ساعة",
      "24 ساعة",
      "36 ساعة",
      "72 ساعة",
    ],
    correct_index: 2,
    rationale_en:
      "Both ACE inhibitors and Neprilysin inhibitors degrade bradykinin. Concurrent use or inadequate washout (<36 hours) leads to marked accumulation of bradykinin and high risk of fatal angioedema.",
    rationale_ar:
      "يقوم كل من مثبط الإنزيم المحول ومثبط النيبريليسين بتكسير مادة البراديكينين. الاستخدام المتزامن أو فترة غسيل غير كافية (<36 ساعة) يسبب تراكم البراديكينين وخطر الوذمة الوعائية القاتلة.",
    clinical_pearl_en:
      "No washout period is required when switching between an ARB and an ARNI.",
    clinical_pearl_ar:
      "لا يلزم فترة غسيل عند التحويل بين حاصرات مستقبلات الأنجيوتنسين (ARB) ومركب ARNI.",
    reference: "PARADIGM-HF Trial & FDA Package Insert",
    xp_reward: 25,
  },
  {
    id: "dc-003",
    drug_name: "Apixaban",
    drug_class: "DOAC (Direct Oral Anticoagulant - Factor Xa Inhibitor)",
    question_en:
      "Which specific reversal agent is FDA-approved for life-threatening bleeding associated with Apixaban and Rivaroxaban?",
    question_ar:
      "ما هو المضاد النوعي (Reversal Agent) المعتمد من هيئة الغذاء والدواء الأمريكية لعلاج النزيف الحاد المهدد للحياة المرتبط بالأبيكسابان وريفاروكسابان؟",
    options_en: [
      "Idarucizumab",
      "Andexanet alfa",
      "Protamine sulfate",
      "Vitamin K (Phytonadione)",
    ],
    options_ar: [
      "إيداروسيزوماب",
      "أنديكسانت ألفا",
      "كبريتات البروتامين",
      "فيتامين ك (فيتوناديون)",
    ],
    correct_index: 1,
    rationale_en:
      "Andexanet alfa is a recombinant modified human Factor Xa decoy protein that binds and sequesters direct Factor Xa inhibitors (Apixaban and Rivaroxaban). Idarucizumab is specific to Dabigatran.",
    rationale_ar:
      "أنديكسانت ألفا هو بروتين بشري معدل يعمل كطعم لعامل التخثر Xa ويرتبط بمثبطات العامل Xa المباشرة. أما إيداروسيزوماب فهو مخصص للدابيغاتران.",
    clinical_pearl_en:
      "Andexanet alfa neutralizes anti-FXa activity within minutes of IV bolus infusion.",
    clinical_pearl_ar:
      "يبطل أنديكسانت ألفا نشاط مضاد العامل Xa في غضون دقائق من الحقن الوريدي.",
    reference: "ANNEXA-4 Study",
    xp_reward: 25,
  },
]

export function getDailyChallengeForDate(
  dateStr?: string | null,
  bank: DailyChallengeQuestion[] = DAILY_CHALLENGE_BANK
): DailyChallengeQuestion {
  if (!dateStr || typeof dateStr !== "string") {
    return bank[0]
  }
  let hash = 0
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash * 31 + dateStr.charCodeAt(i)) >>> 0
  }
  const index = hash % bank.length
  return bank[index]
}
