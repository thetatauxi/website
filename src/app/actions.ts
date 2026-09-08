'use server'

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncSheetToSupabase, syncAllSheetsToSupabase, processNewAccountIntake, type AccountIntakeResult } from '@/lib/sheets/sync-engine';
import { getSheetConfigById, SyncResult } from '@/config/sheets';
import { sendSetupEmail } from '@/lib/resend';

export async function logoutAction() {
  const supabase = createClient();
  await supabase.auth.signOut();
  cookies().delete('member_auth');
  redirect('/login');
}

export async function loginAction(formData: FormData) {
  const usernameInput = formData.get('username') as string
  const passwordInput = formData.get('password') as string

  let email = (usernameInput || '').trim()
  if (!email.includes('@')) {
    email = `${email}@wisc.edu`
  }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: passwordInput,
  })

  if (error) {
    redirect('/login?error=1')
  }

  redirect('/members-only')
}

/**
 * Checks if the current user has permission to sync data
 */
async function verifySyncPermission(sheetId?: string) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized. Please log in to sync data.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    throw new Error('Profile not found for authenticated user.');
  }

  const userRole = (profile.role || '').toLowerCase();

  if (sheetId) {
    const config = getSheetConfigById(sheetId);
    if (config?.allowedRoles && config.allowedRoles.length > 0) {
      const isAllowed = config.allowedRoles.map(r => r.toLowerCase()).includes(userRole);
      if (!isAllowed) {
        throw new Error(`Forbidden: Role "${profile.role}" is not authorized to sync "${config.name}".`);
      }
      return { user, profile, supabase };
    }
  }

  const defaultAllowedRoles = [
    'regent',
    'vice regent',
    'corresponding secretary',
    'scribe',
    'treasurer',
    'marshall',
    'general chair',
    'rush chair',
    'admin',
    'website chair',
    'web chair',
    'website',
  ];

  if (!defaultAllowedRoles.includes(userRole)) {
    throw new Error('Forbidden: Only E-board and Admin members can trigger syncs.');
  }

  return { user, profile, supabase };
}

/**
 * Syncs a specific configured Google Sheet by its ID
 */
export async function syncSheetAction(sheetId: string): Promise<SyncResult> {
  try {
    const { supabase } = await verifySyncPermission(sheetId);
    const result = await syncSheetToSupabase(sheetId, supabase);
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
    return {
      sheetId,
      sheetName: sheetId,
      supabaseTable: '',
      success: false,
      totalRowsRead: 0,
      updatedCount: 0,
      insertedCount: 0,
      failedCount: 0,
      errors: [errorMsg],
      durationMs: 0,
      syncedAt: new Date().toISOString(),
    };
  }
}

/**
 * Syncs all configured Google Sheets in the registry
 */
export async function syncAllSheetsAction(): Promise<SyncResult[]> {
  try {
    const { supabase } = await verifySyncPermission();
    const results = await syncAllSheetsToSupabase(supabase);
    return results;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to sync sheets';
    return [{
      sheetId: 'all',
      sheetName: 'All Sheets',
      supabaseTable: '',
      success: false,
      totalRowsRead: 0,
      updatedCount: 0,
      insertedCount: 0,
      failedCount: 0,
      errors: [errorMsg],
      durationMs: 0,
      syncedAt: new Date().toISOString(),
    }];
  }
}

/**
 * Backwards compatible member status sync action
 */
export async function syncMemberStatusAction() {
  const res = await syncSheetAction('roster_status');
  if (!res.success) {
    throw new Error(res.errors.join('; ') || 'Failed to sync member status from Google Sheet.');
  }

  const count = res.updatedCount + res.insertedCount;
  if (count === 0) {
    throw new Error(
      'No matching profiles found in Supabase. Make sure the usernames in your Google Sheet match the usernames in the profiles table.'
    );
  }

  return { success: true, count };
}

/**
 * Processes prospective member emails from the NewAccountIntake sheet tab:
 * sends Supabase Auth invites to new users, skips existing accounts,
 * wipes processed entries from the Google Sheet, and returns the intake summary.
 */
