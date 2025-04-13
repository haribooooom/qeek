// エラーメッセージをユーザーフレンドリーに変換
export function getReadableErrorMessage(error: any): string {
  if (typeof error === "string") {
    return error
  }

  if (error?.message) {
    // Supabaseのエラーメッセージを変換
    if (error.message.includes("auth/invalid-email")) {
      return "無効なメールアドレスです"
    }
    if (error.message.includes("auth/wrong-password")) {
      return "パスワードが間違っています"
    }
    if (error.message.includes("auth/user-not-found")) {
      return "ユーザーが見つかりません"
    }
    if (error.message.includes("auth/email-already-in-use")) {
      return "このメールアドレスは既に使用されています"
    }
    if (error.message.includes("auth/weak-password")) {
      return "パスワードが弱すぎます。6文字以上にしてください"
    }

    return error.message
  }

  return "エラーが発生しました。もう一度お試しください"
}

// エラーをログに記録
export function logError(error: any, context = "") {
  console.error(`[${context}]`, error)

  // 実際のアプリではエラー監視サービスに送信するなど
  // 例: Sentry.captureException(error)
}

// API呼び出しの再試行
export async function retryOperation<T>(operation: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: any

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // 最後の試行以外は待機して再試行
      if (i < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError
}
