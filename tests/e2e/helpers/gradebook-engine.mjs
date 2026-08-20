/**
 * Faculty Gradebook & Performance Analytics Engine
 * Conforms to ORIGINAL_REQUEST § R5 and PROJECT.md § Milestone 6
 */

/**
 * Aggregates student learning data into a complete Faculty Gradebook matrix
 *
 * @param {Object} data
 * @param {Object[]} data.students - [{ id, name, email, university, cohort }]
 * @param {Object[]} data.lectures - [{ id, course_id, title, order_index }]
 * @param {Object[]} data.lecture_progress - [{ user_id, lecture_id, completed }]
 * @param {Object[]} data.quizzes - [{ id, course_id, title }]
 * @param {Object[]} data.quiz_submissions - [{ user_id, quiz_id, score_percentage }]
 * @param {Object[]} data.certificates - [{ user_id, course_id, certificate_code, status }]
 * @returns {Object[]} Student Gradebook Rows
 */
export function generateGradebookMatrix({
  students = [],
  lectures = [],
  lecture_progress = [],
  quizzes = [],
  quiz_submissions = [],
  certificates = []
}) {
  const totalLecturesCount = lectures.length;
  const totalQuizzesCount = quizzes.length;

  return students.map(student => {
    // 1. Calculate lecture completion
    const watchedLectures = lecture_progress.filter(
      lp => lp.user_id === student.id && lp.completed
    );
    const watchedCount = watchedLectures.length;
    const watchCompletionRate = totalLecturesCount > 0
      ? Math.round((watchedCount / totalLecturesCount) * 1000) / 10
      : 0;

    // 2. Calculate itemized quiz scores & average
    const studentSubmissions = quiz_submissions.filter(qs => qs.user_id === student.id);
    const quizScoresMap = {};
    let totalScoreSum = 0;

    quizzes.forEach(q => {
      const sub = studentSubmissions.find(s => s.quiz_id === q.id);
      if (sub) {
        quizScoresMap[q.id] = sub.score_percentage;
        totalScoreSum += sub.score_percentage;
      } else {
        quizScoresMap[q.id] = null;
      }
    });

    const submittedCount = studentSubmissions.length;
    const quizAverage = submittedCount > 0
      ? Math.round((totalScoreSum / submittedCount) * 10) / 10
      : 0;

    // 3. Certificate status
    const cert = certificates.find(c => c.user_id === student.id && c.status === 'valid');
    let certificateStatus = 'not_eligible';
    let certificateCode = null;

    if (cert) {
      certificateStatus = 'issued';
      certificateCode = cert.certificate_code;
    } else if (watchCompletionRate >= 100 && quizAverage >= 80) {
      certificateStatus = 'eligible';
    }

    return {
      student_id: student.id,
      student_name: student.name,
      email: student.email,
      university: student.university || 'Unassigned',
      cohort: student.cohort || 'Default',
      lectures_watched: watchedCount,
      total_lectures: totalLecturesCount,
      watch_completion_rate: watchCompletionRate,
      quiz_scores: quizScoresMap,
      quiz_average: quizAverage,
      certificate_status: certificateStatus,
      certificate_code: certificateCode
    };
  });
}

/**
 * Filters gradebook roster rows by criteria
 * @param {Object[]} rows - Gradebook rows from generateGradebookMatrix
 * @param {Object} filters - { university, cohort, certificate_status, search }
 * @returns {Object[]} Filtered rows
 */
export function filterGradebookRoster(rows, filters = {}) {
  return rows.filter(row => {
    if (filters.university && filters.university !== 'all' && row.university !== filters.university) {
      return false;
    }
    if (filters.cohort && filters.cohort !== 'all' && row.cohort !== filters.cohort) {
      return false;
    }
    if (filters.certificate_status && filters.certificate_status !== 'all' && row.certificate_status !== filters.certificate_status) {
      return false;
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const matchName = row.student_name.toLowerCase().includes(q);
      const matchEmail = row.email.toLowerCase().includes(q);
      if (!matchName && !matchEmail) return false;
    }
    return true;
  });
}

