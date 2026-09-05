import type { NextApiRequest } from "next"
import { createUploadthing, type FileRouter } from "uploadthing/next-legacy"
import { UploadThingError } from "uploadthing/server"
import { supabaseAdmin } from "@/lib/supabaseAdmin"

const f = createUploadthing()

/**
 * Validates Supabase Auth Bearer token and verifies user has a staff role
 * ('dev', 'super_admin', or 'mentor'). Throws UploadThingError with UNAUTHORIZED or FORBIDDEN.
 */
export async function authorizeStaffUpload({ req }: { req: NextApiRequest }) {
  const authHeader = req?.headers?.authorization
  if (!authHeader) {
    throw new UploadThingError({
      code: "UNAUTHORIZED" as unknown as "FORBIDDEN",
      message: "Authentication required to upload media",
    })
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim()
  if (!token) {
    throw new UploadThingError({
      code: "UNAUTHORIZED" as unknown as "FORBIDDEN",
      message: "Authorization token is missing",
    })
  }

  if (!supabaseAdmin) {
    throw new UploadThingError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Authentication service unavailable",
    })
  }

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(token)

  if (authError || !user) {
    throw new UploadThingError({
      code: "UNAUTHORIZED" as unknown as "FORBIDDEN",
      message: "Invalid or expired session token",
    })
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profileError || !profile || !["dev", "super_admin", "mentor"].includes(profile.role)) {
    throw new UploadThingError({
      code: "FORBIDDEN",
      message: "Forbidden: Only staff (dev, super_admin, mentor) can upload media",
    })
  }

  return { userId: user.id, role: profile.role }
}

export const ourFileRouter = {
  // Course cover image uploader
  courseImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(authorizeStaffUpload)
    .onUploadComplete(async ({ file, metadata }) => {
      return { url: file.url, name: file.name, size: file.size, uploadedBy: metadata?.userId }
    }),

  // Lecture resources: PDFs, Diagrams, Documents
  lectureResource: f({
    pdf: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    blob: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    .middleware(authorizeStaffUpload)
    .onUploadComplete(async ({ file, metadata }) => {
      return { url: file.url, name: file.name, size: file.size, uploadedBy: metadata?.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