export async function processNewAccountIntakeAction(): Promise<AccountIntakeResult> {
  try {
    await verifySyncPermission();
    const result = await processNewAccountIntake();
    return result;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown intake processing error';
    return {
      success: false,
      totalFound: 0,
      invitesSent: 0,
      alreadyUsed: 0,
      message: `Failed to process account intake: ${errorMsg}`,
      wiped: false,
      invitedEmails: [],
      alreadyUsedEmails: [],
      errors: [errorMsg],
    };
  }
}

/**
 * Helper to find or create a user and profile row, ensuring they have an auth ID
 */
async function getOrCreateUserAndProfile(email: string) {
  const adminSupabase = createAdminClient();
  const username = email.split('@')[0];

  // 1. Check profiles table first
  const { data: profile } = await adminSupabase
    .from('profiles')
    .select('id, email, username')
    .or(`email.ilike.${email},username.ilike.${username}`)
    .maybeSingle();

  if (profile) {
    return { userId: profile.id, username: profile.username || username };
  }

  // 2. Check auth users
  const { data: usersData } = await adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const authUser = (usersData?.users || []).find(u => u.email?.toLowerCase() === email.toLowerCase());

  let userId: string;
  if (authUser) {
    userId = authUser.id;
  } else {
    // 3. Create auth user
    const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (createError || !newUser?.user) {
      throw new Error(createError?.message || `Failed to create auth user for ${email}`);
    }
    userId = newUser.user.id;
  }

  // Ensure row exists in profiles
  await adminSupabase.from('profiles').upsert({
    id: userId,
    email,
    username,
    role: 'Member',
    first_name: 'TEMP',
    last_name: 'TEMP',
  }, { onConflict: 'id' });

  return { userId, username };
}

/**
 * Sends a password reset & profile setup email directly to a member using a resilient custom token via Resend
 */
export async function sendPasswordResetEmailAction(targetInput: string): Promise<{ success: boolean; message: string }> {
  try {
    await verifySyncPermission();

    let email = (targetInput || '').trim().toLowerCase();
    if (!email) {
      throw new Error('Please enter a valid NetID or email address.');
    }
    if (!email.includes('@')) {
      email = `${email}@wisc.edu`;
    }

    const { userId, username } = await getOrCreateUserAndProfile(email);
    const adminSupabase = createAdminClient();

    // Generate 64-character unguessable token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(); // 14 days

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        setup_token: setupToken,
        setup_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to save setup token: ${updateError.message}`);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetatauxi.org';
    const setupUrl = `${siteUrl.replace(/\/+$/, '')}/setup-profile?token=${setupToken}`;

    const resendResult = await sendSetupEmail({
      to: email,
      setupUrl,
      username,
      isReset: true,
    });

    if (!resendResult.success) {
      throw new Error(`Token generated, but email delivery failed: ${resendResult.error}`);
    }

    return {
      success: true,
      message: `Password reset email dispatched to ${email}.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send password reset email';
    return {
      success: false,
      message: errorMsg,
    };
  }
}

/**
 * Generates a direct single-use setup / recovery link using a resilient custom token
 * (Completely bypasses institutional email filters and Safe Links pre-fetching)
 */
