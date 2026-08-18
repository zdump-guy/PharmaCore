import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

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
  if (!profile || !["dev", "super_admin", "mentor"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const
  }

  return { user, profile, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const staff = await authorizeStaff(req)
  if ("error" in staff) {
    return res.status(staff.status).json({ error: staff.error })
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: "Supabase not configured" })
  }

  // ─── GET: List and filter students ──────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const search = (req.query.search as string) || ""
      const statusFilter = (req.query.status as string) || "all"
      const universityFilter = (req.query.university as string) || "all"

      let query = supabaseAdmin
        .from("users")
        .select("*")
        .eq("role", "student")
        .order("created_at", { ascending: false })

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter)
      }
      if (universityFilter !== "all") {
        query = query.eq("university", universityFilter)
      }

      const { data: students, error } = await query

      if (error) {
        // Table might have older schema without status column, fallback to role='student'
        const { data: fallbackStudents } = await supabaseAdmin
          .from("users")
          .select("*")
          .eq("role", "student")
        return res.status(200).json({
          students: fallbackStudents || [],
          stats: {
            total: fallbackStudents?.length || 0,
            active: fallbackStudents?.length || 0,
            pending: 0,
            suspended: 0,
          },
        })
      }

      let filtered = students || []
      if (search) {
        const s = search.toLowerCase()
        filtered = filtered.filter(
          (u) =>
            u.full_name?.toLowerCase().includes(s) ||
            u.first_name?.toLowerCase().includes(s) ||
            u.last_name?.toLowerCase().includes(s) ||
            u.email?.toLowerCase().includes(s) ||
            u.phone_number?.includes(s) ||
            u.university?.toLowerCase().includes(s)
        )
      }

      const total = (students || []).length
      const active = (students || []).filter((s) => s.status === "active" || !s.status).length
      const pending = (students || []).filter((s) => s.status === "pending").length
      const suspended = (students || []).filter((s) => s.status === "suspended").length
      const needsSetup = (students || []).filter((s) => s.status === "needs_setup").length

      return res.status(200).json({
        students: filtered,
        stats: {
          total,
          active,
          pending,
          suspended,
          needsSetup,
        },
      })
    } catch (err) {
      console.error("Admin list students error:", err)
      return res.status(500).json({ error: "Failed to list students" })
    }
  }

  // ─── POST: Actions (Approve, Reject, Suspend, Provision generic) ──────────
  if (req.method === "POST") {
    const { action, studentId, studentIds, studentData } = req.body

    try {
      if (action === "approve") {
        const ids = studentIds || (studentId ? [studentId] : [])
        if (!ids.length) return res.status(400).json({ error: "No student ID provided" })

        const { error } = await supabaseAdmin
          .from("users")
          .update({ status: "active" })
          .in("id", ids)

        if (error) throw error
        return res.status(200).json({ success: true, message: `Approved ${ids.length} student(s).` })
      }

      if (action === "reject") {
        const ids = studentIds || (studentId ? [studentId] : [])
        if (!ids.length) return res.status(400).json({ error: "No student ID provided" })

        for (const id of ids) {
          await supabaseAdmin.auth.admin.deleteUser(id)
          await supabaseAdmin.from("users").delete().eq("id", id)
        }
        return res.status(200).json({ success: true, message: `Rejected and removed ${ids.length} student(s).` })
      }

      if (action === "suspend") {
        if (!studentId) return res.status(400).json({ error: "Missing student ID" })
        const targetStatus = req.body.status || "suspended"

        const { error } = await supabaseAdmin
          .from("users")
          .update({ status: targetStatus })
          .eq("id", studentId)

        if (error) throw error
        return res.status(200).json({ success: true, message: `Status updated to ${targetStatus}` })
      }

      if (action === "provision") {
        // Provision a generic student account
        const {
          email,
          password,
          first_name,
          last_name,
          university,
          faculty,
          start_year,
          must_change_password,
        } = studentData || {}

        if (!email?.trim() || !password) {
          return res.status(400).json({ error: "Email and temporary password are required" })
        }

        const fullName = first_name && last_name ? `${first_name.trim()} ${last_name.trim()}` : "Student Member"
        const cleanEmail = String(email).trim().toLowerCase()

        const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            first_name: first_name?.trim() || "",
            last_name: last_name?.trim() || "",
            role: "student",
          },
        })

        if (authErr || !authUser.user) {
          return res.status(400).json({ error: authErr?.message || "Failed to provision student in Auth" })
        }

        const newUserId = authUser.user.id
        const profilePayload: Record<string, unknown> = {
          id: newUserId,
          email: cleanEmail,
          full_name: fullName,
          first_name: first_name?.trim() || null,
          last_name: last_name?.trim() || null,
          university: university || null,
          faculty: faculty || null,
          start_year: Number(start_year) || null,
          role: "student",
          status: must_change_password ? "needs_setup" : "active",
          must_change_password: Boolean(must_change_password),
        }

        await supabaseAdmin.from("users").upsert(profilePayload, { onConflict: "id" })

        return res.status(200).json({
          success: true,
          message: "Student provisioned successfully!",
          student: {
            id: newUserId,
            email: cleanEmail,
            full_name: fullName,
            must_change_password: Boolean(must_change_password),
          },
        })
      }

      if (action === "batch_provision") {
        const {
          count = 5,
          prefix = "student",
          domain = "pharmacore.edu",
          password = "Pharma@2026",
          university,
          faculty,
          start_year,
          must_change_password = true,
        } = req.body.batchData || {}

        const parsedCount = Math.max(1, Math.min(100, Number(count) || 5))
        const cleanPrefix = (String(prefix).trim() || "student").toLowerCase().replace(/[^a-z0-9_-]/g, "")
        const cleanDomain = (String(domain).trim() || "pharmacore.edu").toLowerCase().replace(/[^a-z0-9.-]/g, "")
        const batchTag = Date.now().toString().slice(-4)

        const createdStudents = []
        const errors = []

        for (let i = 1; i <= parsedCount; i++) {
          const randHex = Math.random().toString(36).substring(2, 6)
          const padIdx = String(i).padStart(2, "0")
          const generatedEmail = `${cleanPrefix}_${batchTag}_${padIdx}_${randHex}@${cleanDomain}`
          const userPass = password || `Pharma@${Math.floor(1000 + Math.random() * 9000)}`
          const fullName = `Student Member #${padIdx}`

          try {
            const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
              email: generatedEmail,
              password: userPass,
              email_confirm: true,
              user_metadata: {
                full_name: fullName,
                role: "student",
              },
            })

            if (authErr || !authUser.user) {
              errors.push({ email: generatedEmail, error: authErr?.message || "Auth failure" })
              continue
            }

            const newUserId = authUser.user.id
            const profilePayload = {
              id: newUserId,
              email: generatedEmail,
              full_name: fullName,
              university: university || null,
              faculty: faculty || null,
              start_year: Number(start_year) || new Date().getFullYear(),
              role: "student",
              status: must_change_password ? "needs_setup" : "active",
              must_change_password: Boolean(must_change_password),
            }

            await supabaseAdmin.from("users").upsert(profilePayload, { onConflict: "id" })

            createdStudents.push({
              id: newUserId,
              email: generatedEmail,
              password: userPass,
              university: university || "—",
              faculty: faculty || "—",
              start_year: Number(start_year) || new Date().getFullYear(),
              status: must_change_password ? "needs_setup" : "active",
              created_at: new Date().toISOString(),
            })
          } catch (e) {
            errors.push({ email: generatedEmail, error: e instanceof Error ? e.message : "Error" })
          }
        }

        return res.status(200).json({
          success: true,
          message: `Successfully provisioned ${createdStudents.length} student account(s).`,
          students: createdStudents,
          errors: errors.length ? errors : undefined,
        })
      }

      return res.status(400).json({ error: "Invalid action" })
    } catch (err) {
      console.error("Admin student action error:", err)
      return res.status(500).json({ error: "Failed to execute student action" })
    }
  }

  // ─── DELETE: Delete a student account ─────────────────────────────────────
  if (req.method === "DELETE") {
    const { studentId } = req.body
    if (!studentId) return res.status(400).json({ error: "Missing student ID" })

    try {
      await supabaseAdmin.auth.admin.deleteUser(studentId)
      await supabaseAdmin.from("users").delete().eq("id", studentId)
      return res.status(200).json({ success: true, message: "Student account deleted" })
    } catch (err) {
      console.error("Delete student error:", err)
      return res.status(500).json({ error: "Failed to delete student account" })
    }
  }

  return res.status(405).json({ error: "Method not allowed" })
}
