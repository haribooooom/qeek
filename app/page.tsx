"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { BookmarkIcon, Settings, User, ArrowRight, LogOut, MessageSquare } from "lucide-react"
import Link from "next/link"
import { createQuestion } from "./actions"
import { FeedbackDialog } from "@/components/feedback-dialog"
import { ErrorMessage } from "@/components/error-message"
import { useAuth } from "@/hooks/use-auth"

// サンプル問い
const sampleQuestions = [
  "今の仕事、このままでいいのかな？",
  "やりたいことが分からないときはどうすれば？",
  "何を学ぶべきか、優先順位のつけ方が分からない",
  "自分の強みって何だろう？",
  "新しいことに挑戦したいけど怖い",
]

export default function Home() {
  const [question, setQuestion] = useState("")
  const router = useRouter()
  const [showSettings, setShowSettings] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, isLoading: authLoading, signOut } = useAuth()

  // handleSubmitQuestion 関数を修正
  const handleSubmitQuestion = async () => {
    if (!question.trim() || isSubmitting) return

    try {
      setIsSubmitting(true)
      setError(null)

      // 問いを作成
      const result = await createQuestion(question)

      if (result.success) {
        // 問いをエンコードしてチャットページに遷移
        router.push(`/chat?id=${result.questionId}&q=${encodeURIComponent(result.title)}`)
      } else {
        setError(result.error || "問いの作成に失敗しました。もう一度お試しください。")
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error("問い作成エラー:", err)
      setError(err.message || "エラーが発生しました。もう一度お試しください。")
      setIsSubmitting(false)
    }
  }

  // サンプル問いをクリックした時の処理
  const handleSampleQuestionClick = (q: string) => {
    setQuestion(q)
    // 自動送信はせず、ユーザーが送信ボタンをクリックするのを待つ
  }

  // ログアウト処理
  const handleLogout = async () => {
    try {
      await signOut()
      setShowUserMenu(false)
    } catch (error) {
      console.error("ログアウトエラー:", error)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      const settingsButton = document.getElementById("settings-button")
      const settingsMenu = document.getElementById("settings-menu")
      const userButton = document.getElementById("user-button")
      const userMenu = document.getElementById("user-menu")

      // 設定ボタンまたは設定メニュー内のクリックは無視
      if (settingsButton?.contains(target) || settingsMenu?.contains(target)) {
        return
      }

      // ユーザーボタンまたはユーザーメニュー内のクリックは無視
      if (userButton?.contains(target) || userMenu?.contains(target)) {
        return
      }

      // それ以外の場所のクリックでメニューを閉じる
      setShowSettings(false)
      setShowUserMenu(false)
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
              <span className="font-bold">Q</span>
            </div>
            <h1 className="text-xl font-semibold">Qeek</h1>
          </div>

          <div className="flex items-center space-x-4">
            <Link href="/logs" className="text-gray-600">
              <BookmarkIcon className="h-5 w-5" />
            </Link>

            {/* 設定メニュー */}
            <div className="relative">
              <button
                id="settings-button"
                className="text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowSettings(!showSettings)
                  setShowUserMenu(false)
                }}
              >
                <Settings className="h-5 w-5" />
              </button>

              {showSettings && (
                <div
                  id="settings-menu"
                  className="absolute right-0 mt-2 w-56 bg-white border shadow-lg rounded-md text-sm z-50 py-1 overflow-hidden"
                >
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center transition-colors"
                    onClick={() => {
                      setShowFeedbackDialog(true)
                      setShowSettings(false)
                    }}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    <span>開発者へフィードバック</span>
                  </button>
                </div>
              )}
            </div>

            {/* ユーザーメニュー */}
            <div className="relative">
              <button
                id="user-button"
                className="text-gray-600 hover:bg-gray-100 p-1 rounded-md transition-colors"
                onClick={(e) => {
                  e.stopPropagation()
                  setShowUserMenu(!showUserMenu)
                  setShowSettings(false)
                }}
              >
                <User className="h-5 w-5" />
                {!authLoading && user && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </button>

              {showUserMenu && (
                <div
                  id="user-menu"
                  className="absolute right-0 mt-2 w-48 bg-white border shadow-lg rounded-md text-sm z-50 py-1 overflow-hidden"
                >
                  {!authLoading && user ? (
                    <>
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <button
                        className="w-full text-left px-4 py-2 text-red-500 hover:bg-gray-100 flex items-center transition-colors"
                        onClick={handleLogout}
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        <span>ログアウト</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-2 hover:bg-gray-100 transition-colors">
                        ログイン
                      </Link>
                      <Link href="/signup" className="block px-4 py-2 hover:bg-gray-100 transition-colors">
                        新規登録
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-6 py-10">
        <div className="max-w-2xl mx-auto">
          <header className="text-center mb-10">
            <h1 className="text-2xl font-bold mb-2">問いと対話で、学びを導く</h1>
            <p className="text-gray-600 text-sm leading-relaxed">
              モヤモヤを"進む力"に変える、パーソナルナレッジパートナー Qeek。
              <br />
              学びたいけど、何から始めればいいかわからない。
              <br />
              そんなあなたの思考を整理し、優先度・目的・学び方まで一緒に考えます。
            </p>
          </header>

          <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
            <label className="block text-sm font-medium mb-1">今気になっていることは？</label>
            <div className="relative mb-2">
              <Input
                placeholder="今気になっていることを書いてみよう..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !isSubmitting && handleSubmitQuestion()}
                className="pr-12 text-base"
                disabled={isSubmitting}
              />
              <Button
                size="sm"
                className="absolute right-1 top-1 rounded-md bg-blue-600 h-8"
                onClick={handleSubmitQuestion}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  <ArrowRight className="h-4 w-4 text-white" />
                )}
              </Button>
            </div>

            {error && <ErrorMessage message={error} className="mb-4" />}

            <div>
              <div className="text-sm text-gray-500 mb-1">こんな問いから始めてみる:</div>
              <div className="flex flex-wrap gap-3 my-2">
                {sampleQuestions.map((q, index) => (
                  <button
                    key={index}
                    className="bg-gray-50 border border-gray-200 text-gray-700 px-3 h-10 flex items-center rounded-full text-sm hover:bg-gray-100 transition-colors"
                    onClick={() => handleSampleQuestionClick(q)}
                    disabled={isSubmitting}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/logs" className="text-blue-600 hover:underline text-sm">
              過去の問いを確認する
            </Link>
          </div>
          {/* 管理者ページへのリンクを削除 */}
        </div>
      </main>

      <footer className="text-center text-xs text-gray-400 mt-6">Qeek - 問いから、わたしの道が見えてくる</footer>
      <FeedbackDialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog} />
    </div>
  )
}
