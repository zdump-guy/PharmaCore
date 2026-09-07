import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import type { UserProfile } from "@/types"

export interface AuthContextValue {
  user: User | null
  profile: UserProfile | null
  session: Session | null
  token: string | null
  role: string
  fullName: string
  isStaff: boolean
  isAuthenticated: boolean
  loading: boolean
  refreshAuth: () => Promise<void>
  signOut: () => Promise<void>
}

const defaultAuthContext: AuthContextValue = {
  user: null,
  profile: null,
  session: null,
  token: null,
  role: "guest",
  fullName: "",
  isStaff: false,
  isAuthenticated: false,
  loading: true,
  refreshAuth: async () => {},
  signOut: async () => {},
}

const AuthContext = createContext<AuthContextValue>(defaultAuthContext)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    if (!supabase) return null
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      if (!error && data) {
        return data as UserProfile
      }
    } catch {}

    // Fallback profile from user metadata if table query is pending or restricted
    if (currentUser) {
      return {
        id: currentUser.id,
        email: currentUser.email || "",
        full_name: currentUser.user_metadata?.full_name || currentUser.email?.split("@")[0] || "User",
        role: currentUser.user_metadata?.role || "student",
        status: "active",
      } as UserProfile
    }
    return null
  }, [])

  const refreshAuth = useCallback(async () => {
    if (!supabase) {
      setLoading(false)
      return
    }
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession()

      setSession(currentSession)
      setUser(currentSession?.user ?? null)

      if (currentSession?.user) {
        const prof = await fetchProfile(currentSession.user.id, currentSession.user)
        setProfile(prof)
      } else {
        setProfile(null)
      }
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [fetchProfile])

  useEffect(() => {
    refreshAuth()

    if (!supabase) return

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession)
      setUser(newSession?.user ?? null)

      if (newSession?.user) {
        const prof = await fetchProfile(newSession.user.id, newSession.user)
        setProfile(prof)
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshAuth, fetchProfile])

  const signOut = useCallback(async () => {
    if (!supabase) return
    try {
      await supabase.auth.signOut()
    } catch {}
    setSession(null)
    setUser(null)
    setProfile(null)
  }, [])

  const role = profile?.role || user?.user_metadata?.role || (user ? "student" : "guest")
  const fullName =
    profile?.full_name ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    ""
  const isStaff = ["dev", "super_admin", "mentor"].includes(role)
  const isAuthenticated = Boolean(user)
  const token = session?.access_token || null

  const contextValue: AuthContextValue = {
    user,
    profile,
    session,
    token,
    role,
    fullName,
    isStaff,
    isAuthenticated,
    loading,
    refreshAuth,
    signOut,
  }

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
