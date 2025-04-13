import { createClientSupabaseClient } from "./supabase"

// ユーザー認証状態を取得
export async function getCurrentUser() {
  const supabase = createClientSupabaseClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    return null
  }

  return data.user
}

// メールアドレスとパスワードでサインアップ
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClientSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

// メールアドレスとパスワードでサインイン
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClientSupabaseClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, user: data.user }
}

// サインアウト
export async function signOut() {
  const supabase = createClientSupabaseClient()
  const { error } = await supabase.auth.signOut()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

// ユーザー認証状態の変更を監視するカスタムフック
export function useAuthStateChange(callback: (event: "SIGNED_IN" | "SIGNED_OUT", session: any) => void) {
  const supabase = createClientSupabaseClient()

  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
      callback(event, session)
    }
  })
}
