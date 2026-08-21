/**
 * Classroom Discussion Hub & In-Lecture Timestamped Notes Engine
 * for PharmaCore Expansion Suite Tests.
 */

export const VALID_DISCUSSION_CATEGORIES = [
  'clinical_qa',
  'mnemonics',
  'faculty_solutions',
  'general',
];

export const VALID_NOTE_TAGS = [
  'pearl',
  'warning',
  'exam',
  'mechanism',
  'general',
];

/**
 * Converts seconds into "MM:SS" or "HH:MM:SS" format
 */
export function formatTimestamp(totalSeconds) {
  if (typeof totalSeconds !== 'number' || isNaN(totalSeconds) || totalSeconds < 0) {
    return '00:00';
  }
  const s = Math.floor(totalSeconds);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  const pad = (n) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Parses timestamp string "MM:SS" or "HH:MM:SS" back to total seconds
 */
export function parseTimestampToSeconds(str) {
  if (!str || typeof str !== 'string') return 0;
  const parts = str.trim().split(':').map((p) => parseInt(p, 10));
  if (parts.some((p) => isNaN(p))) return 0;

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return 0;
}

/**
 * Creates and formats a timestamped clinical note
 */
export function createTimestampedNote({
  id = `note-${Date.now()}`,
  userId,
  lectureId,
  courseId = null,
  lectureTitle = 'Lecture',
  timestampSeconds = 0,
  noteText = '',
  tag = 'general',
}) {
  const cleanTag = VALID_NOTE_TAGS.includes(tag) ? tag : 'general';
  const cleanSeconds = Math.max(0, Math.floor(timestampSeconds || 0));

  return {
    id,
    user_id: userId,
    lecture_id: lectureId,
    course_id: courseId,
    lecture_title: lectureTitle,
    timestamp_seconds: cleanSeconds,
    timestamp_formatted: formatTimestamp(cleanSeconds),
    note_text: noteText.trim(),
    tag: cleanTag,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

/**
 * Exports timestamped notes to structured Markdown format
 */
export function generateNotesMarkdown({
  courseTitle = 'Clinical Pharmacology',
  lectureTitle = 'Lecture Notes',
  studentName = 'Student',
  notes = [],
}) {
  const lines = [
    `# Clinical Study Notes — ${lectureTitle}`,
    `**Course**: ${courseTitle}`,
    `**Student**: ${studentName}`,
    `**Generated**: ${new Date().toISOString().split('T')[0]}`,
    `**Total Notes**: ${notes.length}`,
    '',
    '---',
    '',
  ];

  if (notes.length === 0) {
    lines.push('_No notes recorded for this lecture._');
    return lines.join('\n');
  }

  // Sort notes chronologically by timestamp
  const sorted = [...notes].sort((a, b) => (a.timestamp_seconds || 0) - (b.timestamp_seconds || 0));

  const tagIcons = {
    pearl: '💡 [Clinical Pearl]',
    warning: '⚠️ [Contraindication/Warning]',
    exam: '🎯 [High-Yield Exam Focus]',
    mechanism: '🔬 [Mechanism of Action]',
    general: '📝 [Clinical Note]',
  };

  sorted.forEach((note, idx) => {
    const header = `${idx + 1}. **[${note.timestamp_formatted}]** ${tagIcons[note.tag] || tagIcons.general}`;
    lines.push(header);
    lines.push(`> ${note.note_text}`);
    lines.push('');
  });

  lines.push('---');
  lines.push('Generated with PharmaCore Clinical Study Suite');

  return lines.join('\n');
}

/**
 * Upvote manager for discussion hub to prevent duplicate voting
 */
export function toggleDiscussionUpvote({
  threadId,
  currentUpvotes = 0,
  upvotedUserIds = [],
  userId,
}) {
  if (!userId) {
    return { upvotes: currentUpvotes, upvoted: false, upvotedUserIds };
  }

  const alreadyUpvoted = upvotedUserIds.includes(userId);
  let newUpvotes = currentUpvotes;
  let newUpvotedUserIds = [...upvotedUserIds];

  if (alreadyUpvoted) {
    newUpvotes = Math.max(0, currentUpvotes - 1);
    newUpvotedUserIds = newUpvotedUserIds.filter((id) => id !== userId);
  } else {
    newUpvotes = currentUpvotes + 1;
    newUpvotedUserIds.push(userId);
  }

  return {
    upvotes: newUpvotes,
    upvoted: !alreadyUpvoted,
    upvotedUserIds: newUpvotedUserIds,
  };
}

/**
 * Validates discussion thread input
 */
export function validateDiscussionThreadPayload(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  if (!payload.title || typeof payload.title !== 'string' || payload.title.trim().length < 5) {
    errors.push('Title must be at least 5 characters');
  }

  if (!payload.content || typeof payload.content !== 'string' || payload.content.trim().length < 10) {
    errors.push('Content must be at least 10 characters');
  }

  if (payload.category && !VALID_DISCUSSION_CATEGORIES.includes(payload.category)) {
    errors.push(`Category must be one of: ${VALID_DISCUSSION_CATEGORIES.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
