"use server"

import { OpenAI } from "openai"

// OpenAIクライアントの初期化
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OpenAI API キーが設定されていません")
  }
  return new OpenAI({
    apiKey,
    timeout: 10000, // 10秒でタイムアウト
  })
}

// AIによる応答生成
export async function generateAIResponse(messages: { role: string; content: string }[]) {
  try {
    // OpenAI API キーが設定されているか確認
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API キーが設定されていません。デフォルトの応答を返します。")
      return {
        success: true,
        content: "その問いについて考えてみましょう。もう少し詳しく教えていただけますか？",
      }
    }

    const openai = getOpenAIClient()

    // 応答時間を計測
    const startTime = Date.now()

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはQeekというアプリケーションのAIアシスタントです。
          ユーザーの問いに対して、共感的かつ建設的に応答してください。
          ユーザーの問いを深掘りし、思考を整理するのを手伝ってください。
          回答は日本語で、親しみやすく、かつ専門的な知見を提供してください。`,
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const endTime = Date.now()
    console.log(`AI応答生成時間: ${endTime - startTime}ms`)

    return {
      success: true,
      content: completion.choices[0].message.content || "",
    }
  } catch (error: any) {
    console.error("AI応答生成エラー:", error)

    // エラーの種類に応じたメッセージを返す
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return {
        success: false,
        error: "APIサーバーに接続できませんでした。ネットワーク接続を確認してください。",
        content: "申し訳ありません。サーバーに接続できませんでした。もう一度お試しください。",
      }
    }

    if (error.name === "AbortError" || error.code === "ETIMEDOUT") {
      return {
        success: false,
        error: "API応答がタイムアウトしました。",
        content: "申し訳ありません。応答の生成に時間がかかりすぎています。もう一度お試しください。",
      }
    }

    return {
      success: false,
      error: error.message || "AI応答の生成に失敗しました",
      content: "申し訳ありません。応答の生成中にエラーが発生しました。もう一度お試しください。",
    }
  }
}

// 他の関数は変更なし
