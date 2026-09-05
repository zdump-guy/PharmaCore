import type { NextApiRequest, NextApiResponse } from "next"
import { z } from "zod"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import type { UserRole } from "@/types"

const updateSchema = z.object({
  userId: z.string().uuid(),
  full_name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  role: z.enum(["dev", "super_admin", "mentor"]).optional(),
  password: z.union([z.string().min(8).max(128), z.literal("")]).optional(),
  banned: z.boolean().optional(),
}).refine((value) => Object.keys(value).some((key) => key !== "userId"), {
  message: "No changes supplied",
})

const deleteSchema = z.object({ userId: z.string().uuid() })

async function authorize(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase is not configured", status: 503 } as const
  const header = req.headers.authorization
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !user) return { error: "Unauthorized", status: 401 } as const

  const { data: profile } = await supabaseAdmin.from("users").select("role").eq("id", user.id).single()
  if (!profile || !["dev", "super_admin"].includes(profile.role)) {
    return { error: "Forbidden", status: 403 } as const
  }

  return { user, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const requester = await authorize(req)
  if ("error" in requester) return res.status(requester.status).json({ error: requester.error })
  if (!supabaseAdmin) return res.status(503).json({ error: "Supabase is not configured" })

  if (req.method === "GET") {
    const [{ data: authData, error: authError }, { data: profiles, error: profileError }] = await Promise.all([
      supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      supabaseAdmin.from("users").select("id, email, full_name, role, created_at"),
    ])
    if (authError || profileError) return res.status(500).json({ error: authError?.message ?? profileError?.message })

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const users = authData.users
      .map((user) => {
        const profile = profileMap.get(user.id)
        return {
          id: user.id,
          email: profile?.email ?? user.email ?? "",
          full_name: profile?.full_name ?? user.user_metadata?.full_name ?? null,
          role: (profile?.role ?? user.user_metadata?.role ?? "student") as UserRole,
          created_at: profile?.created_at ?? user.created_at,
          last_sign_in_at: user.last_sign_in_at ?? null,
          banned_until: user.banned_until ?? null,
        }
      })
      .filter((u) => ["dev", "super_admin", "mentor"].includes(u.role))
    return res.status(200).json({ users })
  }

  if (req.method === "PATCH") {
    const parsed = updateSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() })
    const { userId, full_name, email, role, password, banned } = parsed.data

    const [{ data: targetData, error: targetError }, { data: oldProfile }] = await Promise.all([
      supabaseAdmin.auth.admin.getUserById(userId),
      supabaseAdmin.from("users").select("email, full_name, role").eq("id", userId).maybeSingle(),
    ])
    if (targetError || !targetData.user) return res.status(404).json({ error: "User not found" })
    if (requester.user.id === userId && (banned === true || (role && role !== oldProfile?.role))) {
      return res.status(400).json({ error: "You cannot suspend or change the role of your own account" })
    }

    const nextEmail = email ?? oldProfile?.email ?? targetData.user.email ?? ""
    const nextName = full_name ?? oldProfile?.full_name ?? targetData.user.user_metadata?.full_name ?? null
    const nextRole = role ?? oldProfile?.role ?? "mentor"
    const profileChanged = full_name !== undefined || email !== undefined || role !== undefined

    if (profileChanged) {
      const { error: profileUpdateError } = await supabaseAdmin.from("users").upsert({
        id: userId,
        email: nextEmail,
        full_name: nextName,
        role: nextRole,
      })
      if (profileUpdateError) return res.status(400).json({ error: profileUpdateError.message })
    }

    const authUpdates: {
      email?: string
      password?: string
      user_metadata?: Record<string, unknown>
      ban_duration?: string
    } = {}
    if (email !== undefined) authUpdates.email = email
    if (password) authUpdates.password = password
    if (full_name !== undefined) authUpdates.user_metadata = { ...targetData.user.user_metadata, full_name }
    if (banned !== undefined) authUpdates.ban_duration = banned ? "876000h" : "none"

    if (Object.keys(authUpdates).length) {
      const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(userId, authUpdates)
      if (authUpdateError) {
        if (profileChanged && oldProfile) {
          await supabaseAdmin.from("users").update(oldProfile).eq("id", userId)
        }
        return res.status(400).json({ error: authUpdateError.message })
      }
    }

    return res.status(200).json({ message: "User updated successfully" })
  }

  if (req.method === "DELETE") {
    const parsed = deleteSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: "Invalid input", details: parsed.error.flatten() })
    if (parsed.data.userId === requester.user.id) {
      return res.status(400).json({ error: "You cannot delete your own account" })
    }
    const { error } = await supabaseAdmin.auth.admin.deleteUser(parsed.data.userId)
    if (error) return res.status(400).json({ error: error.message })
    return res.status(200).json({ message: "User deleted successfully" })
  }

  res.setHeader("Allow", "GET, PATCH, DELETE")
  return res.status(405).json({ error: "Method not allowed" })
}
