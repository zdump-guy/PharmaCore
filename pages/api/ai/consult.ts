import type { NextApiRequest, NextApiResponse } from "next"
import { supabase } from "@/lib/supabaseClient"
import { loadSiteContent } from "@/lib/siteContent"
import { resolveCourseFeatures } from "@/lib/featureFlags"
import { handleAIConsultRequest } from "@/lib/clinicalCalculators"
import type { AIConsultRequest } from "@/types"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"])
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` })
  }

  try {
    const body = req.body as AIConsultRequest
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "Invalid consultation request body" })
    }

    const { tool_type, prompt, context } = body

    if (!tool_type || !["general_consult", "dose_calculator", "interaction_checker", "lecture_qa"].includes(tool_type)) {
      return res.status(400).json({ error: `Invalid tool_type: "${tool_type}"` })
    }

    // 1. Resolve feature flags (Global + Course-level override if course context is available)
    const siteContent = await loadSiteContent()
    let courseOverrides = null

    if (context?.lecture_id && supabase) {
      try {
        const { data: lec } = await supabase
          .from("lectures")
          .select("course_id, courses(feature_overrides)")
          .eq("id", context.lecture_id)
          .maybeSingle()
        if (lec?.courses) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          courseOverrides = (lec.courses as any).feature_overrides
        }
      } catch {
        // Fall back to global flags
      }
    }

    const resolvedFeatures = resolveCourseFeatures(siteContent.features, courseOverrides)
    if (!resolvedFeatures.ai_assistant) {
      return res.status(403).json({
        error: "AI Clinical Assistant is disabled on this platform/course",
        status: "disabled",
      })
    }

    // 2. Execute clinical pharmacology calculation / QA engine
    const consultResponse = handleAIConsultRequest(body)

    // 3. Log consultation session to database asynchronously (non-blocking)
    if (supabase) {
      try {
        // Get user session if auth header is present
        let userId: string | null = null
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.replace("Bearer ", "")
          const { data: userData } = await supabase.auth.getUser(token)
          if (userData?.user?.id) {
            userId = userData.user.id
          }
        }

        await supabase.from("ai_consultations").insert({
          user_id: userId,
          lecture_id: context?.lecture_id || null,
          tool_type,
          prompt: prompt || tool_type,
          response: consultResponse.clinical_guidance,
          patient_context: context?.patient_data || null,
        })
      } catch (logErr) {
        console.error("Failed to log AI consultation to database:", logErr)
      }
    }

    return res.status(200).json({
      success: true,
      ...consultResponse,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal consultation processing error"
    return res.status(400).json({
      error: message,
      status: "error",
    })
  }
}
