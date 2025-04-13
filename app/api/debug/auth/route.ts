import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()

    // セッション情報を取得
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          success: false,
          error: sessionError.message,
          message: "セッション取得に失敗しました",
        },
        { status: 500 },
      )
    }

    // 環境変数の状態を確認
    const envStatus = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? "設定済み" : "未設定",
    }

    return NextResponse.json({
      success: true,
      session: {
        exists: !!sessionData.session,
        expiresAt: sessionData.session?.expires_at || null,
      },
      user: sessionData.session?.user
        ? {
            id: sessionData.session.user.id,
            email: sessionData.session.user.email,
          }
        : null,
      envStatus,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        message: "認証状態の確認中にエラーが発生しました",
      },
      { status: 500 },
    )
  }
}
