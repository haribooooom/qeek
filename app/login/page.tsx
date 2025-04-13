"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { handleSignIn } from "../auth-actions"
import { useAuth } from "@/hooks/use-auth"
import { ErrorMessage } from "@/components/error-message"
import { AlertCircle } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()

  // URLからエラーメッセージとリダイレクト先を取得
  const errorFromUrl = searchParams.get("error")
  const redirectTo = searchParams.get("redirect") || "/"

  useEffect(() => {
    // URLからのエラーメッセージがあれば表示
    if (errorFromUrl) {
      setError(decodeURIComponent(errorFromUrl))
    }
  }, [errorFromUrl])

  // 既にログインしている場合はリダイレクト
  useEffect(() => {
    if (user && !authLoading) {
      router.push(redirectTo)
    }
  }, [user, authLoading, router, redirectTo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください")
      setIsLoading(false)
      return
    }

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await handleSignIn(formData)

      if (result.success) {
        router.push(redirectTo)
      } else {
        setError(result.error || "ログインに失敗しました")
      }
    } catch (err: any) {
      console.error("ログインエラー:", err)
      setError(err.message || "ログイン処理中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // 認証ロード中は何も表示しない
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-500">読み込み中...</p>
        </div>
      </div>
    )
  }

  // 既にログインしている場合は何も表示しない（リダイレクト中）
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-600 text-white mx-auto">
            <span className="font-bold text-xl">Q</span>
          </div>
          <h1 className="text-2xl font-bold mt-4">Qeekにログイン</h1>
          <p className="text-gray-600 mt-2">問いと対話で、学びを導く</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          {error && <ErrorMessage message={error} className="mb-4" />}

          {redirectTo && redirectTo !== "/" && (
            <div className="bg-blue-50 border border-blue-100 text-blue-700 p-3 rounded-md mb-4 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p>このページにアクセスするにはログインが必要です。</p>
                <p className="text-xs mt-1">ログイン後、元のページに戻ります。</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                メールアドレス
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "ログイン中..." : "ログイン"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              アカウントをお持ちでない場合は{" "}
              <Link
                href={`/signup${redirectTo !== "/" ? `?redirect=${encodeURIComponent(redirectTo)}` : ""}`}
                className="text-blue-600 hover:underline"
              >
                新規登録
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
