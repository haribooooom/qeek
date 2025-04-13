type CacheItem<T> = {
  value: T
  expiry: number
}

class CacheManager {
  private cache: Map<string, CacheItem<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // デフォルト5分

  // キャッシュからデータを取得
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    // キャッシュが存在しない場合
    if (!item) return null

    // キャッシュが期限切れの場合
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }

    return item.value as T
  }

  // キャッシュにデータを設定
  set<T>(key: string, value: T, ttl: number = this.defaultTTL): void {
    const expiry = Date.now() + ttl
    this.cache.set(key, { value, expiry })
  }

  // キャッシュを削除
  delete(key: string): void {
    this.cache.delete(key)
  }

  // キャッシュをクリア
  clear(): void {
    this.cache.clear()
  }

  // 期限切れのキャッシュをクリア
  clearExpired(): void {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

// シングルトンインスタンスを作成
export const cacheManager = new CacheManager()

// キャッシュ付きの関数を作成するヘルパー
export function withCache<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>,
  keyFn: (...args: Args) => string,
  ttl?: number,
): (...args: Args) => Promise<T> {
  return async (...args: Args): Promise<T> => {
    const key = keyFn(...args)
    const cached = cacheManager.get<T>(key)

    if (cached !== null) {
      return cached
    }

    const result = await fn(...args)
    cacheManager.set(key, result, ttl)
    return result
  }
}
