"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { ErrorMessage } from "@/components/error-message"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser()

        if (error) {
          console.error("Auth error:", error.message)
          setError("Auth session missing!")
          throw new Error("Auth session missing!")
        }

        if (!user) {
          // ユーザーが存在しない場合はログインページにリダイレクト
          const currentPath = window.location.pathname
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`)
          return
        }

        // 認証成功
        setIsAuthenticated(true)
        setError(null)
      } catch (error: any) {
        console.error("Authentication check failed:", error.message)
        setError(error.message)

        // エラーメッセージを表示してログインページにリダイレクト
        const currentPath = window.location.pathname
        router.push(`/login?error=${encodeURIComponent(error.message)}&redirect=${encodeURIComponent(currentPath)}`)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [router])

  // 読み込み中の表示
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">認証状態を確認中...</p>
        </div>
      </div>
    )
  }

  // エラーがある場合
  if (error) {
    return <ErrorMessage message={error} />
  }

  // 認証済みの場合のみ子コンポーネントを表示
  return isAuthenticated ? <>{children}</> : null
}
