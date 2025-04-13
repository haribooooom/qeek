"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, BookmarkIcon, MoreVertical, Trash2 } from "lucide-react"
import Link from "next/link"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { fetchQuestions, removeQuestion, toggleBookmark } from "../actions"
import { ErrorMessage } from "@/components/error-message"

export default function LogsPage() {
  const [questions, setQuestions] = useState<any[]>([])
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 問い一覧を取得
  useEffect(() => {
    const loadQuestions = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const result = await fetchQuestions(showOnlyBookmarks)

        if (result.success) {
          setQuestions(result.questions || [])
        } else {
          setError(result.error || "問いの取得に失敗しました")
          setQuestions([])
        }
      } catch (err: any) {
        console.error("問い取得エラー:", err)
        setError(err.message || "問いの取得中にエラーが発生しました")
        setQuestions([])
      } finally {
        setIsLoading(false)
      }
    }

    loadQuestions()
  }, [showOnlyBookmarks])

  // ブックマークの切り替え
  const handleToggleBookmark = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleBookmark(id, currentStatus)

      if (result.success) {
        // 問い一覧を更新
        setQuestions((prev) => prev.map((q) => (q.id === id ? { ...q, bookmarked: result.bookmarked } : q)))
      } else {
        setError(result.error || "ブックマークの更新に失敗しました")
      }
    } catch (err: any) {
      console.error("ブックマーク更新エラー:", err)
      setError(err.message || "ブックマークの更新中にエラーが発生しました")
    }
  }

  // 問いの削除
  const handleDeleteQuestion = async (id: string) => {
    if (confirm("この問いを削除しますか？")) {
      try {
        const result = await removeQuestion(id)

        if (result.success) {
          // 問い一覧から削除
          setQuestions((prev) => prev.filter((q) => q.id !== id))
        } else {
          setError(result.error || "問いの削除に失敗しました")
        }
      } catch (err: any) {
        console.error("問い削除エラー:", err)
        setError(err.message || "問いの削除中にエラーが発生しました")
      }
    }
  }

  // 検索とブックマークフィルター
  const filteredQuestions = questions
    .filter((q) => {
      // 検索クエリでフィルタリング
      if (searchQuery && !q.title.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false
      }

      return true
    })
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center">
          <Link href="/" className="text-gray-600 mr-4">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-xl font-bold">最近の問い</h1>
        </div>
      </header>

      <div className="container mx-auto px-6 py-6 max-w-2xl">
        {/* エラーメッセージ */}
        {error && <ErrorMessage message={error} className="mb-4" />}

        {/* フィルター */}
        <div className="mb-4 flex items-center">
          <div className="flex items-center">
            <Checkbox
              id="bookmark-filter"
              checked={showOnlyBookmarks}
              onCheckedChange={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
              className="mr-2"
            />
            <label htmlFor="bookmark-filter" className="text-sm cursor-pointer">
              ブックマークのみ表示
            </label>
          </div>

          <div className="ml-auto text-sm text-gray-500">{filteredQuestions.length} 件の問い</div>
        </div>

        {/* 問い一覧 */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">読み込み中...</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">該当する問いはありません</div>
        ) : (
          <ul className="space-y-3">
            {filteredQuestions.map((question) => (
              <li
                key={question.id}
                className="bg-white border p-4 rounded-lg shadow-sm flex justify-between items-start"
              >
                <Link href={`/chat?id=${question.id}&q=${encodeURIComponent(question.title)}`} className="flex-1">
                  <div className="font-medium mb-1">{question.title}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-3">
                    <span>{new Date(question.created_at).toLocaleDateString("ja-JP")}</span>
                    {question.score && <Badge className="bg-blue-600 text-white">{question.score}点</Badge>}
                  </div>
                </Link>

                <div className="flex items-center gap-3 ml-4">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      handleToggleBookmark(question.id, question.bookmarked)
                    }}
                    className={`${question.bookmarked ? "text-yellow-500" : "text-gray-300"} hover:text-yellow-500`}
                    title="ブックマーク切り替え"
                  >
                    <BookmarkIcon className="h-5 w-5" fill={question.bookmarked ? "currentColor" : "none"} />
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="text-gray-400 hover:text-gray-600"
                        title="メニュー"
                        onClick={(e) => e.preventDefault()}
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-red-500 cursor-pointer flex items-center gap-2"
                        onClick={() => handleDeleteQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>削除</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
