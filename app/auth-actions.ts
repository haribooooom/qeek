"use server"

import { revalidatePath } from "next/cache"
import { createServerSupabaseClient } from "@/lib/supabase"
import { getReadableErrorMessage } from "@/lib/error-utils"

// サインアップ
export async function handleSignUp(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "メールアドレスとパスワードを入力してください" }
  }

  try {
    const supabase = createServerSupabaseClient()

    // サインアップ
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error("サインアップエラー:", authError)
      return { success: false, error: getReadableErrorMessage(authError) }
    }

    if (!authData.user) {
      return { success: false, error: "ユーザー作成に失敗しました" }
    }

    // ユーザーテーブルにレコードを作成
    const { error: dbError } = await supabase.from("users").insert({
      id: authData.user.id,
      email: authData.user.email,
    })

    if (dbError) {
      console.error("ユーザーデータ作成エラー:", dbError)
      // 認証は成功しているので、エラーは返さない
    }

    revalidatePath("/")
    return { success: true, user: authData.user }
  } catch (error: any) {
    console.error("サインアップ処理エラー:", error)
    return { success: false, error: getReadableErrorMessage(error) }
  }
}

// サインイン
export async function handleSignIn(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "メールアドレスとパスワードを入力してください" }
  }

  try {
    const supabase = createServerSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("サインインエラー:", error)
      return { success: false, error: getReadableErrorMessage(error) }
    }

    revalidatePath("/")
    return { success: true, user: data.user }
  } catch (error: any) {
    console.error("サインイン処理エラー:", error)
    return { success: false, error: getReadableErrorMessage(error) }
  }
}

// サインアウト
export async function handleSignOut() {
  try {
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("サインアウトエラー:", error)
      return { success: false, error: getReadableErrorMessage(error) }
    }

    revalidatePath("/")
    return { success: true }
  } catch (error: any) {
    console.error("サインアウト処理エラー:", error)
    return { success: false, error: getReadableErrorMessage(error) }
  }
}
