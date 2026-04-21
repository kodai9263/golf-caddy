import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  // オープンリダイレクト対策：環境変数で固定できるようにする
  const appOrigin = process.env.NEXT_PUBLIC_SITE_URL || origin
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(`${appOrigin}/login?error=no_code`)
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    // エラー詳細を隠蔽してメッセージ漏洩を防ぐ
    return NextResponse.redirect(`${appOrigin}/login?error=auth_failed`)
  }

  // 初回ログインか既存ユーザーかを判定してリダイレクト先を決める
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(`${appOrigin}/login`)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  // プロフィールがなければ初回セットアップへ、あればメイン画面へ
  const redirectTo = profile ? '/' : '/setup'
  return NextResponse.redirect(`${appOrigin}${redirectTo}`)
}
