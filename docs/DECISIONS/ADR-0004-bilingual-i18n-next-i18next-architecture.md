# ADR-0004 — Bilingual Arabic/English Architecture with RTL Support

## Status
Accepted

## Date
2026-08-22

## Context
PharmaCore targets Arabic-speaking pharmacy students and international learners, requiring complete bilingual support (Arabic as default with RTL text direction; English with LTR text direction).

## Decision
We implemented `next-i18next` with dictionary files located in `public/locales/ar/` and `public/locales/en/`, paired with Google Fonts `Tajawal` (Arabic) and `Inter` (English).

## Rationale
- First-class RTL/LTR dynamic switching.
- Clean JSON translation files organized by namespace.
- Native Next.js localized sub-path routing (`/` for Arabic, `/en` for English).
