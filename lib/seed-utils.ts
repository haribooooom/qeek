import { createServerSupabaseClient } from "./supabase"
import fs from "fs"
import path from "path"

export async function seedDatabase() {
  try {
    const supabase = createServerSupabaseClient()

    // SQLファイルを読み込む
    const sqlPath = path.join(process.cwd(), "test-data.sql")
    const sql = fs.readFileSync(sqlPath, "utf8")

    // SQLを実行
    const { error } = await supabase.rpc("exec_sql", { sql_query: sql })

    if (error) {
      console.error("データベースシード実行エラー:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error("データベースシードエラー:", error)
    return { success: false, error: error.message }
  }
}
