import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  const { category, message, email } = await req.json()

  if (!message?.trim()) {
    return NextResponse.json({ error: 'メッセージは必須です' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error: dbError } = await supabase
    .from('feedbacks')
    .insert({
      user_id: user?.id ?? null,
      category,
      message,
      email: email || null,
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  await resend.emails.send({
    from: 'Golf Caddy <onboarding@resend.dev>',
    to: 'golfcaddy.support@gmail.com',
    subject: `[フィードバック] ${category}`,
    text: [
      `カテゴリ: ${category}`,
      `メッセージ:\n${message}`,
      email ? `返信先: ${email}` : '返信先: なし',
      `送信日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}`,
    ].join('\n\n'),
  })

  return NextResponse.json({ ok: true })
}
