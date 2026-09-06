import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// 1. Read environment variables from .env.local if available
const envPath = path.resolve(process.cwd(), '.env.local')
let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwdejhnhvzfhfwatvhgl.supabase.co'
let serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8')
  for (const line of content.split('\n')) {
    const match = line.trim().match(/^([^=]+)=(.*)$/)
    if (match) {
      const key = match[1].trim()
      const val = match[2].trim().replace(/^["'](.*)["']$/, '$1')
      if (key === 'NEXT_PUBLIC_SUPABASE_URL' && !supabaseUrl) supabaseUrl = val
      if (key === 'SUPABASE_SERVICE_ROLE_KEY') serviceRoleKey = val
    }
  }
}

// 2. Fallback: prompt or check service role key
if (!serviceRoleKey) {
  console.error('\x1b[31m[ERROR] SUPABASE_SERVICE_ROLE_KEY is required.\x1b[0m')
  console.log('Please add your secret service_role key to .env.local or pass it as an environment variable:')
  console.log('  SUPABASE_SERVICE_ROLE_KEY="ey..." node scripts/invite-members.mjs\n')
  console.log('You can find this key in: Supabase Dashboard -> Project Settings -> API -> Project API Keys -> "service_role" (secret)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 3. Read emails from scripts/emails.txt or arguments
const emailsFile = path.resolve(process.cwd(), 'scripts', 'emails.txt')
let rawEmails = ''

if (fs.existsSync(emailsFile)) {
  rawEmails = fs.readFileSync(emailsFile, 'utf8')
}

const emails = rawEmails
  .split(/[\r\n,;]+/)
  .map(e => e.trim().toLowerCase())
  .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))

if (emails.length === 0) {
  console.log('\x1b[33m[!] No valid emails found in scripts/emails.txt\x1b[0m')
  console.log('Please paste your member emails into scripts/emails.txt (one per line) and run again.')
  process.exit(0)
}

console.log(`\nFound ${emails.length} email(s) to process.\n`)

async function inviteAll() {
  let invited = 0
  let skipped = 0
  let failed = 0

  for (const email of emails) {
    try {
      // Check if user already exists
      const { data: usersData, error: listError } = await supabase.auth.admin.listUsers()
      
      const existingUser = usersData?.users?.find(u => u.email?.toLowerCase() === email)

      if (existingUser) {
        if (existingUser.email_confirmed_at || existingUser.last_sign_in_at) {
          console.log(`\x1b[33m- SKIPPED (Active Account):\x1b[0m ${email}`)
        } else {
          console.log(`\x1b[33m- SKIPPED (Pending Invite Exists):\x1b[0m ${email}`)
        }
        skipped++
        continue
      }

      // Send invite
      const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: 'https://thetatauxi.org/setup-profile'
      })

      if (inviteError) {
        console.error(`\x1b[31m- FAILED:\x1b[0m ${email} (${inviteError.message})`)
        failed++
      } else {
        console.log(`\x1b[32m+ INVITED:\x1b[0m ${email}`)
        invited++
      }
    } catch (err) {
      console.error(`\x1b[31m- ERROR:\x1b[0m ${email}`, err)
      failed++
    }
  }

  console.log('\n----------------------------------------')
  console.log(`SUMMARY: Invited: ${invited}, Skipped: ${skipped}, Failed: ${failed}`)
  console.log('----------------------------------------\n')
}

inviteAll()
