import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { loadSiteContent } from "@/lib/siteContent"
import { verifyTurnstileToken, extractClientIp } from "@/lib/turnstile"
import { checkRateLimit } from "@/lib/rateLimit"

const signupSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required").max(60),
  last_name: z.string().trim().min(1, "Last name is required").max(60),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters long").max(128),
  phone_number: z.string().trim().max(30).optional().nullable(),
  university: z.string().trim().max(100).optional().nullable(),
  faculty: z.string().trim().max(100).optional().nullable(),
  start_year: z.union([z.number(), z.string()]).optional(),
  turnstileToken: z.string().optional().nullable(),
})

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  if (!checkRateLimit(req, res, { limit: 5, windowMs: 60_000, prefix: "signup" })) {
    return
  }

  const parsed = signupSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({
      error: "Invalid request payload",
      details: parsed.error.flatten(),
    })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Authentication service unavailable" })
  }

  try {
    const siteContent = await loadSiteContent()
    const enrollmentSettings = siteContent.enrollment_settings || {
      signup_mode: "approval_required",
      universities: [],
      faculties: [],
    }

    if (enrollmentSettings.signup_mode === "admin_provisioned") {
      return res.status(403).json({
        error: "Public registration is currently closed. Accounts are provisioned by administration.",
        error_ar: "التسجيل العام مغلق حاليًا. يتم إنشاء الحسابات من قِبل إدارة المنصة.",
      })
    }

    const {
      first_name,
      last_name,
      email,
      password,
      phone_number,
      university,
      faculty,
      start_year,
      turnstileToken,
    } = parsed.data

    // 1. Cloudflare Turnstile Bot & Spam Verification
    const clientIp = extractClientIp(req)
    const turnstileResult = await verifyTurnstileToken({
      token: turnstileToken,
      remoteIp: clientIp,
      expectedAction: "student_signup",
    })

    if (!turnstileResult.success) {
      return res.status(403).json({
        error: "Security verification failed. Please refresh and try again.",
        error_ar: "فشل التحقق الأمني من النشاط التلقائي. يرجى إعادة المحاولة.",
      })
    }

    const cleanEmail = String(email).trim().toLowerCase()
    const cleanPhone = String(phone_number || "").trim()
    const startYearNum = Number(start_year) || new Date().getFullYear()

    // Find faculty duration to compute predicted graduation year
    const matchedFaculty = enrollmentSettings.faculties?.find(
      (f) => f.name_en === faculty || f.name_ar === faculty || f.id === faculty
    )
    const durationYears = matchedFaculty?.duration_years || 5
    const predictedEndYear = startYearNum + durationYears

    // Determine initial status based on admin enrollment policy
    const initialStatus = enrollmentSettings.signup_mode === "approval_required" ? "pending" : "active"
    const fullName = `${first_name.trim()} ${last_name.trim()}`

    // 1. Create Supabase Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true, // Auto-confirm email so student can immediately log in (pending review if approval mode)
      user_metadata: {
        full_name: fullName,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        role: "student",
      },
    })

    if (authError || !authData.user) {
      if (authError?.message?.includes("already registered") || authError?.message?.includes("already been registered")) {
        return res.status(409).json({
          error: "An account with this email address already exists. Please sign in.",
          error_ar: "يوجد حساب مسجل بالفعل بهذا البريد الإلكتروني. يرجى تسجيل الدخول.",
        })
      }
      return res.status(400).json({ error: authError?.message || "Failed to create user account" })
    }

    const userId = authData.user.id

    // 2. Insert or Upsert into public.users profile table
    const profilePayload: Record<string, unknown> = {
      id: userId,
      email: cleanEmail,
      full_name: fullName,
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      phone_number: cleanPhone,
      university: university || null,
      faculty: faculty || null,
      start_year: startYearNum,
      predicted_end_year: predictedEndYear,
      role: "student",
      status: initialStatus,
      must_change_password: false,
    }

    const { error: profileError } = await supabaseAdmin
      .from("users")
      .upsert(profilePayload, { onConflict: "id" })

    if (profileError) {
      // Fallback if specific columns not migrated yet
      console.warn("Retrying profile insert with base columns due to schema:", profileError.message)
      await supabaseAdmin.from("users").upsert(
        {
          id: userId,
          email: cleanEmail,
          full_name: fullName,
          role: "student",
        },
        { onConflict: "id" }
      )
    }

    return res.status(200).json({
      success: true,
      status: initialStatus,
      message:
        initialStatus === "pending"
          ? "Registration submitted successfully! Your account is pending administrator approval."
          : "Account created successfully! You can now log in.",
      message_ar:
        initialStatus === "pending"
          ? "تم إرسال طلب التسجيل بنجاح! حسابك قيد مراجعة واعتماد الإدارة."
          : "تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.",
      user: {
        id: userId,
        email: cleanEmail,
        full_name: fullName,
        status: initialStatus,
      },
    })
  } catch (err) {
    console.error("Student Signup API Error:", err)
    return res.status(500).json({ error: "Internal server error during registration" })
  }
}
