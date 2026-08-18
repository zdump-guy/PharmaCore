import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { loadSiteContent, mergeSiteContent } from "@/lib/siteContent"
import type { EnrollmentSettings } from "@/types"

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
    return { error: "Forbidden", status: 203 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const staff = await authorizeStaff(req)
  if ("error" in staff) {
    return res.status(staff.status).json({ error: staff.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase is not configured" })
  }

  if (req.method === "GET") {
    const siteContent = await loadSiteContent()
    return res.status(200).json({
      enrollment_settings: siteContent.enrollment_settings,
    })
  }

  if (req.method === "POST" || req.method === "PUT") {
    try {
      const { enrollment_settings } = req.body as { enrollment_settings: EnrollmentSettings }

      if (!enrollment_settings) {
        return res.status(400).json({ error: "Missing enrollment_settings data" })
      }

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
