import { NextResponse } from "next/server"
import { OpenAI } from "openai"

export async function POST(request: Request) {
  try {
    // OpenAI API キーが設定されているか確認
    if (!process.env.OPENAI_API_KEY) {
      console.warn("OpenAI API キーが設定されていません。デフォルトの応答を返します。")
      return NextResponse.json({
        success: true,
        content: "その問いについて考えてみましょう。もう少し詳しく教えていただけますか？",
      })
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ success: false, error: "メッセージが無効です" }, { status: 400 })
    }

    // OpenAIクライアントの初期化
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    return NextResponse.json({
      success: true,
      content: completion.choices[0].message.content || "",
    })
  } catch (error: any) {
    console.error("AI応答生成エラー:", error)

    // エラーの種類に応じたメッセージを返す
    if (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND") {
      return NextResponse.json(
        {
          success: false,
          error: "APIサーバーに接続できませんでした。ネットワーク接続を確認してください。",
          content: "申し訳ありません。サーバーに接続できませんでした。もう一度お試しください。",
        },
        { status: 503 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: error.message || "AI応答の生成に失敗しました",
        content: "申し訳ありません。応答の生成中にエラーが発生しました。もう一度お試しください。",
      },
      { status: 500 },
    )
  }
}
