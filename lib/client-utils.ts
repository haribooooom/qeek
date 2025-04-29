type AIResponse = {
  success: boolean;
  content?: any;
  error?: string;
};

export async function requestAIResponse(messages: any[]): Promise<AIResponse> {
  const res = await fetch('/api/ai/generate-response', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  let data: any;
  try {
    data = await res.json();
  } catch {
    throw new Error(`API応答エラー: レスポンスのパースに失敗しました`);
  }

  if (!res.ok) {
    throw new Error(`API応答エラー: ステータスコード ${res.status}\n${data?.error || 'エラー詳細不明'}`);
  }

  return data;
}