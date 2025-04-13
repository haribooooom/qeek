import { Suspense } from "react"
import SearchQueryInfo from "./SearchQueryInfo"
import Link from "next/link"

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-6xl font-bold text-gray-900">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mt-4">ページが見つかりません</h2>

        <p className="mt-4 text-gray-600">お探しのページは存在しないか、移動した可能性があります。</p>

        {/* SearchQueryInfo コンポーネントを Suspense でラップ */}
        <Suspense fallback={<div className="mt-4 h-16 bg-gray-100 rounded-md animate-pulse"></div>}>
          <SearchQueryInfo />
        </Suspense>

        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
