import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? "設定済み" : "未設定",
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "設定済み" : "未設定",
    supabaseServiceRole: process.env.SUPABASE_SERVICE_ROLE_KEY ? "設定済み" : "未設定",
    nodeEnv: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
}
