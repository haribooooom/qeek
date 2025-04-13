"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import type { User } from "@supabase/supabase-js"

type AuthContextType = {
  user: User | null
  isLoading: boolean
  error: string | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window === "undefined") return

    const supabase = createClientSupabaseClient()

    // 初期認証状態の取得
    const fetchUser = async () => {
      try {
        // セッションを取得
        const { data: sessionData } = await supabase.auth.getSession()

        if (sessionData?.session) {
          setUser(sessionData.session.user)
          setError(null)
        } else {
          setUser(null)
        }
      } catch (err: any) {
        console.warn("Auth check warning:", err.message)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()

    // 認証状態の変更を監視
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user)
        setError(null)

        // リダイレクトパラメータがある場合はそこにリダイレクト
        const redirectTo = searchParams.get("redirect")
        if (redirectTo && !pathname.startsWith("/login") && !pathname.startsWith("/signup")) {
          router.push(redirectTo)
        }
      } else if (event === "SIGNED_OUT") {
        setUser(null)
        setError(null)

        // 保護されたルートにいる場合はログインページにリダイレクト
        const protectedRoutes = ["/chat", "/logs", "/profile", "/settings"]
        if (protectedRoutes.some((route) => pathname.startsWith(route))) {
          router.push(`/login?redirect=${encodeURIComponent(pathname)}`)
        }
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [router, pathname, searchParams])

  // サインアウト関数
  const signOut = async () => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error: any) {
      console.error("サインアウトエラー:", error.message)
      setError(error.message)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, error, signOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
