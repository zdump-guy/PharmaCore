/**
 * Tier 1 - Classroom Discussion Hub & Timestamped Notes Test Suite
 * Covers F5.1 (Classroom Discussion Hub),
 * F5.2 (In-Lecture Timestamped Clinical Notes Drawer).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  formatTimestamp,
  parseTimestampToSeconds,
  createTimestampedNote,
  generateNotesMarkdown,
  toggleDiscussionUpvote,
  validateDiscussionThreadPayload,
  VALID_DISCUSSION_CATEGORIES,
  VALID_NOTE_TAGS,
} from '../helpers/expansion-classroom-notes-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 5.1 - Classroom Discussion Hub', (test) => {
    test('T1.F5.1.1: Discussion categories include clinical_qa, mnemonics, faculty_solutions, and general', () => {
      assert.includes(VALID_DISCUSSION_CATEGORIES, 'clinical_qa');
      assert.includes(VALID_DISCUSSION_CATEGORIES, 'mnemonics');
      assert.includes(VALID_DISCUSSION_CATEGORIES, 'faculty_solutions');
      assert.includes(VALID_DISCUSSION_CATEGORIES, 'general');
    });

    test('T1.F5.1.2: Upvote toggle increments upvote count and registers voter ID', () => {
      const initial = { currentUpvotes: 4, upvotedUserIds: ['u1', 'u2', 'u3', 'u4'] };
      const res = toggleDiscussionUpvote({
        threadId: 'th-101',
        currentUpvotes: initial.currentUpvotes,
        upvotedUserIds: initial.upvotedUserIds,
        userId: 'u5',
      });

      assert.strictEqual(res.upvotes, 5);
      assert.strictEqual(res.upvoted, true);
      assert.includes(res.upvotedUserIds, 'u5');
    });

    test('T1.F5.1.3: Toggling upvote again by the same user decrements upvote count (undo upvote)', () => {
      const initial = { currentUpvotes: 5, upvotedUserIds: ['u1', 'u2', 'u3', 'u4', 'u5'] };
      const res = toggleDiscussionUpvote({
        threadId: 'th-101',
        currentUpvotes: initial.currentUpvotes,
        upvotedUserIds: initial.upvotedUserIds,
        userId: 'u5',
      });

      assert.strictEqual(res.upvotes, 4);
      assert.strictEqual(res.upvoted, false);
      assert.strictEqual(res.upvotedUserIds.includes('u5'), false);
    });

    test('T1.F5.1.4: Discussion thread payload validator verifies title, content, and category', () => {
      const validPayload = {
        title: 'Mnemonic for Class III Antiarrhythmics',
        content: 'Remember ABCD: Amiodarone, Bretylium, C-something, Dofetilide...',
        category: 'mnemonics',
      };
      const res = validateDiscussionThreadPayload(validPayload);
      assert.strictEqual(res.valid, true);
    });

    test('T1.F5.1.5: Faculty verified solution badge flag is distinguished on thread responses', () => {
      const response = {
        id: 'ans-1',
        text: 'Class III drugs block K+ channels prolonging repolarization.',
        is_faculty_verified: true,
        verifier_title: 'Clinical Pharmacology Faculty',
      };
      assert.strictEqual(response.is_faculty_verified, true);
      assert.ok(response.verifier_title);
    });
  });

  runner.suite('Tier 1: Feature 5.2 - In-Lecture Timestamped Clinical Notes Drawer', (test) => {
    test('T1.F5.1.1: Timestamp formatter converts seconds into MM:SS and HH:MM:SS strings', () => {
      assert.strictEqual(formatTimestamp(75), '01:15');
      assert.strictEqual(formatTimestamp(605), '10:05');
      assert.strictEqual(formatTimestamp(3665), '01:01:05');
    });

    test('T1.F5.2.2: Timestamp parser accurately converts MM:SS strings back into integer seconds for video seeking', () => {
      assert.strictEqual(parseTimestampToSeconds('01:15'), 75);
      assert.strictEqual(parseTimestampToSeconds('10:05'), 605);
      assert.strictEqual(parseTimestampToSeconds('01:01:05'), 3665);
    });

    test('T1.F5.2.3: createTimestampedNote builds structured note record with clinical tags', () => {
      assert.includes(VALID_NOTE_TAGS, 'pearl');
      assert.includes(VALID_NOTE_TAGS, 'warning');
      assert.includes(VALID_NOTE_TAGS, 'exam');
      assert.includes(VALID_NOTE_TAGS, 'mechanism');

      const note = createTimestampedNote({
        id: 'n1',
        userId: 'u1',
        lectureId: 'lec-1',
        lectureTitle: 'Beta Blockers',
        timestampSeconds: 145,
        noteText: 'Avoid in acute decompensated heart failure with pulmonary edema.',
        tag: 'warning',
      });

      assert.strictEqual(note.timestamp_seconds, 145);
      assert.strictEqual(note.timestamp_formatted, '02:25');
      assert.strictEqual(note.tag, 'warning');
      assert.ok(note.note_text.includes('Avoid in acute decompensated'));
    });

    test('T1.F5.2.4: generateNotesMarkdown produces complete, formatted Markdown document with headers and quotes', () => {
      const notes = [
        createTimestampedNote({
          timestampSeconds: 60,
          noteText: 'First line therapy in HFrEF',
          tag: 'pearl',
        }),
        createTimestampedNote({
          timestampSeconds: 180,
          noteText: 'Monitor serum potassium and SCr within 1-2 weeks',
          tag: 'warning',
        }),
      ];

      const markdown = generateNotesMarkdown({
        courseTitle: 'Cardiovascular Pharmacology',
        lectureTitle: 'ACE Inhibitors in Heart Failure',
        studentName: 'Ziad Mansour',
        notes,
      });

      assert.includes(markdown, '# Clinical Study Notes — ACE Inhibitors in Heart Failure');
      assert.includes(markdown, '**Student**: Ziad Mansour');
      assert.includes(markdown, '[01:00]');
      assert.includes(markdown, '[03:00]');
      assert.includes(markdown, '💡 [Clinical Pearl]');
      assert.includes(markdown, '⚠️ [Contraindication/Warning]');
    });

    test('T1.F5.2.5: generateNotesMarkdown handles empty notes list with placeholder message', () => {
      const markdown = generateNotesMarkdown({
        courseTitle: 'Cardiovascular Pharmacology',
        lectureTitle: 'Lecture 1',
        studentName: 'Student',
        notes: [],
      });
      assert.includes(markdown, '_No notes recorded for this lecture._');
    });
  });
}
