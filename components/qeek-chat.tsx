"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Brain } from "lucide-react"

export default function QeekChat({
  initialChat = [],
  onSendMessage,
}: {
  initialChat?: Array<{ sender: string; content: string }>
  onSendMessage?: (message: string) => void
}) {
  const [question, setQuestion] = useState("")
  const [chat, setChat] = useState(initialChat)
  const [diagnosis, setDiagnosis] = useState<any>(null)

  const mockGPTDiagnosis = (text: string) => {
    return {
      classification: ["深掘り系", "将来投資"],
      weight: [60, 40],
      score: 70,
      summary: "この問いはキャリア転換に関わる探索フェーズであり、自己理解や情報収集が重要です。",
      reasons: ["未経験転職には準備期間が必要", "転職の動機や方向性を考える必要がある", "情報収集の段階に適している"],
    }
  }

  const handleSend = (text: string) => {
    if (!text.trim()) return

    const userMsg = { sender: "user", content: text }
    setChat((prev) => [...prev, userMsg])
    setQuestion("")

    // 親コンポーネントに通知（オプション）
    if (onSendMessage) {
      onSendMessage(text)
    }

    setTimeout(() => {
      const diagnosisData = mockGPTDiagnosis(text)
      const aiResponse = {
        sender: "ai",
        content: "この問いについて少し整理してみましょうか。分類・スコアなどを提示しますね。",
      }
      setDiagnosis(diagnosisData)
      setChat((prev) => [...prev, aiResponse])
    }, 1000)
  }

  return (
    <div className="flex flex-col md:flex-row min-h-[70vh] gap-4">
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="flex-1 overflow-auto p-4 bg-gray-50 rounded-lg mb-4">
          <div className="space-y-4">
            {chat.map((msg, i) => (
              <div key={i} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                {msg.sender === "ai" && (
                  <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center mr-2 flex-shrink-0">
                    <span className="font-bold">Q</span>
                  </div>
                )}
                <div
                  className={`rounded-lg p-3 max-w-[80%] ${
                    msg.sender === "user" ? "bg-blue-600 text-white" : "bg-white border border-gray-200"
                  }`}
                >
                  <p>{msg.content}</p>
                </div>
                {msg.sender === "user" && (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center ml-2 flex-shrink-0">
                    <span className="font-bold">U</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-2 p-2">
          <Input
            placeholder="メッセージを入力..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend(question)}
            className="flex-1"
          />
          <Button onClick={() => handleSend(question)}>送信</Button>
        </div>
      </div>

      <div className="w-full md:w-1/3">
        {diagnosis && (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Brain className="h-5 w-5 mr-2 text-blue-600" />
                  診断結果
                </h3>
                <Badge className="bg-blue-600">{diagnosis.score}点</Badge>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 mb-2">
                  {diagnosis.classification.map((label: string, idx: number) => (
                    <Badge key={idx} className={idx === 0 ? "bg-blue-600" : "bg-blue-500"}>
                      {label} {diagnosis.weight[idx]}%
                    </Badge>
                  ))}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">優先度スコア</span>
                    <span className="font-bold text-blue-600">{diagnosis.score}点</span>
                  </div>
                  <Progress value={diagnosis.score} className="h-2 bg-gray-200" />
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-gray-700">{diagnosis.summary}</p>
              </div>

              {diagnosis.reasons && (
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm">診断理由:</h4>
                  <ul className="space-y-1 text-sm text-gray-700">
                    {diagnosis.reasons.map((reason: string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-blue-600">✓</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
