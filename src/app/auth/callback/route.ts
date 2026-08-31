import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  
  // 'next' is a redirect path parameter we can pass to tell Supabase where to go after login
  const next = searchParams.get('next') ?? '/members-only'

  const supabase = createClient()

  // Case 1: Handle token_hash from email templates (recommended for SSR email confirmations/invites)
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!error) {
      const isInviteOrRecovery = type === 'invite' || type === 'recovery'
      const redirectUrl = isInviteOrRecovery ? '/setup-profile' : next
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Case 2: Handle authorization code from PKCE flow
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If this is an invite or recovery flow, send them to the setup-profile page
      const isInviteOrRecovery = request.url.includes('type=invite') || request.url.includes('type=recovery')
      const redirectUrl = isInviteOrRecovery ? '/setup-profile' : next
      
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // If both exchange and verification fail, return the user to the login page with an error
  return NextResponse.redirect(`${origin}/login?error=auth-failed`)
}
