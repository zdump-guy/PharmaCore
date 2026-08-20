/**
 * Database Migrations & DDL Integrity Validator
 * Conforms to ORIGINAL_REQUEST § R6 and PROJECT.md § Milestone 1
 */

import fs from 'fs';
import path from 'path';

export const REQUIRED_MIGRATION_FILES = [
  '001_feature_flags.sql',
  '002_ai_consultations.sql',
  '003_certificates_and_streaks.sql',
  '004_question_rationales_and_gradebook.sql'
];

/**
 * Validates the existence and DDL integrity of SQL migration files
 * @param {string} migrationsDir - Absolute path to supabase/migrations
 * @returns {Object} Validation report
 */
export function validateMigrationFiles(migrationsDir) {
  const report = {
    allFilesExist: true,
    filesChecked: [],
    errors: [],
    ddlSummary: {}
  };

  if (!fs.existsSync(migrationsDir)) {
    report.allFilesExist = false;
    report.errors.push(`Migrations directory does not exist: ${migrationsDir}`);
    return report;
  }

  for (const filename of REQUIRED_MIGRATION_FILES) {
    const filePath = path.join(migrationsDir, filename);
    const exists = fs.existsSync(filePath);

    if (!exists) {
      report.allFilesExist = false;
      report.errors.push(`Missing required migration file: ${filename}`);
      report.filesChecked.push({ filename, exists: false, size: 0, ddlTokens: [] });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const size = content.length;

    if (size === 0) {
      report.errors.push(`Migration file is empty: ${filename}`);
    }

    // Inspect DDL keywords and structure
    const uppercaseContent = content.toUpperCase();
    const ddlTokens = [];

    if (uppercaseContent.includes('CREATE TABLE')) ddlTokens.push('CREATE TABLE');
    if (uppercaseContent.includes('ALTER TABLE')) ddlTokens.push('ALTER TABLE');
    if (uppercaseContent.includes('CREATE INDEX')) ddlTokens.push('CREATE INDEX');
    if (uppercaseContent.includes('ROW LEVEL SECURITY')) ddlTokens.push('ROW LEVEL SECURITY');
    if (uppercaseContent.includes('CREATE POLICY') || uppercaseContent.includes('POLICY')) ddlTokens.push('RLS POLICY');
    if (uppercaseContent.includes('JSONB')) ddlTokens.push('JSONB');

    report.filesChecked.push({
      filename,
      exists: true,
      size,
      ddlTokens
    });

    report.ddlSummary[filename] = {
      size,
      hasDDL: ddlTokens.length > 0,
      tokens: ddlTokens
    };
  }

  return report;
}

/**
 * Validates migration SQL content against expected schema definitions
 * @param {string} sqlContent
 * @param {string[]} requiredKeywords
 * @returns {{ valid: boolean, missingKeywords: string[] }}
 */
export function validateSQLContent(sqlContent, requiredKeywords = []) {
  if (!sqlContent || typeof sqlContent !== 'string') {
    return { valid: false, missingKeywords: requiredKeywords };
  }

  const normalized = sqlContent.toLowerCase();
  const missing = [];

  for (const kw of requiredKeywords) {
    if (!normalized.includes(kw.toLowerCase())) {
      missing.push(kw);
    }
  }

  return {
    valid: missing.length === 0,
    missingKeywords: missing
  };
}
