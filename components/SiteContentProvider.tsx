import { createContext, useContext, useState, type ReactNode } from "react"
import { defaultSiteContent, mergeSiteContent, type SiteContent } from "@/lib/siteContent"

const SiteContentContext = createContext<SiteContent>(defaultSiteContent)

export function SiteContentProvider({ children, initialContent }: { children: ReactNode; initialContent?: SiteContent }) {
  const [content] = useState(() => mergeSiteContent(initialContent))

  return <SiteContentContext.Provider value={content}>{children}</SiteContentContext.Provider>
}

export const useSiteContent = () => useContext(SiteContentContext)
