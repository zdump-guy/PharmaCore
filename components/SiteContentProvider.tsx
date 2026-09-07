import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react"
import {
  defaultSiteContent,
  loadSiteContent,
  mergeSiteContent,
  type SiteContent,
} from "@/lib/siteContent"

const SiteContentContext = createContext<SiteContent>(defaultSiteContent)

export function SiteContentProvider({
  children,
  initialContent,
}: {
  children: ReactNode
  initialContent?: SiteContent
}) {
  const [content, setContent] = useState<SiteContent>(() =>
    mergeSiteContent(initialContent)
  )

  // Sync when initialContent changes across navigations
  useEffect(() => {
    if (initialContent) {
      setContent(mergeSiteContent(initialContent))
    }
  }, [initialContent])

  // Only fetch if no initialContent was provided from SSR/SSG
  useEffect(() => {
    if (initialContent) return

    let isMounted = true
    loadSiteContent()
      .then((latest) => {
        if (isMounted && latest) {
          setContent(latest)
        }
      })
      .catch(() => {
        // Suppress
      })

    return () => {
      isMounted = false
    }
  }, [initialContent])

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  )
}

export const useSiteContent = () => useContext(SiteContentContext)
