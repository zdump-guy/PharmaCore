/**
 * Tier 1 - Dedicated Courses Catalog & Views Test Suite
 * Covers F2.1 (Dedicated Full-Page Catalog `/courses`),
 * F2.2 (Switchable Grid & List Views), F2.3 (Enhanced Glassmorphism Course Cards).
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  MOCK_COURSES,
  filterAndSortCourses,
  resolveCatalogViewMode,
  formatDuration,
  computeCourseCardMetrics,
} from '../helpers/expansion-catalog-engine.mjs';

export function register(runner) {
  runner.suite('Tier 1: Feature 2.1 - Dedicated Full-Page Catalog (/courses)', (test) => {
    test('T1.F2.1.1: Category filter returns only matching courses within specific specialty', () => {
      const results = filterAndSortCourses({
        courses: MOCK_COURSES,
        category: 'cardiology',
      });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'c-cardio-101');
      assert.strictEqual(results[0].category, 'cardiology');
    });

    test('T1.F2.1.2: Difficulty filter filters courses by beginner, intermediate, or advanced', () => {
      const advancedCourses = filterAndSortCourses({
        courses: MOCK_COURSES,
        difficulty: 'advanced',
      });
      assert.strictEqual(advancedCourses.length, 2);
      assert.ok(advancedCourses.every((c) => c.difficulty === 'advanced'));
    });

    test('T1.F2.1.3: Real-time search query matches title and description in English', () => {
      const results = filterAndSortCourses({
        courses: MOCK_COURSES,
        searchQuery: 'antimicrobial',
      });
      assert.strictEqual(results.length, 1);
      assert.strictEqual(results[0].id, 'c-anti-201');
    });

    test('T1.F2.1.4: Real-time search query matches Arabic titles and descriptions', () => {
      const results = filterAndSortCourses({
        courses: MOCK_COURSES,
        searchQuery: 'السكري', // In description of endocrine / glp-1
      });
      // Or search for 'القلب'
      const cardioResults = filterAndSortCourses({
        courses: MOCK_COURSES,
        searchQuery: 'القلب',
      });
      assert.strictEqual(cardioResults.length, 1);
      assert.strictEqual(cardioResults[0].id, 'c-cardio-101');
    });

    test('T1.F2.1.5: Sorting by popularity orders courses by enrolled_students descending', () => {
      const sorted = filterAndSortCourses({
        courses: MOCK_COURSES,
        sortBy: 'popular',
      });
      assert.strictEqual(sorted[0].id, 'c-anti-201'); // 2150 students
      assert.strictEqual(sorted[1].id, 'c-endo-102'); // 1420 students
      assert.strictEqual(sorted[sorted.length - 1].id, 'c-intro-001'); // 850 students
    });
  });

  runner.suite('Tier 1: Feature 2.2 - Switchable Grid & List Views', (test) => {
    test('T1.F2.2.1: Default view mode resolves to grid when unspecified', () => {
      const mode = resolveCatalogViewMode(undefined, null);
      assert.strictEqual(mode, 'grid');
    });

    test('T1.F2.2.2: List view mode resolves correctly when requested by user', () => {
      const mode = resolveCatalogViewMode('list', null);
      assert.strictEqual(mode, 'list');
    });

    test('T1.F2.2.3: Saved user view preference in localStorage takes precedence when no explicit mode requested', () => {
      const mode = resolveCatalogViewMode(null, 'list');
      assert.strictEqual(mode, 'list');
    });

    test('T1.F2.2.4: Invalid view mode falls back safely to grid', () => {
      const mode = resolveCatalogViewMode('invalid_mode', null);
      assert.strictEqual(mode, 'grid');
    });

    test('T1.F2.2.5: Course list row renders full objectives and metadata whereas grid focuses on card', () => {
      const course = MOCK_COURSES[0];
      const listMetrics = computeCourseCardMetrics(course);
      assert.ok(listMetrics.formattedDuration);
      assert.ok(listMetrics.quizCountLabel);
      assert.ok(listMetrics.lectureCountLabel);
    });
  });

  runner.suite('Tier 1: Feature 2.3 - Enhanced Glassmorphism Course Cards', (test) => {
    test('T1.F2.3.1: Duration formatter converts minutes into hours and minutes format', () => {
      assert.strictEqual(formatDuration(180), '3h');
      assert.strictEqual(formatDuration(150), '2h 30m');
      assert.strictEqual(formatDuration(45), '45m');
    });

    test('T1.F2.3.2: Course card metrics identify unenrolled guest with direct Enroll action', () => {
      const course = MOCK_COURSES[0];
      const metrics = computeCourseCardMetrics(course, null);
      assert.strictEqual(metrics.isEnrolled, false);
      assert.strictEqual(metrics.progressPercent, 0);
      assert.strictEqual(metrics.primaryAction, 'enroll');
      assert.strictEqual(metrics.primaryLabelEn, 'Enroll Now');
    });

    test('T1.F2.3.3: Course card metrics identify active enrolled student with Continue Learning action', () => {
      const course = MOCK_COURSES[0];
      const enrollment = { progressPercent: 45 };
      const metrics = computeCourseCardMetrics(course, enrollment);
      assert.strictEqual(metrics.isEnrolled, true);
      assert.strictEqual(metrics.progressPercent, 45);
      assert.strictEqual(metrics.isCompleted, false);
      assert.strictEqual(metrics.primaryAction, 'continue');
      assert.strictEqual(metrics.primaryLabelEn, 'Continue Learning');
    });

    test('T1.F2.3.4: Course card metrics identify completed student with Review Course action', () => {
      const course = MOCK_COURSES[0];
      const enrollment = { progressPercent: 100 };
      const metrics = computeCourseCardMetrics(course, enrollment);
      assert.strictEqual(metrics.isCompleted, true);
      assert.strictEqual(metrics.primaryAction, 'review');
      assert.strictEqual(metrics.primaryLabelEn, 'Review Course');
    });

    test('T1.F2.3.5: Promotional badge is extracted cleanly for ambient glow styling', () => {
      const course = MOCK_COURSES[0]; // High Yield
      const metrics = computeCourseCardMetrics(course);
      assert.strictEqual(metrics.promoBadge, 'High Yield');
    });
  });
}
