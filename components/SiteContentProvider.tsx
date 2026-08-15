import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { defaultSiteContent, mergeSiteContent, type SiteContent } from "@/lib/siteContent"
import { supabase } from "@/lib/supabaseClient"

const SiteContentContext = createContext<SiteContent>(defaultSiteContent)

export function SiteContentProvider({ children, initialContent }: { children: ReactNode; initialContent?: SiteContent }) {
  const [content, setContent] = useState(() => mergeSiteContent(initialContent))

  useEffect(() => {
    if (!supabase) return
    void supabase.from("site_content").select("content").eq("id", "main").maybeSingle().then(({ data }) => {
      if (data?.content) setContent(mergeSiteContent(data.content as Partial<SiteContent>))
    })
  }, [])

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
}

export const useSiteContent = () => useContext(SiteContentContext)
