'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { syncSheetToSupabase, syncAllSheetsToSupabase } from '@/lib/sheets/sync-engine';
import { getSheetConfigById } from '@/config/sheets';

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
    throw new Error('Unauthorized. Please log in.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile) {
    throw new Error('Profile not found.');
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
  ];

  if (!defaultAllowedRoles.includes(userRole)) {
    throw new Error('Forbidden: Only E-board and Admin members can trigger syncs.');
  }

  return { user, profile, supabase };
}

/**
 * Syncs a specific configured Google Sheet by its ID
 */
export async function syncSheetAction(sheetId: string) {
  const { supabase } = await verifySyncPermission(sheetId);
  const result = await syncSheetToSupabase(sheetId, supabase);

  if (!result.success && result.errors.length > 0) {
    throw new Error(`Sync failed: ${result.errors.join('; ')}`);
  }

  return result;
}

/**
 * Syncs all configured Google Sheets in the registry
 */
export async function syncAllSheetsAction() {
  const { supabase } = await verifySyncPermission();
  const results = await syncAllSheetsToSupabase(supabase);

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    const errorDetails = failures.map(f => `${f.sheetName}: ${f.errors.join(', ')}`).join(' | ');
    throw new Error(`Some sheets failed to sync: ${errorDetails}`);
  }

  return results;
}

/**
 * Backwards compatible member status sync action
 */
export async function syncMemberStatusAction() {
  const { supabase } = await verifySyncPermission('roster_status');
  const result = await syncSheetToSupabase('roster_status', supabase);

  if (!result.success) {
    throw new Error(result.errors.join(', ') || 'Failed to sync member status from Google Sheet.');
  }

  if (result.updatedCount === 0 && result.insertedCount === 0) {
    throw new Error(
      'No matching profiles found in Supabase. Make sure the usernames in your Google Sheet match the usernames in the profiles table.'
    );
  }

  return { success: true, count: result.updatedCount + result.insertedCount };
}
