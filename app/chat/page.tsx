"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Card } from "@/components/ui/card"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Brain,
  ExternalLink,
  FileText,
  Code,
  User,
  BookmarkIcon,
  Pencil,
  AlertCircle,
} from "lucide-react"
import Link from "next/link"
import { createQuestion, sendMessage, toggleBookmark, fetchQuestionDetails, fetchResources } from "../actions"

export default function ChatPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuestion = searchParams.get("q") || ""
  const questionId = searchParams.get("id") || ""

  // タイトル編集のための状態
  const [chatTitle, setChatTitle] = useState("チャット")
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)

  // ブックマーク状態の管理
  const [isBookmarked, setIsBookmarked] = useState(false)

  const [messages, setMessages] = useState<Array<{ sender: string; text: string; id: string }>>([])
  const [inputMessage, setInputMessage] = useState("")
  const [showDiagnosis, setShowDiagnosis] = useState(false)
  const [isProcessing, setIsProcessing] = useState(isProcessing)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [resources, setResources] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  // 診断結果
  const [diagnosis, setDiagnosis] = useState<any>(null)

  // 初期データ読み込み
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // 新規問いの場合
        if (initialQuestion && !questionId) {
          const result = await createQuestion(initialQuestion)
          if (result.success) {
            router.replace(`/chat?id=${result.questionId}&q=${encodeURIComponent(result.title)}`)
          } else {
            setError(result.error || "問いの作成に失敗しました")
          }
          return
        }

        // 既存の問いの場合
        if (questionId) {
          const result = await fetchQuestionDetails(questionId)
          if (result.success) {
            setChatTitle(result.question.title)
            setIsBookmarked(result.question.bookmarked)

            // メッセージを設定
            const formattedMessages = result.messages.map((msg: any) => ({
              sender: msg.sender,
              text: msg.content,
              id: msg.id,
            }))
            setMessages(formattedMessages)

            // 診断結果があれば設定
            if (result.diagnosis) {
              setDiagnosis(result.diagnosis)
              setShowDiagnosis(true)
            }
          } else {
            setError(result.error || "チャットデータの読み込みに失敗しました")
          }
        }

        // リソースを取得
        try {
          const resourcesResult = await fetchResources()
          setResources(resourcesResult.resources || [])
        } catch (resourceError) {
          console.error("リソース取得エラー:", resourceError)
          // リソース取得エラーは致命的ではないので、エラー表示はしない
        }
      } catch (error: any) {
        console.error("データ読み込みエラー:", error)
        setError(error.message || "データの読み込み中にエラーが発生しました")
      }
    }

    loadInitialData()
  }, [initialQuestion, questionId, router])

  // タイトル編集モードに入ったら自動フォーカス
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [isEditingTitle])

  // 自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // タイトル編集の開始
  const startEditingTitle = () => {
    setIsEditingTitle(true)
  }

  // タイトル編集の終了と保存
  const saveTitle = () => {
    setIsEditingTitle(false)
    // タイトルが空の場合はデフォルト値を設定
    if (!chatTitle.trim()) {
      setChatTitle("チャット")
    }
    // TODO: タイトル更新APIを呼び出す
  }

  // ブックマークの切り替え
  const handleToggleBookmark = async () => {
    if (!questionId) return

    const result = await toggleBookmark(questionId, isBookmarked)
    if (result.success) {
      setIsBookmarked(result.bookmarked)
    }
  }

  // handleSendMessage 関数を修正
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !questionId || isProcessing) return

    const messageToSend = inputMessage.trim()

    // 入力フィールドをクリア（非同期処理の前に実行）
    setInputMessage("")

    // 送信中の状態を設定
    setIsProcessing(true)

    // UIを先に更新（オプティミスティックUI更新）
    const tempMessageId = Date.now().toString() // 一時的なID
    setMessages((prev) => [...prev, { sender: "user", text: messageToSend, id: tempMessageId }])

    try {
      // サーバーアクションを呼び出し
      const result = await sendMessage(questionId, messageToSend)

      if (result.success) {
        // サーバーからの応答でUIを更新
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempMessageId), // 一時メッセージを削除
          { sender: "user", text: messageToSend, id: result.userMessage.id }, // サーバーから返された正式なIDで置き換え
          { sender: "ai", text: result.aiMessage.content, id: result.aiMessage.id },
        ])
        setShowDiagnosis(result.showDiagnosis)

        // 診断結果を再取得
        if (result.showDiagnosis) {
          const detailsResult = await fetchQuestionDetails(questionId)
          if (detailsResult.success && detailsResult.diagnosis) {
            setDiagnosis(detailsResult.diagnosis)
          }
        }
      } else {
        // エラーメッセージを表示
        setError(result.error || "メッセージの送信に失敗しました")
        // 一時メッセージを削除
        setMessages((prev) => prev.filter((m) => m.id !== tempMessageId))
      }
    } catch (error: any) {
      console.error("メッセージ送信エラー:", error)
      setError(error.message || "メッセージの送信中にエラーが発生しました")
      // 一時メッセージを削除
      setMessages((prev) => prev.filter((m) => m.id !== tempMessageId))
    } finally {
      setIsProcessing(false)
    }
  }

  // リソースタイプに応じたアイコンを取得
  const getResourceTypeIcon = (type: string) => {
    switch (type) {
      case "guide":
        return <FileText className="h-4 w-4" />
      case "tool":
        return <Code className="h-4 w-4" />
      case "service":
        return <User className="h-4 w-4" />
      case "coach":
        return <User className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b border-gray-200 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="text-gray-600 mr-4">
              <ArrowLeft className="h-5 w-5" />
            </Link>

            {isEditingTitle ? (
              <div className="relative">
                <Input
                  ref={titleInputRef}
                  value={chatTitle}
                  onChange={(e) => setChatTitle(e.target.value)}
                  onBlur={saveTitle}
                  onKeyDown={(e) => e.key === "Enter" && saveTitle()}
                  className="text-xl font-bold py-0 h-auto border-b border-t-0 border-l-0 border-r-0 rounded-none focus-visible:ring-0 focus-visible:border-blue-600 pl-0 pr-6 max-w-[300px]"
                  placeholder="タイトルを入力..."
                />
                <button
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 text-gray-400"
                  onClick={saveTitle}
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center group">
                <h1 className="text-xl font-bold truncate max-w-[200px] sm:max-w-[300px]" title={chatTitle}>
                  {chatTitle}
                </h1>
                <button
                  onClick={startEditingTitle}
                  className="ml-2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="タイトルを編集"
                >
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleToggleBookmark}
              className={`${isBookmarked ? "text-yellow-500" : "text-gray-400"} hover:text-yellow-500`}
              title={isBookmarked ? "ブックマークを解除" : "ブックマークに追加"}
            >
              <BookmarkIcon className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} />
            </button>

            {isProcessing && <Badge className="bg-blue-100 text-blue-800">深掘り中...</Badge>}
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-md flex items-start gap-2 mb-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <span className="text-sm">{error}</span>
          </div>
        )}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 左カラム: チャットエリア */}
          <div className={`lg:w-${showDiagnosis ? "3/5" : "full"}`}>
            <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
              <div className="space-y-4 mb-4 min-h-[300px]">
                {messages.map((message, index) => (
                  <div key={index} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                    {message.sender === "ai" && (
                      <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 flex-shrink-0">
                        <span className="font-bold">Q</span>
                      </div>
                    )}
                    <div
                      className={`rounded-lg px-4 py-2 max-w-[80%] ${
                        message.sender === "user" ? "bg-blue-50 text-gray-800" : "bg-white border border-gray-200"
                      }`}
                    >
                      {message.text}
                    </div>
                    {message.sender === "user" && (
                      <div className="ml-2 flex items-center justify-center h-6 w-6 rounded-full bg-gray-200 text-gray-600 self-end">
                        <User className="h-3 w-3" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* 入力エリア */}
              <div className="relative">
                <Input
                  placeholder="メッセージを入力..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey && !isProcessing) {
                      e.preventDefault() // フォーム送信を防止
                      handleSendMessage()
                    }
                  }}
                  className="pr-12 rounded-md bg-gray-50"
                  disabled={isProcessing}
                />
                <Button
                  onClick={handleSendMessage}
                  size="sm"
                  className="absolute right-1 top-1 rounded-md bg-blue-600 h-8"
                  disabled={isProcessing}
                >
                  <ArrowRight className="h-4 w-4 text-white" />
                </Button>
              </div>
            </div>
          </div>

          {/* 右カラム: 診断結果とリソース */}
          {showDiagnosis && diagnosis && (
            <div className="lg:w-2/5">
              {/* 診断結果エリア */}
              <Card className="bg-white shadow-sm p-4 mb-4">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  診断結果
                </h2>

                <div className="mb-4">
                  <p className="font-medium mb-2">問い: {chatTitle}</p>
                  <div className="flex gap-2 mb-2">
                    {diagnosis.classification.map((cls: string, idx: number) => (
                      <Badge key={idx} className={idx === 0 ? "bg-blue-600 text-white" : "bg-indigo-600 text-white"}>
                        {cls} {diagnosis.weight[idx]}%
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">優先度スコア</span>
                    <span className="text-blue-600 font-bold">{diagnosis.score}点</span>
                  </div>
                  <Progress value={diagnosis.score} className="h-2" />
                </div>

                <div className="bg-gray-50 rounded-md p-3 mb-4">
                  <h3 className="font-medium mb-1">診断サマリー</h3>
                  <p className="text-gray-700 text-sm">{diagnosis.summary}</p>
                </div>

                <div className="mb-4">
                  <h3 className="font-medium mb-2">診断理由:</h3>
                  <ul className="space-y-2 text-sm">
                    {diagnosis.reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>

              {/* おすすめリソース */}
              <Card className="bg-white shadow-sm p-4">
                <h2 className="text-lg font-bold mb-4 flex items-center">
                  <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                  おすすめリソース
                </h2>

                <div className="space-y-3">
                  {resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-100 text-blue-800 p-2 rounded-lg">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-900">{resource.title}</h4>
                            <ExternalLink className="h-4 w-4 text-gray-500" />
                          </div>
                          <div className="mt-1 text-xs text-gray-500">{resource.category}</div>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
