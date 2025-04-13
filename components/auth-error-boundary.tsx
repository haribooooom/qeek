"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    // Auth session missing エラーの場合は特別に処理
    if (error.message.includes("Auth session missing")) {
      console.warn("Auth session missing error caught by boundary:", error.message)
      // エラーを捕捉するが、UIには表示しない（正常な未認証状態として扱う）
      return { hasError: false, error: null }
    }

    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Auth session missing エラーの場合はログに警告を出すだけ
    if (error.message.includes("Auth session missing")) {
      console.warn("Auth session missing error caught:", error.message)
      return
    }

    console.error("認証エラーバウンダリーがエラーをキャッチしました:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 認証エラーの場合
      const isAuthError =
        this.state.error?.message.includes("Auth session missing") ||
        this.state.error?.message.includes("認証") ||
        this.state.error?.message.includes("auth")

      return (
        this.props.fallback || (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-yellow-50 p-4 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">{isAuthError ? "認証エラー" : "エラーが発生しました"}</h2>
            <p className="text-gray-600 mb-4">
              {isAuthError
                ? "セッションが見つからないか、有効期限が切れています。再度ログインしてください。"
                : this.state.error?.message || "予期しないエラーが発生しました。"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ hasError: false, error: null })
                  window.location.reload()
                }}
              >
                再試行
              </Button>
              <Link href="/login">
                <Button>ログインページへ</Button>
              </Link>
            </div>
          </div>
        )
      )
    }

    return this.props.children
  }
}
