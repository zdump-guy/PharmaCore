/**
 * Marketing & Lead Magnet Engine for PharmaCore Expansion Suite Tests
 * Implements opaque-box models for Top Promo Bar, Countdown Timers,
 * Coupon validation, Lead Magnet preview evaluation, and Admin CMS schemas.
 */

export const DEFAULT_MARKETING_BANNER = {
  enabled: false,
  badge_en: 'Special Offer',
  badge_ar: 'عرض خاص',
  text_en: 'Get 30% off all clinical pharmacology masterclasses!',
  text_ar: 'احصل على خصم 30% على جميع مقررات الفارماكولوجي الإكلينيكي!',
  coupon_code: 'PHARMA30',
  target_date: '2026-12-31T23:59:59Z',
  cta_text_en: 'Explore Courses',
  cta_text_ar: 'استكشف المقررات',
  cta_url: '/courses',
};

export const DEFAULT_LEAD_MAGNET_CONFIG = {
  enabled: true,
  preview_all_first_lectures: true,
  modal_title_en: 'Unlock Full Pharmacology Curriculum',
  modal_title_ar: 'افتح المنهج الكامل لعلم الأدوية',
  modal_body_en: 'You are viewing a free preview lecture. Create a free account or enroll to access all clinical cases, quiz rationales, and earn verifiable certificates.',
  modal_body_ar: 'أنت تشاهد محاضرة تجريبية مجانية. أنشئ حسابًا مجانيًا أو سجل في المقرر للوصول إلى كافة الحالات الإكلينيكية وتعليلات الأسئلة والشهادات المعتمدة.',
};

/**
 * Calculates remaining time until target date
 */
export function calculateCountdown(targetDateStr, now = new Date()) {
  if (!targetDateStr) {
    return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };
  }

  const target = new Date(targetDateStr);
  const currentTime = typeof now === 'string' ? new Date(now) : now;

  if (isNaN(target.getTime()) || isNaN(currentTime.getTime())) {
    return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };
  }

  const diffMs = target.getTime() - currentTime.getTime();
  if (diffMs <= 0) {
    return { isExpired: true, totalSeconds: 0, days: 0, hours: 0, minutes: 0, seconds: 0, formatted: '00:00:00' };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  const formatted = days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    isExpired: false,
    totalSeconds,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  };
}

/**
 * Evaluates whether the promo banner should be visible given configuration,
 * dismiss state, and current timestamp.
 */
export function isBannerVisible(config, isDismissed = false, now = new Date()) {
  if (!config || typeof config !== 'object') return false;
  if (!config.enabled) return false;
  if (isDismissed) return false;
  if (config.target_date) {
    const countdown = calculateCountdown(config.target_date, now);
    if (countdown.isExpired) return false;
  }
  return true;
}

/**
 * Validates and normalizes coupon code copy actions
 */
export function processCouponCode(code) {
  if (!code || typeof code !== 'string') {
    return { valid: false, code: '', discountPercent: 0, message: 'Invalid coupon code' };
  }
  const cleanCode = code.trim().toUpperCase();
  if (cleanCode.length === 0) {
    return { valid: false, code: '', discountPercent: 0, message: 'Empty coupon code' };
  }

  // Derive discount percent from standard conventions or mock catalog
  let discountPercent = 10;
  if (cleanCode.includes('50')) discountPercent = 50;
  else if (cleanCode.includes('30')) discountPercent = 30;
  else if (cleanCode.includes('25')) discountPercent = 25;
  else if (cleanCode.includes('20')) discountPercent = 20;

  return {
    valid: true,
    code: cleanCode,
    discountPercent,
    message: `Coupon ${cleanCode} applied (${discountPercent}% off)`,
  };
}

/**
 * Evaluates whether a user/guest can access a specific lecture or requires conversion modal
 */
export function evaluateLectureAccess({
  lectureOrder = 1,
  isGuest = true,
  isEnrolled = false,
  leadMagnetConfig = DEFAULT_LEAD_MAGNET_CONFIG,
  courseAccessPolicy = 'open',
}) {
  if (!isGuest && isEnrolled) {
    return { canAccess: true, isPreview: false, showConversionModal: false };
  }

  if (courseAccessPolicy === 'open') {
    return { canAccess: true, isPreview: isGuest, showConversionModal: false };
  }

  if (leadMagnetConfig && leadMagnetConfig.enabled) {
    if (leadMagnetConfig.preview_all_first_lectures && lectureOrder === 1) {
      return { canAccess: true, isPreview: true, showConversionModal: false };
    }
  }

  return {
    canAccess: false,
    isPreview: false,
    showConversionModal: true,
    modalTitle: leadMagnetConfig?.modal_title_en || 'Enroll to Access',
  };
}

/**
 * Validates Marketing CMS settings payload
 */
export function validateMarketingConfigSchema(payload) {
  const errors = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload must be an object'] };
  }

  if (typeof payload.enabled !== 'boolean') {
    errors.push('enabled must be a boolean');
  }

  if (payload.text_en !== undefined && typeof payload.text_en !== 'string') {
    errors.push('text_en must be a string');
  }

  if (payload.text_ar !== undefined && typeof payload.text_ar !== 'string') {
    errors.push('text_ar must be a string');
  }

  if (payload.target_date !== undefined && payload.target_date !== null) {
    const d = new Date(payload.target_date);
    if (isNaN(d.getTime())) {
      errors.push('target_date must be a valid ISO date string');
    }
  }

  if (payload.coupon_code !== undefined && typeof payload.coupon_code !== 'string') {
    errors.push('coupon_code must be a string');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
