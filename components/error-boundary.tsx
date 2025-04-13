"use client"

import { Component, type ErrorInfo, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("エラーバウンダリーがエラーをキャッチしました:", error, errorInfo)
    // エラー監視サービスにエラーを送信するなど
  }

  render() {
    if (this.state.hasError) {
      // カスタムフォールバックUIを表示
      return (
        this.props.fallback || (
          <div className="min-h-[300px] flex flex-col items-center justify-center p-6 text-center">
            <div className="bg-yellow-50 p-4 rounded-full mb-4">
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">問題が発生しました</h2>
            <p className="text-gray-600 mb-4">申し訳ありませんが、エラーが発生しました。もう一度お試しください。</p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              ページを再読み込み
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
