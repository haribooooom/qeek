import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabase"

export default async function ProfilePage() {
  // サーバーサイドでセッションを検証
  const supabase = createServerSupabaseClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  // エラーまたはセッションがない場合はリダイレクト
  if (error || !session) {
    console.error("Auth session missing or error:", error?.message)
    redirect("/login?redirect=/profile")
  }

  // ユーザー情報を取得
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (profileError) {
    console.error("Profile fetch error:", profileError.message)
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">プロフィール</h1>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        {profile ? (
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-medium text-gray-500">メールアドレス</h2>
              <p className="text-lg">{session.user.email}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">ユーザーID</h2>
              <p className="text-lg">{session.user.id}</p>
            </div>

            <div>
              <h2 className="text-sm font-medium text-gray-500">アカウント作成日</h2>
              <p className="text-lg">{new Date(profile.created_at).toLocaleDateString("ja-JP")}</p>
            </div>
          </div>
        ) : (
          <p className="text-gray-500">プロフィール情報を読み込み中...</p>
        )}
      </div>
    </div>
  )
}