export async function generateMemberDirectLinkAction(
  targetInput: string,
  _linkType: 'recovery' | 'invite' = 'recovery'
): Promise<{ success: boolean; link?: string; message: string }> {
  void _linkType;
  try {
    await verifySyncPermission();

    let email = (targetInput || '').trim().toLowerCase();
    if (!email) {
      throw new Error('Please enter a valid NetID or email address.');
    }
    if (!email.includes('@')) {
      email = `${email}@wisc.edu`;
    }

    const { userId } = await getOrCreateUserAndProfile(email);
    const adminSupabase = createAdminClient();

    // Generate 64-character unguessable token
    const setupToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        setup_token: setupToken,
        setup_token_expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (updateError) {
      throw new Error(`Failed to save setup token: ${updateError.message}`);
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetatauxi.org';
    const directLink = `${siteUrl.replace(/\/+$/, '')}/setup-profile?token=${setupToken}`;

    return {
      success: true,
      link: directLink,
      message: `Direct link generated for ${email}.`,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to generate direct link';
    return {
      success: false,
      message: errorMsg,
    };
  }
}

export interface SetupTokenVerification {
  valid: boolean;
  message?: string;
  userId?: string;
  email?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  major?: string;
  pledgeClass?: string;
  graduationYear?: string;
  isReset?: boolean;
}

/**
 * Verifies a setup token without consuming it (immune to email security scanner GETs)
 */
export async function verifySetupTokenAction(token: string): Promise<SetupTokenVerification> {
  if (!token || typeof token !== 'string' || token.trim().length < 16) {
    return { valid: false, message: 'Invalid or missing setup token.' };
  }

  try {
    const adminSupabase = createAdminClient();
    const { data: profile, error } = await adminSupabase
      .from('profiles')
      .select('id, email, username, first_name, last_name, major, pledge_class, graduation_year, setup_token_expires_at')
      .eq('setup_token', token.trim())
      .maybeSingle();

    if (error || !profile) {
      return {
        valid: false,
        message: 'This setup link is invalid or has already been used to set up an account.',
      };
    }

    if (profile.setup_token_expires_at) {
      const expiresAt = new Date(profile.setup_token_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return {
          valid: false,
          message: 'This setup link has expired. Please contact an E-board member to generate a new link.',
        };
      }
    }

    const isReset = Boolean(profile.first_name && profile.first_name !== 'TEMP');
    const defaultUsername = profile.username || (profile.email ? profile.email.split('@')[0] : '');

    return {
      valid: true,
      userId: profile.id,
      email: profile.email || '',
      username: defaultUsername,
      firstName: profile.first_name === 'TEMP' ? '' : (profile.first_name || ''),
      lastName: profile.last_name === 'TEMP' ? '' : (profile.last_name || ''),
      major: profile.major === 'TEMP' ? '' : (profile.major || ''),
      pledgeClass: profile.pledge_class === 'TEMP' ? '' : (profile.pledge_class || ''),
      graduationYear: profile.graduation_year ? String(profile.graduation_year) : '',
      isReset,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error verifying token';
    return { valid: false, message: errorMsg };
  }
}

export interface CompleteSetupPayload {
  token: string;
  password: string;
  firstName: string;
  lastName: string;
  major?: string;
  pledgeClass?: string;
  graduationYear?: string;
}

/**
 * Consumes the setup token, sets the password, updates the profile, and wipes the token
 */
export async function completeProfileSetupAction(
  payload: CompleteSetupPayload
): Promise<{ success: boolean; message?: string; email?: string }> {
  const { token, password, firstName, lastName, major, pledgeClass, graduationYear } = payload;

  if (!token || token.trim().length < 16) {
    return { success: false, message: 'Invalid setup token.' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters.' };
  }

  if (!firstName.trim() || !lastName.trim()) {
    return { success: false, message: 'First and last name are required.' };
  }

  try {
    const adminSupabase = createAdminClient();

    // 1. Locate the profile with this active token
    const { data: profile, error: fetchErr } = await adminSupabase
      .from('profiles')
      .select('id, email, username, setup_token_expires_at')
      .eq('setup_token', token.trim())
      .maybeSingle();

    if (fetchErr || !profile) {
      return {
        success: false,
        message: 'This setup link is invalid or has already been used.',
      };
    }

    if (profile.setup_token_expires_at) {
      const expiresAt = new Date(profile.setup_token_expires_at).getTime();
      if (Date.now() > expiresAt) {
        return {
          success: false,
          message: 'This setup link has expired. Please request a new setup link.',
        };
      }
    }

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    // 2. Set the user's password and confirm email in Supabase Auth
    const { error: authErr } = await adminSupabase.auth.admin.updateUserById(profile.id, {
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      },
    });

    if (authErr) {
      return { success: false, message: `Failed to set password: ${authErr.message}` };
    }

    // 3. Update the profiles table and permanently wipe setup_token
    const gradYearNum = graduationYear && !isNaN(Number(graduationYear)) ? Number(graduationYear) : null;
    const { error: profileErr } = await adminSupabase
      .from('profiles')
      .update({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        major: major?.trim() || null,
        pledge_class: pledgeClass?.trim() || null,
        graduation_year: gradYearNum,
        setup_token: null, // <--- WIPED! Guarantees single-use
        setup_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (profileErr) {
      return { success: false, message: `Password set, but failed to update profile: ${profileErr.message}` };
    }

    return {
      success: true,
      email: profile.email,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error during profile setup';
    return { success: false, message: errorMsg };
  }
}
