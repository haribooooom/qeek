"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"
import Link from "next/link"

export default function ChatError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // エラーをログに記録
    console.error("チャットページでエラーが発生しました:", error)
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-sm text-center">
        <div className="bg-yellow-50 p-4 rounded-full inline-flex mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-yellow-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">エラーが発生しました</h1>
        <p className="text-gray-600 mb-6">申し訳ありませんが、チャットの読み込み中にエラーが発生しました。</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={reset} variant="outline">
            もう一度試す
          </Button>
          <Link href="/">
            <Button>ホームに戻る</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
