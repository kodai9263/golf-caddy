import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ショット記録を保存
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { holeId, distance, recommendedClub, usedClub } = await req.json()

  if (typeof distance !== 'number' || distance < 0 || distance > 700) {
    return NextResponse.json({ error: 'Invalid distance' }, { status: 400 })
  }

  if (typeof usedClub !== 'string' || usedClub.trim() === '' || usedClub.length > 30) {
    return NextResponse.json({ error: 'Invalid usedClub' }, { status: 400 })
  }

  const { data: shot, error } = await supabase
    .from('shots')
    .insert({ userId: user.id, holeId: holeId ?? null, distance, recommendedClub, usedClub })
    .select()
    .single()

  if (error) {
    console.error('[shot] insert: error:', error)
    return NextResponse.json({ error: 'Failed to save shot' }, { status: 500 })
  }

  return NextResponse.json({ shot })
}

// 番手別実績を取得
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: shots, error } = await supabase
    .from('shots')
    .select('usedClub, distance')
    .eq('userId', user.id)
    .order('createdAt', { ascending: false })

  if (error) {
    console.error('[shot] select: error:', error)
    return NextResponse.json({ error: 'Failed to fetch shot' }, { status: 500 })
  }

  // 番手ごとに集計
  const stats: Record<string, { count: number; total: number; min: number; max: number }> = {}
  for (const s of shots ?? []) {
    if (!stats[s.usedClub]) {
      stats[s.usedClub] = { count: 0, total: 0, min: Infinity, max: -Infinity }
    }
    stats[s.usedClub].count++
    stats[s.usedClub].total += s.distance
    stats[s.usedClub].min = Math.min(stats[s.usedClub].min, s.distance)
    stats[s.usedClub].max = Math.max(stats[s.usedClub].max, s.distance)
  }

  const result = Object.entries(stats).map(([club, s]) => ({
    club,
    count: s.count,
    avg: Math.round(s.total / s.count),
    min: Math.round(s.min),
    max: Math.round(s.max),
  }))

  return NextResponse.json({ stats: result })
}
