export async function requestAIResponse(messages: any[]) {
  const res = await fetch('/api/ai/generate-response', {
    method: 'POST',                                 // ← ここを忘れると 405
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  const data = await res.json()
  if (!res.ok) throw new Error(`API応答エラー: ${res.status}\n${data?.error}`)
  return data
}