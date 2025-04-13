import { NextResponse } from "next/server"
import { OpenAI } from "openai"

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { question, diagnosis } = await request.json()

    if (!question || !diagnosis) {
      return NextResponse.json({ success: false, error: "パラメータが無効です" }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはQeekというアプリケーションのリソース推薦エンジンです。
          ユーザーの問いと診断結果に基づいて、データベースから最適なリソースを選択してください。
          以下のリソースIDのリストを返してください:
          ["r_001", "r_002", ...]
          
          利用可能なリソース:
          r_001: 未経験からエンジニアになるためのロードマップ (guide)
          r_002: プログラミング学習サイトProgate (tool)
          r_003: IT未経験者向け転職エージェント (service)
          r_004: キャリアコーチング無料相談 (coach)`,
        },
        {
          role: "user",
          content: `問い: ${question}\n\n診断結果: ${JSON.stringify(diagnosis)}`,
        },
      ],
      temperature: 0.3,
      max_tokens: 100,
    })

    const content = completion.choices[0].message.content || ""
    // 文字列からリソースIDの配列を抽出
    const resourceIds = content.match(/r_\d{3}/g) || []

    return NextResponse.json({
      success: true,
      resourceIds,
    })
  } catch (error: any) {
    console.error("リソース推薦エラー:", error)
    return NextResponse.json(
      { success: false, error: error.message || "リソースの推薦に失敗しました" },
      { status: 500 },
    )
  }
}
