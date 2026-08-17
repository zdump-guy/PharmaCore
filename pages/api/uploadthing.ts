import type { NextApiRequest, NextApiResponse } from "next"
import { createRouteHandler } from "uploadthing/next-legacy"
import { ourFileRouter } from "@/server/uploadthing"

const handler = createRouteHandler({
  router: ourFileRouter,
})

export default async function uploadthingApi(req: NextApiRequest, res: NextApiResponse) {
  const token = (process.env.UPLOADTHING_TOKEN || process.env.UPLOADTHING_SECRET || "").trim()

  if (!token || token.length < 10) {
    if (req.method === "GET") {
      try {
        return await handler(req, res)
      } catch {
        return res.status(200).json([])
      }
    }

    return res.status(400).json({
      error: "UPLOADTHING_TOKEN_MISSING",
      message:
        "Uploadthing API token is missing or not configured. Please add UPLOADTHING_TOKEN to your .env.local file to enable direct uploads, or paste a link.",
    })
  }

  try {
    return await handler(req, res)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return res.status(400).json({
      error: "UPLOAD_ERROR",
      message: msg,
    })
  }
}
