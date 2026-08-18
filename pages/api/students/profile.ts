import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { loadSiteContent } from "@/lib/siteContent"

async function authorizeUser(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase not configured", status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return { error: "Unauthorized", status: 401 } as const

  const { data: profile } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single()

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const { user, profile } = auth

  if (req.method === "GET") {
    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        profile: profile || {
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || null,
          role: user.user_metadata?.role || "student",
          status: "active",
        },
      },
    })
  }

  if (req.method === "PUT" || req.method === "POST") {
    try {
      const {
        first_name,
        last_name,
        email,
        phone_number,
        university,
        faculty,
        start_year,
        password,
      } = req.body

      const cleanEmail = email ? String(email).trim().toLowerCase() : user.email
      const fullName = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : profile?.full_name || null
      const startYearNum = Number(start_year) || profile?.start_year || new Date().getFullYear()

      const siteContent = await loadSiteContent()
      const matchedFaculty = siteContent.enrollment_settings?.faculties?.find(
        (f) => f.name_en === faculty || f.name_ar === faculty || f.id === faculty
      )
      const durationYears = matchedFaculty?.duration_years || 5
      const predictedEndYear = startYearNum + durationYears

      // Update Supabase Auth if email or password changed
      const authUpdates: { email?: string; password?: string; user_metadata?: Record<string, unknown> } = {
        user_metadata: {
          ...user.user_metadata,
          full_name: fullName,
          first_name: first_name?.trim(),
          last_name: last_name?.trim(),
        },
      }
      if (cleanEmail && cleanEmail !== user.email) {
        authUpdates.email = cleanEmail
      }
      if (password && password.length >= 6) {
        authUpdates.password = password
      }

      if (supabaseAdmin) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, authUpdates)

        // Update profile in users table
        const profileUpdates: Record<string, unknown> = {
          email: cleanEmail,
          full_name: fullName,
          first_name: first_name?.trim() || null,
          last_name: last_name?.trim() || null,
          phone_number: phone_number ? String(phone_number).trim() : null,
          university: university || null,
          faculty: faculty || null,
          start_year: startYearNum,
          predicted_end_year: predictedEndYear,
          status: profile?.status === "needs_setup" ? "active" : profile?.status || "active",
          must_change_password: false,
        }

        const { data: updatedProfile, error: updateError } = await supabaseAdmin
          .from("users")
          .update(profileUpdates)
          .eq("id", user.id)
          .select()
          .single()

        if (updateError) {
          // Fallback if specific columns not migrated yet
          await supabaseAdmin
            .from("users")
            .update({ full_name: fullName, email: cleanEmail })
            .eq("id", user.id)
        }

        return res.status(200).json({
          success: true,
          message: "Profile updated successfully!",
          profile: updatedProfile || { ...profile, ...profileUpdates },
        })
      }

      return res.status(200).json({ success: true })
    } catch (err) {
      console.error("Profile update error:", err)
      return res.status(500).json({ error: "Failed to update profile" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
