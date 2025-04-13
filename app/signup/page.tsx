"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { handleSignUp } from "../auth-actions"
import { useAuth } from "@/contexts/auth-context"
import { ErrorMessage } from "@/components/error-message"

export default function SignupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  // 既にログインしている場合はホームページにリダイレクト
  useEffect(() => {
    if (user && !authLoading) {
      router.push("/")
    }
  }, [user, authLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("メールアドレスとパスワードを入力してください")
      return
    }

    if (password !== confirmPassword) {
      setError("パスワードが一致しません")
      return
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください")
      return
    }

    setIsLoading(true)

    const formData = new FormData()
    formData.append("email", email)
    formData.append("password", password)

    try {
      const result = await handleSignUp(formData)

      if (result.success) {
        router.push("/")
      } else {
        setError(result.error || "アカウント作成に失敗しました")
      }
    } catch (err: any) {
      console.error("サインアップエラー:", err)
      setError(err.message || "アカウント作成中にエラーが発生しました")
    } finally {
      setIsLoading(false)
    }
  }

  // 認証ロード中は何も表示しない
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
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
          <h1 className="text-2xl font-bold mt-4">Qeekに新規登録</h1>
          <p className="text-gray-600 mt-2">問いと対話で、学びを導く</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-sm">
          {error && <ErrorMessage message={error} className="mb-4" />}

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
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                パスワード（確認）
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "登録中..." : "アカウント作成"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-gray-600">
              すでにアカウントをお持ちの場合は{" "}
              <Link href="/login" className="text-blue-600 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
