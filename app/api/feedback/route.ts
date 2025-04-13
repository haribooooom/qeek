import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { feedback } = await request.json()

    if (!feedback || typeof feedback !== "string") {
      return NextResponse.json({ success: false, error: "フィードバックが無効です" }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // フィードバックテーブルがなければ作成
    await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS feedback (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          content TEXT NOT NULL,
          user_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    })

    // フィードバックを保存
    const { error } = await supabase.from("feedback").insert({
      content: feedback,
      // user_id: ユーザーIDがあれば設定
    })

    if (error) {
      console.error("フィードバック保存エラー:", error)
      return NextResponse.json({ success: false, error: "フィードバックの保存に失敗しました" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("フィードバックAPI エラー:", error)
    return NextResponse.json(
      { success: false, error: error.message || "フィードバックの処理中にエラーが発生しました" },
      { status: 500 },
    )
  }
}
