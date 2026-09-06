import { NextRequest, NextResponse } from 'next/server';
import { syncSheetToSupabase, syncAllSheetsToSupabase, processNewAccountIntake } from '@/lib/sheets/sync-engine';
import { SHEET_CONFIGS, getSheetConfigById } from '@/config/sheets';
import { createClient } from '@/lib/supabase/server';

/**
 * API route to trigger Google Sheet <-> Supabase sync.
 * Can be called by:
 * 1. An authenticated E-board / Admin user session
 * 2. An automated Vercel Cron or GitHub Action using Bearer token (SYNC_API_KEY or CRON_SECRET)
 * 
 * Usage:
 * - GET /api/sync?sheet=roster_status
 * - POST /api/sync { "sheet": "calendar_events" }
 * - GET /api/sync?sheet=all
 */
export async function GET(req: NextRequest) {
  return handleSync(req);
}

export async function POST(req: NextRequest) {
  return handleSync(req);
}

async function handleSync(req: NextRequest) {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get('authorization');
    const urlKey = req.nextUrl.searchParams.get('key');
    const secretKey = process.env.SYNC_API_KEY || process.env.CRON_SECRET;

    let isAuthorized = false;

    // Check token if secretKey is configured
    if (secretKey) {
      if (authHeader === `Bearer ${secretKey}` || urlKey === secretKey) {
        isAuthorized = true;
      }
    }

    // Check session if not authorized via token
    if (!isAuthorized) {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const role = profile?.role?.toLowerCase() || '';
        const allowedRoles = [
          'regent',
          'vice regent',
          'corresponding secretary',
          'scribe',
          'treasurer',
          'marshall',
          'general chair',
          'admin',
          'rush chair',
          'website chair',
          'web chair',
          'website',
        ];
        if (allowedRoles.includes(role)) {
          isAuthorized = true;
        }
      }
    }

    // If still not authorized, return 401
    if (!isAuthorized && secretKey) {
      return NextResponse.json(
        { error: 'Unauthorized. Provide a valid Bearer token or log in as an E-board member.' },
        { status: 401 }
      );
    }

    // 2. Determine which sheet(s) to sync
    let targetSheet = req.nextUrl.searchParams.get('sheet');

    if (!targetSheet && req.method === 'POST') {
      try {
        const body = await req.json();
        targetSheet = body?.sheet;
      } catch {
        // No JSON body
      }
    }

    if (!targetSheet || targetSheet === 'all') {
      const results = await syncAllSheetsToSupabase();
      return NextResponse.json({
        success: results.every(r => r.success),
        results,
      });
    }

    if (targetSheet === 'new_account_intake' || targetSheet === 'account_intake') {
      const intakeResult = await processNewAccountIntake();
      return NextResponse.json(intakeResult);
    }

    const config = getSheetConfigById(targetSheet);
    if (!config) {
      return NextResponse.json(
        {
          error: `Unknown sheet ID "${targetSheet}". Configured sheets: ${SHEET_CONFIGS.map(c => c.id).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const result = await syncSheetToSupabase(config);
    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Internal server error during sync';
    console.error('Error executing sync API:', error);
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}
