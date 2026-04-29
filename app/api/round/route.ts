import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// 現在進行中のラウンドを取得（なければnull）
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: round } = await supabase
    .from('rounds')
    .select('*, holes(*)')
    .eq('userId', user.id)
    .eq('isActive', true)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (round?.holes) {
    round.holes = round.holes.sort((a: { holeNumber: number }, b: { holeNumber: number }) => a.holeNumber - b.holeNumber)
  }

  return NextResponse.json({ round })
}

// ラウンド開始
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { courseName, pars } = await req.json()

  if (courseName !== undefined && courseName !== null && (typeof courseName !== 'string' || courseName.length > 100)) {
    return NextResponse.json({ error: 'Invalid courseName' }, { status: 400 })
  }

  // 既存の進行中ラウンドを終了
  await supabase
    .from('rounds')
    .update({ isActive: false })
    .eq('userId', user.id)
    .eq('isActive', true)

  // 新しいラウンドを作成
  const { data: round, error } = await supabase
    .from('rounds')
    .insert({ userId: user.id, courseName: courseName ?? null })
    .select()
    .single()

    if (error || !round) {
      console.error('[round] insert error:', error)
      return NextResponse.json({ error: 'Failed to create round' }, { status: 500 })
    }

  // 18ホール分のParを一括作成
  if (pars && Array.isArray(pars)) {
    const holes = pars.map((par: number, i: number) => ({
      roundId: round.id,
      holeNumber: i + 1,
      par,
    }))
    await supabase.from('holes').insert(holes)
  }

  const { data: roundWithHoles } = await supabase
    .from('rounds')
    .select('*, holes(*)')
    .eq('id', round.id)
    .single()

  if (roundWithHoles?.holes) {
    roundWithHoles.holes = roundWithHoles.holes.sort((a: { holeNumber: number }, b: { holeNumber: number }) => a.holeNumber - b.holeNumber)
  }

  return NextResponse.json({ round: roundWithHoles })
}

// ラウンド終了
export async function PATCH(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roundId } = await req.json()

  const { data: round } = await supabase
    .from('rounds')
    .update({ isActive: false })
    .eq('id', roundId)
    .eq('userId', user.id)
    .select()
    .single()

  return NextResponse.json({ round })
}
