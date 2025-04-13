"use server"

import { revalidatePath } from "next/cache"
import {
  saveQuestion,
  saveMessage,
  saveDiagnosis,
  updateBookmarkStatus,
  deleteQuestion,
  getQuestions,
  getQuestionDetails,
  getResources,
} from "@/lib/db-utils"
import { generateAIResponse } from "@/lib/ai-utils"

// 新しい問いを作成
export async function createQuestion(title: string) {
  try {
    const question = await saveQuestion(title)

    if (!question) {
      return { success: false, error: "問いの作成に失敗しました" }
    }

    // 初期メッセージを保存（ユーザーの問い）
    await saveMessage(question.id, "user", title)

    // 非同期でAI応答を生成し、即座に成功レスポンスを返す
    // これにより、ユーザーはAI応答を待たずにチャットページに移動できる
    const generateAIResponseAsync = async () => {
      try {
        // タイムアウト付きのAI応答生成
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI応答生成がタイムアウトしました")), 15000),
        )

        const aiResultPromise = generateAIResponse([{ role: "user", content: title }])

        // Promise.race を使用してタイムアウトを実装
        const aiResult = (await Promise.race([aiResultPromise, timeoutPromise]).catch((error) => {
          console.error("AI応答生成エラー:", error)
          return { success: false, content: "その問いについて考えてみましょう。もう少し詳しく教えていただけますか？" }
        })) as any

        const aiResponse = aiResult.success
          ? aiResult.content
          : "その問いについて考えてみましょう。もう少し詳しく教えていただけますか？"

        try {
          // AIの応答を保存
          await saveMessage(question.id, "ai", aiResponse)
        } catch (saveError) {
          console.error("AI応答保存エラー:", saveError)
          // エラーを記録するだけで続行
        }

        // チャットページを再検証
        try {
          revalidatePath(`/chat`)
        } catch (revalidateError) {
          console.error("ページ再検証エラー:", revalidateError)
        }
      } catch (error) {
        console.error("非同期AI応答生成エラー:", error)
        // エラー時にもデフォルトメッセージを保存を試みる
        try {
          await saveMessage(question.id, "ai", "その問いについて考えてみましょう。もう少し詳しく教えていただけますか？")
        } catch (saveError) {
          console.error("デフォルトメッセージ保存エラー:", saveError)
        }
      }
    }

    // 非同期で処理を開始（await しない）
    generateAIResponseAsync().catch((error) => {
      console.error("非同期処理エラー:", error)
    })

    revalidatePath("/chat")
    revalidatePath("/logs")

    return {
      success: true,
      questionId: question.id,
      title: question.title,
    }
  } catch (error: any) {
    console.error("問い作成エラー:", error)
    return {
      success: false,
      error: error.message || "問いの作成中にエラーが発生しました",
    }
  }
}

// メッセージを送信
export async function sendMessage(questionId: string, content: string) {
  try {
    // ユーザーメッセージを保存
    const userMessage = await saveMessage(questionId, "user", content)

    if (!userMessage) {
      return { success: false, error: "メッセージの送信に失敗しました" }
    }

    // 会話履歴を取得
    const details = await getQuestionDetails(questionId)
    if (!details) {
      return { success: false, error: "会話履歴の取得に失敗しました" }
    }

    const conversationHistory = details.messages.map((msg: any) => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.content,
    }))

    try {
      // サーバーサイドで直接 AI 応答を生成
      const aiResult = await generateAIResponse(conversationHistory)

      const aiResponse = aiResult.success ? aiResult.content : "申し訳ありません。応答の生成中にエラーが発生しました。"

      // AIの応答を保存
      const aiMessage = await saveMessage(questionId, "ai", aiResponse)

      // 診断結果を生成
      let showDiagnosis = false
      if (details.messages.length >= 3) {
        // 一定のメッセージ数に達したら診断を行う
        try {
          const { analyzeProblem } = await import("@/lib/ai-utils")
          const analysisResult = await analyzeProblem(details.question.title, conversationHistory)

          if (analysisResult.success) {
            // 診断結果を保存
            await saveDiagnosis(
              questionId,
              analysisResult.diagnosis.classification,
              analysisResult.diagnosis.weight,
              analysisResult.diagnosis.score,
              analysisResult.diagnosis.summary,
              analysisResult.diagnosis.reasons,
            )
            showDiagnosis = true
          }
        } catch (error) {
          console.error("診断生成エラー:", error)
        }
      }

      revalidatePath(`/chat`)

      return {
        success: true,
        userMessage,
        aiMessage,
        showDiagnosis,
      }
    } catch (error: any) {
      console.error("AI応答生成エラー:", error)

      // エラー発生時にもデフォルトメッセージを保存
      const aiMessage = await saveMessage(
        questionId,
        "ai",
        "申し訳ありません。応答の生成中にエラーが発生しました。もう一度お試しください。",
      )

      return {
        success: true,
        userMessage,
        aiMessage,
        showDiagnosis: false,
      }
    }
  } catch (error: any) {
    console.error("メッセージ送信エラー:", error)
    return {
      success: false,
      error: error.message || "メッセージの送信中にエラーが発生しました",
    }
  }
}

// 以下は変更なし
export async function toggleBookmark(questionId: string, currentStatus: boolean) {
  try {
    const updatedQuestion = await updateBookmarkStatus(questionId, !currentStatus)

    if (!updatedQuestion) {
      return { success: false, error: "ブックマークの更新に失敗しました" }
    }

    revalidatePath("/chat")
    revalidatePath("/logs")

    return {
      success: true,
      bookmarked: updatedQuestion.bookmarked,
    }
  } catch (error: any) {
    console.error("ブックマーク更新エラー:", error)
    return {
      success: false,
      error: error.message || "ブックマークの更新中にエラーが発生しました",
    }
  }
}

export async function removeQuestion(questionId: string) {
  try {
    const success = await deleteQuestion(questionId)

    if (!success) {
      return { success: false, error: "問いの削除に失敗しました" }
    }

    revalidatePath("/logs")

    return { success: true }
  } catch (error: any) {
    console.error("問い削除エラー:", error)
    return {
      success: false,
      error: error.message || "問いの削除中にエラーが発生しました",
    }
  }
}

export async function fetchQuestions(bookmarkedOnly = false) {
  try {
    const questions = await getQuestions(undefined, bookmarkedOnly)
    return { success: true, questions }
  } catch (error: any) {
    console.error("問い取得エラー:", error)
    return {
      success: false,
      error: error.message || "問いの取得中にエラーが発生しました",
      questions: [],
    }
  }
}

export async function fetchQuestionDetails(questionId: string) {
  try {
    const details = await getQuestionDetails(questionId)

    if (!details) {
      return { success: false, error: "問いの詳細取得に失敗しました" }
    }

    return {
      success: true,
      ...details,
    }
  } catch (error: any) {
    console.error("問い詳細取得エラー:", error)
    return {
      success: false,
      error: error.message || "問いの詳細取得中にエラーが発生しました",
    }
  }
}

export async function fetchResources() {
  try {
    const resources = await getResources()
    return { success: true, resources }
  } catch (error: any) {
    console.error("リソース取得エラー:", error)
    return {
      success: false,
      error: error.message || "リソースの取得中にエラーが発生しました",
      resources: [],
    }
  }
}
