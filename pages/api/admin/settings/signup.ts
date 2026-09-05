import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { loadSiteContent, mergeSiteContent } from "@/lib/siteContent"
import type { EnrollmentSettings } from "@/types"

const universitySchema = z.object({
  id: z.string(),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
})

const facultySchema = z.object({
  id: z.string(),
  name_en: z.string().min(1),
  name_ar: z.string().min(1),
  duration_years: z.number().int().min(1).max(10),
})

const settingsBodySchema = z.object({
  enrollment_settings: z.object({
    signup_mode: z.enum(["approval_required", "open_registration", "admin_provisioned"]),
    universities: z.array(universitySchema),
    faculties: z.array(facultySchema),
  }),
})

async function authorizeStaff(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase is not configured", status: 503 } as const
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return { error: "Unauthorized", status: 401 } as const

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()
  if (!profile || !["dev", "super_admin"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase is not configured" })
    }

    const siteContent = await loadSiteContent()
    return res.status(200).json({
      enrollment_settings: siteContent.enrollment_settings,
    })
  }

  if (req.method === "POST" || req.method === "PUT") {
    const parsed = settingsBodySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      })
    }

    const staff = await authorizeStaff(req)
    if ("error" in staff) {
      return res.status(staff.status).json({ error: staff.error })
    }

    if (!supabaseAdmin) {
      return res.status(503).json({ error: "Supabase is not configured" })
    }

    try {
      const { enrollment_settings } = parsed.data as { enrollment_settings: EnrollmentSettings }

      const currentContent = await loadSiteContent()
      const updatedContent = mergeSiteContent({
        ...currentContent,
        enrollment_settings,
      })

      const { error } = await supabaseAdmin
        .from("site_content")
        .upsert({ id: "main", content: updatedContent }, { onConflict: "id" })

      if (error) throw error

      return res.status(200).json({
        success: true,
        message: "Enrollment & signup settings saved successfully!",
        enrollment_settings: updatedContent.enrollment_settings,
      })
    } catch (err) {
      console.error("Save enrollment settings error:", err)
      return res.status(500).json({ error: "Failed to save enrollment settings" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
