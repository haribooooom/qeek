import { NextResponse } from "next/server"
import { seedDatabase } from "@/lib/seed-utils"

export async function POST() {
  // 本番環境では実行できないようにする
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEEDING !== "true") {
    return NextResponse.json({ success: false, error: "本番環境ではシードを実行できません" }, { status: 403 })
  }

  const result = await seedDatabase()

  if (!result.success) {
    return NextResponse.json({ success: false, error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
