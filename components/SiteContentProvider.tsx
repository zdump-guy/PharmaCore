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
import { supabase } from "@/lib/supabaseClient"

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

  // Fetch live site content on mount and listen to realtime updates
  useEffect(() => {
    let isMounted = true

    // Fetch latest directly from Supabase
    loadSiteContent().then((latest) => {
      if (isMounted && latest) {
        setContent(latest)
      }
    })

    // Supabase Realtime Listener for instant global maintenance & content sync
    if (supabase) {
      try {
        const channel = supabase
          .channel("public:site_content_sync")
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "site_content" },
            (payload) => {
              if (
                payload.new &&
                typeof payload.new === "object" &&
                "content" in payload.new
              ) {
                const newContent = (payload.new as { content: Partial<SiteContent> })
                  .content
                if (newContent && isMounted) {
                  setContent(mergeSiteContent(newContent))
                }
              }
            }
          )
          .subscribe()

        return () => {
          isMounted = false
          supabase?.removeChannel(channel)
        }
      } catch {
        // Continue if realtime fails
      }
    }

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  )
}

export const useSiteContent = () => useContext(SiteContentContext)
