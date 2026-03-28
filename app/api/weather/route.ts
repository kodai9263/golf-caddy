import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const lat = searchParams.get('lat')
  const lon = searchParams.get('lon')

  if (!lat || !lon) {
    return NextResponse.json({ error: 'lat と lon が必要です' }, { status: 400 })
  }

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms`

  const res = await fetch(url, { next: { revalidate: 300 } }) // 5分キャッシュ
  if (!res.ok) {
    return NextResponse.json({ error: '気象データの取得に失敗しました' }, { status: 502 })
  }

  const data = await res.json()
  const current = data.current

  return NextResponse.json({
    speed: current.wind_speed_10m as number,       // 風速 (m/s)
    direction: current.wind_direction_10m as number, // 風向 (度)
  })
}
