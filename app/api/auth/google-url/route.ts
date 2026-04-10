import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      skipBrowserRedirect: true,
    },
  })

  if (error || !data.url) {
    return NextResponse.json({ error: 'oauth_failed' }, { status: 500 })
  }

  return NextResponse.json({ url: data.url })
}
