import { createServerSupabaseClient } from "./supabase"
import { withCache } from "./cache-utils"

// リソース取得（キャッシュ付き）
export const getResources = withCache(
  async () => {
    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase.from("resources").select("*")

    if (error) {
      console.error("リソース取得エラー:", error)
      return []
    }

    return data
  },
  () => "resources",
  10 * 60 * 1000, // 10分キャッシュ
)

// 問い（質問）の保存
export async function saveQuestion(title: string, userId?: string) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("questions")
    .insert({
      title,
      user_id: userId || null,
      score: null,
      bookmarked: false,
    })
    .select()
    .single()

  if (error) {
    console.error("問い保存エラー:", error)
    return null
  }

  return data
}

// 問いの取得
export async function getQuestions(userId?: string, bookmarkedOnly = false) {
  const supabase = createServerSupabaseClient()

  let query = supabase.from("questions").select("*").order("created_at", { ascending: false })

  if (userId) {
    query = query.eq("user_id", userId)
  }

  if (bookmarkedOnly) {
    query = query.eq("bookmarked", true)
  }

  const { data, error } = await query

  if (error) {
    console.error("問い取得エラー:", error)
    return []
  }

  return data
}

// 問いの詳細取得（メッセージと診断結果を含む）
export async function getQuestionDetails(questionId: string) {
  const supabase = createServerSupabaseClient()

  // 問いの基本情報を取得
  const { data: question, error: questionError } = await supabase
    .from("questions")
    .select("*")
    .eq("id", questionId)
    .single()

  if (questionError) {
    console.error("問い詳細取得エラー:", questionError)
    return null
  }

  // メッセージを取得
  const { data: messages, error: messagesError } = await supabase
    .from("messages")
    .select("*")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true })

  if (messagesError) {
    console.error("メッセージ取得エラー:", messagesError)
  }

  // 診断結果を取得
  const { data: diagnosis, error: diagnosisError } = await supabase
    .from("diagnoses")
    .select("*")
    .eq("question_id", questionId)
    .single()

  if (diagnosisError && diagnosisError.code !== "PGRST116") {
    // PGRST116 は「結果が見つからない」エラー
    console.error("診断結果取得エラー:", diagnosisError)
  }

  return {
    question,
    messages: messages || [],
    diagnosis: diagnosis || null,
  }
}

// メッセージの保存
export async function saveMessage(questionId: string, sender: "user" | "ai", content: string) {
  try {
    const supabase = createServerSupabaseClient()

    // リトライロジックを追加
    let retries = 3
    let lastError = null

    while (retries > 0) {
      try {
        const { data, error } = await supabase
          .from("messages")
          .insert({
            question_id: questionId,
            sender,
            content,
          })
          .select()
          .single()

        if (error) {
          throw error
        }

        return data
      } catch (err) {
        lastError = err
        retries--
        if (retries > 0) {
          // 再試行前に少し待機
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
      }
    }

    // すべての再試行が失敗した場合
    console.error("メッセージ保存エラー:", lastError)

    // エラーがあっても処理を続行できるようにダミーデータを返す
    return {
      id: `temp-${Date.now()}`,
      question_id: questionId,
      sender,
      content,
      created_at: new Date().toISOString(),
    }
  } catch (error: any) {
    console.error("メッセージ保存エラー:", error)

    // エラーがあっても処理を続行できるようにダミーデータを返す
    return {
      id: `temp-${Date.now()}`,
      question_id: questionId,
      sender,
      content,
      created_at: new Date().toISOString(),
    }
  }
}

// 診断結果の保存
export async function saveDiagnosis(
  questionId: string,
  classification: string[],
  weight: number[],
  score: number,
  summary: string,
  reasons: string[],
) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase
    .from("diagnoses")
    .insert({
      question_id: questionId,
      classification,
      weight,
      score,
      summary,
      reasons,
    })
    .select()
    .single()

  if (error) {
    console.error("診断結果保存エラー:", error)
    return null
  }

  return data
}

// ブックマーク状態の更新
export async function updateBookmarkStatus(questionId: string, bookmarked: boolean) {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.from("questions").update({ bookmarked }).eq("id", questionId).select().single()

  if (error) {
    console.error("ブックマーク更新エラー:", error)
    return null
  }

  return data
}

// 問いの削除
export async function deleteQuestion(questionId: string) {
  const supabase = createServerSupabaseClient()

  const { error } = await supabase.from("questions").delete().eq("id", questionId)

  if (error) {
    console.error("問い削除エラー:", error)
    return false
  }

  return true
}
