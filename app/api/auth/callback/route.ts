import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=${error.message}`)
  }

  // 初回ログインか既存ユーザーかを判定してリダイレクト先を決める
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${origin}/login`)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // プロフィールがなければ初回セットアップへ、あればメイン画面へ
  const redirectTo = profile ? '/' : '/setup'
  return NextResponse.redirect(`${origin}${redirectTo}`)
}
