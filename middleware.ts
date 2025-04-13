import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

// 認証が必要なルート
const protectedRoutes = ["/chat", "/logs", "/profile", "/settings"]

// 認証不要のルート
const authRoutes = ["/login", "/signup"]

// API ルートやその他の除外パス
const excludedPaths = ["/api", "/_next", "/favicon.ico", "/images"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 除外パスの場合は処理をスキップ
  if (excludedPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // 保護されていないルートの場合は処理をスキップ
  if (!protectedRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  try {
    // Supabaseクライアントを作成
    const supabase = createServerSupabaseClient()

    // 現在のセッションを取得
    const {
      data: { session },
    } = await supabase.auth.getSession()

    // 未認証ユーザーが保護されたルートにアクセスした場合はログインページにリダイレクト
    if (!session && protectedRoutes.some((route) => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url))
    }

    // 認証済みユーザーは通過
    return NextResponse.next()
  } catch (error: any) {
    console.warn("Middleware warning:", error.message)

    // エラーが発生した場合は安全のためログインページにリダイレクト
    return NextResponse.redirect(new URL(`/login?redirect=${encodeURIComponent(pathname)}`, request.url))
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
