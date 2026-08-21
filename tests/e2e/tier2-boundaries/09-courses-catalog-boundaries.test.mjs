/**
 * Tier 2 - Courses Catalog, Search & Card Boundaries Test Suite
 * Covers F2.1 (Catalog Filtering/Search Boundaries),
 * F2.2 (View Mode Boundaries), F2.3 (Card Metrics Boundaries).
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
  runner.suite('Tier 2: Feature 2.1 - Catalog Search & Filter Boundaries', (test) => {
    test('T2.F2.1.1: Empty course catalog array returns empty list safely for all filter queries', () => {
      const results = filterAndSortCourses({
        courses: [],
        category: 'cardiology',
        searchQuery: 'beta',
      });
      assert.strictEqual(results.length, 0);
    });

    test('T2.F2.1.2: Search query with special meta-characters does not crash regex or substring search', () => {
      const metaQueries = ['[beta]', '(cardio)', '***', '?', '\\', 'GLP-1+SGLT-2'];
      metaQueries.forEach((q) => {
        const res = filterAndSortCourses({
          courses: MOCK_COURSES,
          searchQuery: q,
        });
        assert.ok(Array.isArray(res), `Failed on query "${q}"`);
      });
    });

    test('T2.F2.1.3: Non-existent category or difficulty returns empty list without error', () => {
      const noCategory = filterAndSortCourses({
        courses: MOCK_COURSES,
        category: 'non_existent_specialty',
      });
      assert.strictEqual(noCategory.length, 0);

      const noDiff = filterAndSortCourses({
        courses: MOCK_COURSES,
        difficulty: 'expert_level_99',
      });
      assert.strictEqual(noDiff.length, 0);
    });

    test('T2.F2.1.4: Whitespace-only search query matches all courses as if search was empty', () => {
      const res = filterAndSortCourses({
        courses: MOCK_COURSES,
        searchQuery: '     ',
      });
      assert.strictEqual(res.length, MOCK_COURSES.length);
    });

    test('T2.F2.1.5: Unknown sortBy key defaults safely without disturbing original order', () => {
      const res = filterAndSortCourses({
        courses: MOCK_COURSES,
        sortBy: 'non_existent_sort_order',
      });
      assert.strictEqual(res.length, MOCK_COURSES.length);
    });
  });

  runner.suite('Tier 2: Feature 2.2 - View Mode Boundaries', (test) => {
    test('T2.F2.2.1: Null, undefined, or empty string view mode resolves to grid', () => {
      assert.strictEqual(resolveCatalogViewMode(null, null), 'grid');
      assert.strictEqual(resolveCatalogViewMode(undefined, undefined), 'grid');
      assert.strictEqual(resolveCatalogViewMode('', ''), 'grid');
    });

    test('T2.F2.2.2: Numeric or object values passed as view mode fall back to grid', () => {
      assert.strictEqual(resolveCatalogViewMode(123, null), 'grid');
      assert.strictEqual(resolveCatalogViewMode({ mode: 'list' }, null), 'grid');
    });

    test('T2.F2.2.3: Saved view mode takes precedence only if valid', () => {
      assert.strictEqual(resolveCatalogViewMode('list', 'corrupted_state'), 'list');
    });

    test('T2.F2.2.4: Case-sensitivity in view mode - uppercase GRID falls back safely', () => {
      assert.strictEqual(resolveCatalogViewMode('GRID', null), 'grid');
    });

    test('T2.F2.2.5: Concurrent view mode toggling preserves state determinism', () => {
      let state = 'grid';
      state = resolveCatalogViewMode('list', state);
      assert.strictEqual(state, 'list');
    });
  });

  runner.suite('Tier 2: Feature 2.3 - Course Card Metrics Boundaries', (test) => {
    test('T2.F2.3.1: formatDuration handles 0, negative, NaN, null, and extreme durations safely', () => {
      assert.strictEqual(formatDuration(0), '0m');
      assert.strictEqual(formatDuration(-50), '0m');
      assert.strictEqual(formatDuration(NaN), '0m');
      assert.strictEqual(formatDuration(null), '0m');
      assert.strictEqual(formatDuration(6000), '100h'); // 100 hours
    });

    test('T2.F2.3.2: computeCourseCardMetrics with null course returns null safely', () => {
      assert.strictEqual(computeCourseCardMetrics(null), null);
      assert.strictEqual(computeCourseCardMetrics(undefined), null);
    });

    test('T2.F2.3.3: Enrollment progress percentage clamps negative numbers to 0% and >100 to 100%', () => {
      const course = MOCK_COURSES[0];
      const underflow = computeCourseCardMetrics(course, { progressPercent: -30 });
      assert.strictEqual(underflow.progressPercent, 0);

      const overflow = computeCourseCardMetrics(course, { progressPercent: 180 });
      assert.strictEqual(overflow.progressPercent, 100);
      assert.strictEqual(overflow.isCompleted, true);
    });

    test('T2.F2.3.4: Course with 0 lectures and 0 quizzes formats clean labels without crashing', () => {
      const emptyCourse = {
        id: 'c-empty',
        title_en: 'Empty Course',
        total_lectures: 0,
        total_quizzes: 0,
        duration_minutes: 0,
      };
      const metrics = computeCourseCardMetrics(emptyCourse);
      assert.strictEqual(metrics.lectureCountLabel, '0 Lectures');
      assert.strictEqual(metrics.quizCountLabel, '0 Quizzes');
      assert.strictEqual(metrics.formattedDuration, '0m');
    });

    test('T2.F2.3.5: Singular vs plural label formatting (1 Lecture vs 2 Lectures)', () => {
      const singleItemCourse = {
        id: 'c-single',
        title_en: 'Single Module',
        total_lectures: 1,
        total_quizzes: 1,
        duration_minutes: 60,
      };
      const metrics = computeCourseCardMetrics(singleItemCourse);
      assert.strictEqual(metrics.lectureCountLabel, '1 Lecture');
      assert.strictEqual(metrics.quizCountLabel, '1 Quiz');
    });
  });
}
