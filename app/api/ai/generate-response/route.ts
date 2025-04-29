'use server'                       // ❶ サーバーファイル宣言
// export const runtime = 'nodejs'     // ❷ Edge ではなく Node.js で実行

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    // ----------- 受け取る JSON 構造を messages に合わせる -----------
    const { messages } = await req.json()
    if (!Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'messages 配列が必要です' },
        { status: 400 },
      )
    }

    // ----------- ここでだけ動的 import -----------
    const { OpenAI } = await import('openai')
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,            // ← そのまま渡す
      temperature: 0.7,
      max_tokens: 500,
    })

    return NextResponse.json({
      success: true,
      content: completion.choices[0].message.content ?? '',
    })
  } catch (err: any) {
    console.error('[AI ERR]', err)
    return NextResponse.json(
      {
        success: false,
        error: err.message ?? 'AI応答生成に失敗しました',
      },
      { status: 500 },
    )
  }
}