/**
 * Exports gradebook matrix to RFC 4180 compliant CSV format
 * @param {Object[]} rows - Gradebook rows
 * @returns {string} CSV content
 */
export function exportGradebookToCSV(rows) {
  const headers = [
    'Student ID',
    'Student Name',
    'Email',
    'University',
    'Cohort',
    'Lectures Watched',
    'Total Lectures',
    'Lecture Completion %',
    'Quiz Average %',
    'Certificate Status',
    'Certificate Code'
  ];

  const escapeCSV = (field) => {
    if (field === null || field === undefined) return '';
    const str = String(field);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csvLines = [headers.join(',')];

  rows.forEach(r => {
    const line = [
      escapeCSV(r.student_id),
      escapeCSV(r.student_name),
      escapeCSV(r.email),
      escapeCSV(r.university),
      escapeCSV(r.cohort),
      escapeCSV(r.lectures_watched),
      escapeCSV(r.total_lectures),
      escapeCSV(r.watch_completion_rate),
      escapeCSV(r.quiz_average),
      escapeCSV(r.certificate_status),
      escapeCSV(r.certificate_code || 'N/A')
    ];
    csvLines.push(line.join(','));
  });

  return csvLines.join('\n');
}

/**
 * Calculates drop-off funnel analytics across ordered lectures
 * @param {Object[]} lectures - Ordered list of lectures
 * @param {Object[]} lectureProgress - Progress records
 * @param {number} totalEnrolled - Total enrolled students count
 * @returns {Object[]} Funnel stages with completion rates
 */
export function calculateLectureDropoffFunnel(lectures, lectureProgress, totalEnrolled) {
  if (!totalEnrolled || totalEnrolled <= 0) {
    return lectures.map((l, idx) => ({
      lecture_id: l.id,
      title: l.title,
      order: idx + 1,
      completions: 0,
      completion_percentage: 0,
      dropoff_from_previous_percentage: 0
    }));
  }

  const sortedLectures = [...lectures].sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  let prevCompletions = totalEnrolled;

  return sortedLectures.map((lec, idx) => {
    const completions = lectureProgress.filter(lp => lp.lecture_id === lec.id && lp.completed).length;
    const rate = Math.round((completions / totalEnrolled) * 1000) / 10;
    const dropoff = prevCompletions > 0
      ? Math.round(((prevCompletions - completions) / prevCompletions) * 1000) / 10
      : 0;
    prevCompletions = completions;

    return {
      lecture_id: lec.id,
      title: lec.title,
      order: idx + 1,
      completions,
      completion_percentage: rate,
      dropoff_from_previous_percentage: Math.max(0, dropoff)
    };
  });
}

/**
 * Calculates Question Difficulty Heatmap
 * @param {Object[]} questions - Questions
 * @param {Object[]} questionAttempts - [{ question_id, is_correct }]
 * @returns {Object[]} Itemized difficulty breakdown
 */
export function calculateQuestionDifficultyHeatmap(questions, questionAttempts) {
  return questions.map(q => {
    const attempts = questionAttempts.filter(a => a.question_id === q.id);
    const total = attempts.length;
    const incorrect = attempts.filter(a => !a.is_correct).length;
    const errorRate = total > 0 ? Math.round((incorrect / total) * 1000) / 10 : 0;

    let difficultyTier = 'easy';
    if (errorRate > 50) {
      difficultyTier = 'hard';
    } else if (errorRate >= 20) {
      difficultyTier = 'medium';
    }

    return {
      question_id: q.id,
      question_text: q.question,
      total_attempts: total,
      incorrect_attempts: incorrect,
      error_rate_percentage: errorRate,
      calculated_difficulty: difficultyTier,
      author_difficulty: q.difficulty || 'medium'
    };
  });
}
