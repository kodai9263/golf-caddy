import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

type RequestBody = {
  distance: number
  windSpeed: number
  windDirection: number
  clubs: { name: string; distance: number }[]
  headSpeed?: number | null
  lang?: 'ja' | 'en'
}

export async function POST(request: Request) {
  // 認証チェック
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const body: RequestBody = await request.json()
  const { distance, windSpeed, windDirection, clubs, headSpeed, lang = 'ja' } = body

  // 入力値のバリデーション（不正なリクエストによるAPI無駄消費を防ぐ）
  if (
    typeof distance !== 'number' || distance < 1 || distance > 600 ||
    typeof windSpeed !== 'number' || windSpeed < 0 || windSpeed > 50 ||
    typeof windDirection !== 'number' || windDirection < 0 || windDirection > 360 ||
    !Array.isArray(clubs) || clubs.length === 0 || clubs.length > 20 ||
    clubs.some(c => typeof c.name !== 'string' || c.name.length > 30 || typeof c.distance !== 'number')
  ) {
    return new Response('Bad Request', { status: 400 })
  }

  const clubList = clubs
    .map((c) => `${c.name}: ${c.distance} yards`)
    .join('\n')

  let prompt: string

  if (lang === 'en') {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const windDirectionText = directions[Math.round(windDirection / 45) % 8]

    const playerInfo = headSpeed
      ? `\n[Player Info]\n- Head speed (driver): ${headSpeed} m/s\n`
      : ''

    const swingAdvice = headSpeed
      ? '3. For the recommended club, describe the swing length using clock positions (e.g. 9 o\'clock to 3 o\'clock half swing) and effort level (e.g. ~80%, HS target 35 m/s)'
      : '3. Add one sentence tip on how to play the shot'

    prompt = `You are a professional golf caddy. Please provide club selection advice based on the following conditions.

[Situation]
- Distance to pin: ${distance} yards
- Wind speed: ${windSpeed.toFixed(1)} m/s
- Wind direction: ${windDirectionText}
${playerInfo}
[Available clubs and distances]
${clubList}

[Instructions]
1. Recommend 1-2 clubs
2. Show the effective distance considering wind
${swingAdvice}
4. Reply in English, 3-5 concise sentences`
  } else {
    const directions = ['北', '北東', '東', '南東', '南', '南西', '西', '北西']
    const windDirectionText = directions[Math.round(windDirection / 45) % 8]

    const playerInfo = headSpeed
      ? `\n【プレイヤー情報】\n- ヘッドスピード（ドライバー）: ${headSpeed} m/s\n`
      : ''

    const swingAdvice = headSpeed
      ? '3. 推奨クラブでの振り幅を時計表現（例: 9時〜3時のハーフスイング）と力感（例: 約80%・HS目安35m/s）で具体的に教えてください'
      : '3. 打ち方のポイントを1文で添えてください'

    const clubListJa = clubs
      .map((c) => `${c.name}: ${c.distance}ヤード`)
      .join('\n')

    prompt = `あなたはプロゴルフキャディです。以下の条件でクラブ選択のアドバイスをしてください。

【状況】
- ピンまでの距離: ${distance}ヤード
- 風速: ${windSpeed.toFixed(1)} m/s
- 風向: ${windDirectionText}
${playerInfo}
【使用可能なクラブと飛距離】
${clubListJa}

【指示】
1. 推奨クラブを1〜2本挙げてください
2. 風の影響を考慮した実効距離を示してください
${swingAdvice}
4. 返答は日本語で、3〜5文の簡潔な文章にしてください`
  }

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
        const msg = lang === 'en'
          ? `\nError: ${e instanceof Error ? e.message : 'Unknown error'}`
          : `\nエラー: ${e instanceof Error ? e.message : '不明なエラー'}`
        controller.enqueue(encoder.encode(msg))
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
