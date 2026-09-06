import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { type EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const error = searchParams.get('error')
  const error_description = searchParams.get('error_description')
  
  // 'next' is a redirect path parameter we can pass to tell Supabase where to go after login
  const next = searchParams.get('next') ?? '/members-only'

  if (error) {
    console.error('Supabase Auth error in callback:', error, error_description)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
  }

  const supabase = createClient()

  // Case 1: Handle token_hash from email templates (recommended for SSR email confirmations/invites)
  if (token_hash && type) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })
    
    if (!verifyError) {
      const isInviteOrRecovery = type === 'invite' || type === 'recovery'
      const redirectUrl = isInviteOrRecovery ? '/setup-profile' : next
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Case 2: Handle authorization code from PKCE flow
  if (code) {
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!exchangeError) {
      // If this is an invite or recovery flow, send them to the setup-profile page
      const isInviteOrRecovery = request.url.includes('type=invite') || request.url.includes('type=recovery')
      const redirectUrl = isInviteOrRecovery ? '/setup-profile' : next
      
      return NextResponse.redirect(`${origin}${redirectUrl}`)
    }
  }

  // Case 3: Handle client-side hash fragment (Implicit Flow for invites/recovery)
  // When Supabase redirects with `#access_token=...`, the server does not receive the hash fragment.
  // We return a lightweight client page that forwards the hash to /setup-profile.
  const clientRedirectHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Authenticating...</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        background-color: #09090b;
        color: #f4f4f5;
      }
      .card {
        text-align: center;
        background: #18181b;
        padding: 32px;
        border-radius: 16px;
        border: 1px solid #27272a;
        max-width: 380px;
        width: 90%;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
      }
      .spinner {
        width: 36px;
        height: 36px;
        border: 3px solid #27272a;
        border-top-color: #b91c1c;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="spinner"></div>
      <h2 style="font-size: 18px; margin: 0 0 8px; font-weight: 600;">Verifying Invitation...</h2>
      <p style="font-size: 13px; color: #a1a1aa; margin: 0;">Please wait while we set up your session.</p>
    </div>
    <script>
      (function() {
        var hash = window.location.hash;
        if (hash && (hash.includes('access_token=') || hash.includes('type=invite') || hash.includes('type=recovery'))) {
          window.location.replace('/setup-profile' + hash);
        } else if (hash && hash.includes('error=')) {
          window.location.replace('/login?error=auth-failed');
        } else {
          window.location.replace('/login?error=auth-failed');
        }
      })();
    </script>
  </body>
</html>`

  return new NextResponse(clientRedirectHtml, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  })
}
