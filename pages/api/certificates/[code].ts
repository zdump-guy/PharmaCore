import type { NextApiRequest, NextApiResponse } from "next"
import { lookupCertificateByCode } from "@/lib/certificates"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { code } = req.query
  const codeStr = Array.isArray(code) ? code[0] : code

  if (!codeStr || typeof codeStr !== "string") {
    return res.status(400).json({ error: "Missing or invalid certificate code" })
  }

  const result = await lookupCertificateByCode(codeStr)

  if (!result.verified || !result.certificate) {
    return res.status(404).json({
      verified: false,
      error: result.error || "Certificate not found or invalid"
    })
  }

  return res.status(200).json({
    verified: true,
    certificate: result.certificate
  })
}
