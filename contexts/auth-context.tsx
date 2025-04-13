"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"

type User = {
  id: string
  email: string
} | null

type AuthContextType = {
  user: User
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  // 初期認証状態の取得
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const supabase = createClientSupabaseClient()

        // getUser() メソッドはエラーを投げる可能性があるため、try-catchで囲む
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("セッション取得エラー:", error)
          setUser(null)
        } else if (data?.session?.user) {
          setUser({
            id: data.session.user.id,
            email: data.session.user.email || "",
          })
        } else {
          // セッションがない場合は単にnullを設定
          setUser(null)
        }
      } catch (error) {
        console.error("認証状態取得エラー:", error)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  // 認証状態の変更を監視
  useEffect(() => {
    try {
      const supabase = createClientSupabaseClient()

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        console.log("Auth state changed:", event)

        if (event === "SIGNED_IN" && session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
          })
        } else if (event === "SIGNED_OUT") {
          setUser(null)
        }
      })

      return () => {
        subscription.unsubscribe()
      }
    } catch (error) {
      console.error("認証状態監視エラー:", error)
    }
  }, [router])

  // サインアウト関数
  const handleSignOut = async () => {
    try {
      const supabase = createClientSupabaseClient()
      await supabase.auth.signOut()
      setUser(null)
      router.push("/login")
    } catch (error) {
      console.error("サインアウトエラー:", error)
    }
  }

  return <AuthContext.Provider value={{ user, isLoading, signOut: handleSignOut }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
