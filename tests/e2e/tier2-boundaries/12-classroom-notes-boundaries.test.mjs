/**
 * Tier 2 - Classroom Discussions & Timestamped Notes Boundaries Test Suite
 * Covers F5.1 (Discussion Validation & Upvote Boundaries),
 * F5.2 (Timestamp Formatting, Seeking & Markdown Injection Boundaries).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  formatTimestamp,
  parseTimestampToSeconds,
  createTimestampedNote,
  generateNotesMarkdown,
  toggleDiscussionUpvote,
  validateDiscussionThreadPayload,
} from '../helpers/expansion-classroom-notes-engine.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 5.1 - Classroom Discussion Boundaries', (test) => {
    test('T2.F5.1.1: Title with less than 5 characters fails validation', () => {
      const res = validateDiscussionThreadPayload({
        title: 'Hi',
        content: 'Valid content that is long enough.',
        category: 'general',
      });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], '5 characters');
    });

    test('T2.F5.1.2: Content with less than 10 characters fails validation', () => {
      const res = validateDiscussionThreadPayload({
        title: 'Valid Long Title',
        content: 'Too short',
        category: 'general',
      });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], '10 characters');
    });

    test('T2.F5.1.3: Unknown category string is rejected with descriptive error', () => {
      const res = validateDiscussionThreadPayload({
        title: 'Valid Long Title',
        content: 'Valid content that is long enough.',
        category: 'unrecognized_category',
      });
      assert.strictEqual(res.valid, false);
      assert.includes(res.errors[0], 'Category');
    });

    test('T2.F5.1.4: Null or empty userId in upvote toggle leaves state unchanged', () => {
      const res = toggleDiscussionUpvote({
        threadId: 'th-1',
        currentUpvotes: 10,
        upvotedUserIds: ['u1'],
        userId: null,
      });
      assert.strictEqual(res.upvotes, 10);
      assert.strictEqual(res.upvoted, false);
    });

    test('T2.F5.1.5: Upvote count does not drop below 0 upon multiple un-upvotes', () => {
      const res = toggleDiscussionUpvote({
        threadId: 'th-1',
        currentUpvotes: 0,
        upvotedUserIds: ['u1'],
        userId: 'u1',
      });
      assert.strictEqual(res.upvotes, 0);
    });
  });

  runner.suite('Tier 2: Feature 5.2 - Notes Drawer & Timestamp Boundaries', (test) => {
    test('T2.F5.2.1: formatTimestamp handles negative, zero, NaN, null, and multi-hour values', () => {
      assert.strictEqual(formatTimestamp(-10), '00:00');
      assert.strictEqual(formatTimestamp(0), '00:00');
      assert.strictEqual(formatTimestamp(NaN), '00:00');
      assert.strictEqual(formatTimestamp(null), '00:00');
      assert.strictEqual(formatTimestamp(3600), '01:00:00'); // Exactly 1 hour
      assert.strictEqual(formatTimestamp(7325), '02:02:05'); // 2h 2m 5s
    });

    test('T2.F5.2.2: parseTimestampToSeconds handles malformed strings, null, and out-of-range formats', () => {
      assert.strictEqual(parseTimestampToSeconds(null), 0);
      assert.strictEqual(parseTimestampToSeconds(''), 0);
      assert.strictEqual(parseTimestampToSeconds('invalid:timestamp'), 0);
      assert.strictEqual(parseTimestampToSeconds('10:20:30:40'), 0);
      assert.strictEqual(parseTimestampToSeconds('05:30'), 330);
    });

    test('T2.F5.2.3: Note text containing Markdown characters is preserved intact during export', () => {
      const rawText = '# Heading Injection & **bold** text with `code` block';
      const note = createTimestampedNote({
        timestampSeconds: 10,
        noteText: rawText,
        tag: 'pearl',
      });
      const md = generateNotesMarkdown({ notes: [note] });
      assert.includes(md, rawText);
    });

    test('T2.F5.2.4: Unrecognized note tag falls back cleanly to general tag', () => {
      const note = createTimestampedNote({
        timestampSeconds: 30,
        noteText: 'Clinical note',
        tag: 'unknown_tag_type',
      });
      assert.strictEqual(note.tag, 'general');
    });

    test('T2.F5.2.5: Notes with out-of-order timestamps are sorted chronologically by seconds in Markdown export', () => {
      const n1 = createTimestampedNote({ id: '1', timestampSeconds: 300, noteText: 'Second Note' });
      const n2 = createTimestampedNote({ id: '2', timestampSeconds: 60, noteText: 'First Note' });
      const md = generateNotesMarkdown({ notes: [n1, n2] });
      const firstPos = md.indexOf('First Note');
      const secondPos = md.indexOf('Second Note');
      assert.ok(firstPos < secondPos, 'Earlier timestamp note should appear first');
    });
  });
}
