import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ホールのスコア・ピン座標をupsert
export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { roundId, holeNumber, par, score, putts, pinLat, pinLng } = await req.json()

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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ hole })
}
