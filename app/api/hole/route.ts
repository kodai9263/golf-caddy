import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ホールのスコア・ピン座標をupsert
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roundId, holeNumber, par, score, putts, pinLat, pinLng } = await req.json()

  // roundIdが自分のラウンドか確認（他人のラウンドへの書き込みを防ぐ）
  const { data: round } = await supabase
    .from('rounds')
    .select('id')
    .eq('id', roundId)
    .eq('userId', user.id)
    .single()

  if (!round) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data: hole, error } = await supabase
    .from('holes')
    .upsert(
      {
        roundId,
        holeNumber,
        ...(par !== undefined && { par }),
        ...(score !== undefined && { score }),
        ...(putts !== undefined && { putts }),
        ...(pinLat !== undefined && { pinLat }),
        ...(pinLng !== undefined && { pinLng }),
      },
      { onConflict: 'roundId,holeNumber' }
    )
    .select()
    .single()

    if (error) {
      console.error('[hole] upsert error:', error)
      return NextResponse.json({ error: 'Failed to save hole' }, { status: 500 })
    }

  return NextResponse.json({ hole })
}
