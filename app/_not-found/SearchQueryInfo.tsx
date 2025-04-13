"use client"

import { useSearchParams } from "next/navigation"

export default function SearchQueryInfo() {
  const searchParams = useSearchParams()
  const query = searchParams.get("query")

  if (!query) {
    return null
  }

  return (
    <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200">
      <p className="text-gray-600">
        <span className="font-medium">検索クエリ:</span> {query}
      </p>
      <p className="text-sm text-gray-500 mt-2">
        お探しのコンテンツは見つかりませんでした。別のキーワードで検索してみてください。
      </p>
    </div>
  )
}
