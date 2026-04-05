import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

type RequestBody = {
  distance: number
  windSpeed: number
  windDirection: number
  clubs: { name: string; distance: number }[]
  headSpeed?: number | null
}

export async function POST(request: Request) {
  // 認証チェック
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: RequestBody = await request.json()
  const { distance, windSpeed, windDirection, clubs, headSpeed } = body

  // 風向を人間が読める形式に変換
  const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
  const windDirectionText = directions[Math.round(windDirection / 45) % 8]

  const clubList = clubs
    .map((c) => `${c.name}: ${c.distance}ヤード`)
    .join('\n')

  // ヘッドスピードが登録されている場合はプレイヤー情報を追加
  const playerInfo = headSpeed
    ? `\n【プレイヤー情報】\n- ヘッドスピード（ドライバー）: ${headSpeed} m/s\n`
    : ''

  const swingAdvice = headSpeed
    ? '3. 推奨クラブでの振り幅を時計表現（例: 9時〜3時のハーフスイング）と力感（例: 約80%・HS目安35m/s）で具体的に教えてください'
    : '3. 打ち方のポイントを1文で添えてください'

  const prompt = `あなたはプロゴルフキャディです。以下の条件でクラブ選択のアドバイスをしてください。

【状況】
- ピンまでの距離: ${distance}ヤード
- 風速: ${windSpeed.toFixed(1)} m/s
- 風向: ${windDirectionText}
${playerInfo}
【使用可能なクラブと飛距離】
${clubList}

【指示】
1. 推奨クラブを1〜2本挙げてください
2. 風の影響を考慮した実効距離を示してください
${swingAdvice}
4. 返答は日本語で、3〜5文の簡潔な文章にしてください`

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await groq.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 350,
          stream: true,
        })
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(encoder.encode(text))
          }
        }
      } catch (e) {
        controller.enqueue(encoder.encode(`\nエラー: ${e instanceof Error ? e.message : '不明なエラー'}`))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
    },
  })
}
