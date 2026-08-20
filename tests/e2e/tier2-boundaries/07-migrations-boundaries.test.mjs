/**
 * Tier 2 - Feature 7: Database Migrations Boundary & Syntax Integrity
 * Tests edge cases: malformed SQL detection, case insensitivity, empty files, missing directory.
 */

import { assert } from '../helpers/test-utils.mjs';
import {
  validateSQLContent,
  validateMigrationFiles
} from '../helpers/migration-validator.mjs';

export function register(runner) {
  runner.suite('Tier 2: Feature 7 - Migrations Syntax Boundaries', (test) => {
    test('T2.7.1: validateSQLContent handles null, undefined, or empty string gracefully', () => {
      const resNull = validateSQLContent(null, ['CREATE TABLE']);
      assert.strictEqual(resNull.valid, false);
      assert.strictEqual(resNull.missingKeywords.length, 1);

      const resEmpty = validateSQLContent('', ['CREATE TABLE']);
      assert.strictEqual(resEmpty.valid, false);
    });

    test('T2.7.2: SQL validator matches keywords case-insensitively', () => {
      const lowerSql = 'create table if not exists test_table (id uuid primary key);';
      const res = validateSQLContent(lowerSql, ['CREATE TABLE', 'UUID PRIMARY KEY']);
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.missingKeywords.length, 0);
    });

    test('T2.7.3: Missing required keywords are correctly reported in missingKeywords array', () => {
      const partialSql = 'CREATE TABLE test (id int);';
      const res = validateSQLContent(partialSql, ['CREATE TABLE', 'ROW LEVEL SECURITY', 'PRIMARY KEY']);
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.missingKeywords.length, 2);
      assert.includes(res.missingKeywords, 'ROW LEVEL SECURITY');
      assert.includes(res.missingKeywords, 'PRIMARY KEY');
    });

    test('T2.7.4: validateMigrationFiles returns clean errors report when target directory does not exist', () => {
      const report = validateMigrationFiles('/non/existent/path/to/migrations');
      assert.strictEqual(report.allFilesExist, false);
      assert.includes(report.errors[0], 'Migrations directory does not exist');
    });

    test('T2.7.5: Verifies that SQL DDL statements for RLS security explicitly include ENABLE ROW LEVEL SECURITY', () => {
      const secureTableSql = `
        CREATE TABLE secure_records (id uuid primary key);
        ALTER TABLE secure_records ENABLE ROW LEVEL SECURITY;
      `;
      const res = validateSQLContent(secureTableSql, ['ENABLE ROW LEVEL SECURITY']);
      assert.strictEqual(res.valid, true);
    });

    test('T2.7.6: Verifies JSONB column default values in DDL specify correct jsonb cast', () => {
      const jsonbColSql = `
        ALTER TABLE courses ADD COLUMN feature_overrides JSONB DEFAULT '{}'::jsonb;
      `;
      const res = validateSQLContent(jsonbColSql, ['jsonb', "'{}'::jsonb"]);
      assert.strictEqual(res.valid, true);
    });
  });
}
