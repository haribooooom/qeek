"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SeedPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleSeed = async () => {
    if (!confirm("テストデータをデータベースに追加しますか？既存のデータと競合する可能性があります。")) {
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      })

      const data = await response.json()

      if (data.success) {
        setResult({
          success: true,
          message: "テストデータが正常に追加されました！",
        })
      } else {
        setResult({
          success: false,
          message: `エラー: ${data.error || "不明なエラーが発生しました"}`,
        })
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `エラー: ${error.message || "不明なエラーが発生しました"}`,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <Card className="max-w-md w-full p-6">
        <h1 className="text-2xl font-bold mb-4">データベースシード</h1>
        <p className="text-gray-600 mb-6">
          このページでは、テスト用のサンプルデータをデータベースに追加できます。 本番環境では使用しないでください。
        </p>

        {result && (
          <div
            className={`p-4 mb-6 rounded-md flex items-center gap-2 ${
              result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
            }`}
          >
            {result.success ? (
              <CheckCircle className="h-5 w-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
            )}
            <p>{result.message}</p>
          </div>
        )}

        <Button onClick={handleSeed} disabled={isLoading} className="w-full">
          {isLoading ? "処理中..." : "テストデータを追加"}
        </Button>
      </Card>
    </div>
  )
}
