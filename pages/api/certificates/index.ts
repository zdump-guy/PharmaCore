import type { NextApiRequest, NextApiResponse } from "next"
import { supabaseAdmin } from "@/lib/supabaseAdmin"
import { getUserCertificates } from "@/lib/certificates"

async function authorizeUser(req: NextApiRequest) {
  if (!supabaseAdmin) return { error: "Supabase not configured", status: 503 } as const
  const authHeader = req.headers.authorization
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null
  if (!token) return { error: "Unauthorized", status: 401 } as const

  const {
    data: { user },
    error
  } = await supabaseAdmin.auth.getUser(token)

  if (error || !user) return { error: "Unauthorized", status: 401 } as const
  return { user, status: 200 } as const
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const auth = await authorizeUser(req)
  if ("error" in auth) {
    return res.status(auth.status).json({ error: auth.error })
  }

  const userId = auth.user.id
  try {
    const certificates = await getUserCertificates(userId)
    return res.status(200).json({ certificates })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load certificates"
    return res.status(500).json({ error: msg })
  }
}
