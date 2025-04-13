import { createClient } from "@supabase/supabase-js"

// サーバーサイド用のクライアント
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase環境変数が設定されていません", {
      url: !!supabaseUrl,
      key: !!supabaseKey,
    })
    throw new Error("Supabase環境変数が設定されていません")
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false, // サーバーサイドではセッションを永続化しない
    },
    global: {
      fetch: fetch.bind(globalThis), // 明示的にfetchを指定
    },
    db: {
      schema: "public",
    },
  })
}

// クライアントサイド用のシングルトンクライアント
let clientSupabaseInstance: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  // サーバーサイドレンダリング時は空のモックを返す
  if (typeof window === "undefined") {
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
      },
    } as any
  }

  if (clientSupabaseInstance) return clientSupabaseInstance

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Supabase環境変数が設定されていません", {
      url: !!supabaseUrl,
      key: !!supabaseKey,
    })
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
      },
    } as any
  }

  try {
    clientSupabaseInstance = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "supabase-auth",
      },
    })
    return clientSupabaseInstance
  } catch (error) {
    console.error("Supabaseクライアント作成エラー:", error)
    return {
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: async () => ({ error: null }),
      },
    } as any
  }
}
