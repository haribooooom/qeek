import { NextResponse } from "next/server"
import { OpenAI } from "openai"

// OpenAIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: Request) {
  try {
    const { question, conversation } = await request.json()

    if (!question || !conversation || !Array.isArray(conversation)) {
      return NextResponse.json({ success: false, error: "パラメータが無効です" }, { status: 400 })
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはQeekというアプリケーションのAI診断エンジンです。
          ユーザーの問いと会話履歴を分析し、以下の形式でJSON形式の診断結果を返してください:
          {
            "classification": ["分類1", "分類2"], // 問いの分類（例: "深掘り系", "将来投資"）
            "weight": [60, 40], // 各分類の重み（合計100%）
            "score": 70, // 優先度スコア（0-100）
            "summary": "診断サマリー文", // 問いに対する診断の要約
            "reasons": ["理由1", "理由2", "理由3"] // 診断の根拠となる理由（3つ）
          }
          
          分類は以下のカテゴリから選択してください:
          - 深掘り系: 自己理解や現状分析に関する問い
          - 将来投資: キャリアや学習の方向性に関する問い
          - 行動計画: 具体的な行動や習慣に関する問い
          - 不安解消: 心配事や懸念に関する問い
          - スキル向上: 特定のスキルや知識に関する問い`,
        },
        {
          role: "user",
          content: `問い: ${question}\n\n会話履歴: ${JSON.stringify(conversation)}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    })

    const content = completion.choices[0].message.content || ""
    const diagnosis = JSON.parse(content)

    return NextResponse.json({
      success: true,
      diagnosis,
    })
  } catch (error: any) {
    console.error("問い診断エラー:", error)
    return NextResponse.json({ success: false, error: error.message || "問いの診断に失敗しました" }, { status: 500 })
  }
}
