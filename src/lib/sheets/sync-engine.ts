import { google } from 'googleapis';
import { SHEET_CONFIGS, SheetConfig, SyncResult, getSheetConfigById } from '@/config/sheets';
import { extractSpreadsheetId, buildHeaderIndexMap, transformRowToSupabaseRecord, findColumnIndex } from './utils';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Initializes authenticated Google Sheets API client
 */
export function getGoogleSheetsClient() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!clientEmail || !rawPrivateKey) {
    throw new Error(
      'Google Sheets API credentials missing. Please define GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in your environment variables.'
    );
  }

  // Handle escaped newlines in environment variables
  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * Reads raw 2D array of values from a Google Sheet tab
 */
export async function readRawSheetValues(params: {
  spreadsheetIdOrUrl: string;
  sheetName?: string;
  range?: string;
}): Promise<{ sheetName: string; values: unknown[][] }> {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = extractSpreadsheetId(params.spreadsheetIdOrUrl);

  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID is missing or invalid.');
  }

  let sheetName = params.sheetName;

  // If no sheet name specified, inspect spreadsheet to find the first tab's name
  if (!sheetName) {
    const spreadsheetInfo = await sheets.spreadsheets.get({ spreadsheetId });
    sheetName = spreadsheetInfo.data.sheets?.[0]?.properties?.title || 'Sheet1';
  }

  const range = params.range
    ? `'${sheetName}'!${params.range}`
    : `'${sheetName}'!A:Z`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });

  return {
    sheetName,
    values: (response.data.values || []) as unknown[][],
  };
}

/**
 * Writes or updates values in a Google Sheet tab
 */
export async function writeSheetValues(params: {
  spreadsheetIdOrUrl: string;
  sheetName: string;
  range: string;
  values: unknown[][];
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = extractSpreadsheetId(params.spreadsheetIdOrUrl);

  const fullRange = `'${params.sheetName}'!${params.range}`;

  const response = await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: fullRange,
    valueInputOption: params.valueInputOption || 'USER_ENTERED',
    requestBody: {
      values: params.values as any[][], // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  return response.data;
}

/**
 * Appends new rows to a Google Sheet tab
 */
export async function appendSheetRows(params: {
  spreadsheetIdOrUrl: string;
  sheetName: string;
  range?: string;
  rows: unknown[][];
  valueInputOption?: 'RAW' | 'USER_ENTERED';
}) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = extractSpreadsheetId(params.spreadsheetIdOrUrl);

  const fullRange = `'${params.sheetName}'!${params.range || 'A:A'}`;

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: fullRange,
    valueInputOption: params.valueInputOption || 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: params.rows as any[][], // eslint-disable-line @typescript-eslint/no-explicit-any
    },
  });

  return response.data;
}

/**
 * Clears cell values in a Google Sheet tab range without deleting rows or columns
 */
export async function clearSheetValues(params: {
  spreadsheetIdOrUrl: string;
  sheetName: string;
  range: string;
}) {
  const sheets = getGoogleSheetsClient();
  const spreadsheetId = extractSpreadsheetId(params.spreadsheetIdOrUrl);

  if (!spreadsheetId) {
    throw new Error('Spreadsheet ID is missing or invalid.');
  }

  const fullRange = `'${params.sheetName}'!${params.range}`;

  const response = await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: fullRange,
  });

  return response.data;
}

/**
 * Synchronizes a configured Google Sheet to its target Supabase database table
 */
export async function syncSheetToSupabase(
  sheetConfigOrId: string | SheetConfig,
  customSupabaseClient?: SupabaseClient
): Promise<SyncResult> {
  const startTime = Date.now();

  const config: SheetConfig | undefined =
    typeof sheetConfigOrId === 'string'
      ? getSheetConfigById(sheetConfigOrId)
      : sheetConfigOrId;

  if (!config) {
    throw new Error(
      `Sheet configuration with ID "${sheetConfigOrId}" not found in registry.`
    );
  }

  const result: SyncResult = {
    sheetId: config.id,
    sheetName: config.name,
    supabaseTable: config.supabaseTable,
    success: false,
    totalRowsRead: 0,
    updatedCount: 0,
    insertedCount: 0,
    failedCount: 0,
    addedToSheetCount: 0,
    errors: [],
    durationMs: 0,
    syncedAt: new Date().toISOString(),
  };

  try {
    const supabase = customSupabaseClient || createClient();

    // 1. Fetch values from Google Sheet
    const { values } = await readRawSheetValues({
      spreadsheetIdOrUrl: config.spreadsheetIdOrUrl,
      sheetName: config.sheetName,
      range: config.range,
    });

    if (!values || values.length === 0) {
      result.errors.push('Sheet is empty or no rows returned.');
      result.durationMs = Date.now() - startTime;
      return result;
    }

    const headerRow: string[] = (values[0] || []).map(h => String(h || ''));
    const dataRows = values.slice(1);
    result.totalRowsRead = dataRows.length;

    const headerMap = buildHeaderIndexMap(headerRow);

    // 2. Check for missing members in Google Sheet and auto-append if configured
    if (config.autoAppendMissingMembers) {
      const pkColIdx = findColumnIndex(config.primaryKey, headerMap);
      const sheetUsernames = new Set<string>();

      if (pkColIdx !== undefined) {
        for (const r of dataRows) {
          const rawVal = r[pkColIdx];
          if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
            let clean = String(rawVal).trim().toLowerCase();
            if (clean.includes('@')) clean = clean.split('@')[0];
            sheetUsernames.add(clean);
          }
        }
      }

      // Fetch all registered usernames in Supabase profiles
      const { data: dbMembers, error: dbErr } = await supabase
        .from(config.supabaseTable)
        .select(config.primaryKey)
        .not(config.primaryKey, 'is', null);

      if (!dbErr && dbMembers) {
        const missingUsernames: string[] = [];
        for (const m of (dbMembers as unknown as Record<string, unknown>[])) {
          let u = String(m[config.primaryKey] || '').trim().toLowerCase();
          if (u.includes('@')) u = u.split('@')[0];
          if (u && !sheetUsernames.has(u)) {
            missingUsernames.push(u);
            sheetUsernames.add(u);
          }
        }

        if (missingUsernames.length > 0) {
          // Format rows for Google Sheets:
          // username FALSE FALSE FALSE FALSE FALSE 0
          const newSheetRows: unknown[][] = missingUsernames.map(username => {
            return headerRow.map(h => {
              const norm = h.toLowerCase().trim();
              if (norm === 'username' || norm === 'user' || norm === 'email') {
                return username;
              }
              if (
                norm.includes('dues') ||
                norm.includes('brotherhood') ||
                norm.includes('prof') ||
                norm.includes('comm') ||
                norm.includes('concession')
              ) {
                return false;
              }
              if (norm.includes('point') || norm.includes('attendance')) {
                return 0;
              }
              return '';
            });
          });

          await appendSheetRows({
            spreadsheetIdOrUrl: config.spreadsheetIdOrUrl,
            sheetName: config.sheetName,
            rows: newSheetRows,
            valueInputOption: 'USER_ENTERED',
          });

          dataRows.push(...newSheetRows);
          result.totalRowsRead = dataRows.length;
          result.addedToSheetCount = missingUsernames.length;
        }
      }
    }

    if (dataRows.length === 0) {
      result.success = true;
      result.durationMs = Date.now() - startTime;
      return result;
    }

    // 3. Build valid records from data rows
    const validRecords: Record<string, unknown>[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const record = transformRowToSupabaseRecord(row, headerMap, config.columns);

      const pkValue = record[config.primaryKey];
      if (pkValue !== undefined && pkValue !== null && String(pkValue).trim() !== '') {
        validRecords.push(record);
      }
    }

    if (validRecords.length === 0) {
      result.errors.push(
        `No valid rows found with non-empty primary key "${config.primaryKey}". Check sheet headers.`
      );
      result.durationMs = Date.now() - startTime;
      return result;
    }

    const syncMode = config.syncMode || 'update_only';

    // 4. Perform database operations according to syncMode
    if (syncMode === 'update_only') {
      for (const record of validRecords) {
        const pk = String(record[config.primaryKey] || '');
        const updatePayload = {
          ...record,
          updated_at: new Date().toISOString(),
        };

        const { error, data } = await supabase
          .from(config.supabaseTable)
          .update(updatePayload)
          .eq(config.primaryKey, pk)
          .select();

        if (error) {
          result.failedCount++;
          result.errors.push(`${pk}: ${error.message}`);
        } else if (data && data.length > 0) {
          result.updatedCount += data.length;
        }
      }
    } else if (syncMode === 'upsert') {
      const recordsWithTimestamps = validRecords.map(r => ({
        ...r,
        updated_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from(config.supabaseTable)
        .upsert(recordsWithTimestamps, {
          onConflict: config.primaryKey,
        })
        .select();

      if (error) {
        result.failedCount = validRecords.length;
        result.errors.push(`Upsert failed: ${error.message}`);
      } else {
        result.updatedCount = data ? data.length : validRecords.length;
      }
    } else if (syncMode === 'replace_all') {
      const { error: deleteError } = await supabase
        .from(config.supabaseTable)
        .delete()
        .neq(config.primaryKey, '__dummy_non_existent_key__');

      if (deleteError) {
        result.errors.push(`Replace all failed on delete: ${deleteError.message}`);
      } else {
        const { data, error: insertError } = await supabase
          .from(config.supabaseTable)
          .insert(validRecords)
          .select();

        if (insertError) {
          result.errors.push(`Replace all failed on insert: ${insertError.message}`);
        } else {
          result.insertedCount = data ? data.length : validRecords.length;
        }
      }
    }

    result.success = result.errors.length === 0;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown sync error';
    result.errors.push(errorMsg);
    result.success = false;
  }

  result.durationMs = Date.now() - startTime;
  return result;
}

/**
 * Synchronizes all configured sheets in the registry
 */
export async function syncAllSheetsToSupabase(customSupabaseClient?: SupabaseClient): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  for (const config of SHEET_CONFIGS) {
    const res = await syncSheetToSupabase(config, customSupabaseClient);
    results.push(res);
  }
  return results;
}

/**
 * Synchronizes Supabase table data back to a Google Sheet (Supabase -> Sheet Export)
 */
export async function syncSupabaseToSheet(
  sheetConfigOrId: string | SheetConfig,
  customSupabaseClient?: SupabaseClient
) {
  const config =
    typeof sheetConfigOrId === 'string'
      ? getSheetConfigById(sheetConfigOrId)
      : sheetConfigOrId;

  if (!config) {
    throw new Error(`Sheet configuration "${sheetConfigOrId}" not found.`);
  }

  const supabase = customSupabaseClient || createClient();

  // Fetch all rows from Supabase
  const { data: rows, error } = await supabase
    .from(config.supabaseTable)
    .select('*');

  if (error) {
    throw new Error(`Failed to read from Supabase table ${config.supabaseTable}: ${error.message}`);
  }

  if (!rows || rows.length === 0) {
    return { success: true, rowsWritten: 0 };
  }

  // Construct sheet header and row values
  const headers = config.columns.map(c =>
    typeof c.sheetColumn === 'string'
      ? c.sheetColumn
      : Array.isArray(c.sheetColumn)
      ? c.sheetColumn[0]
      : c.supabaseColumn
  );

  const values: unknown[][] = [headers];

  for (const row of rows) {
    const rowValues = config.columns.map(c => {
      const val = row[c.supabaseColumn];
      if (val === null || val === undefined) return '';
      if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
      if (typeof val === 'object') return JSON.stringify(val);
      return val;
    });
    values.push(rowValues);
  }

  await writeSheetValues({
    spreadsheetIdOrUrl: config.spreadsheetIdOrUrl,
    sheetName: config.sheetName,
    range: 'A1',
    values,
  });

  return { success: true, rowsWritten: rows.length };
}

export interface AccountIntakeResult {
  success: boolean;
  totalFound: number;
  invitesSent: number;
  alreadyUsed: number;
  message: string;
  wiped: boolean;
  invitedEmails: string[];
  alreadyUsedEmails: string[];
  errors: string[];
}

/**
 * Reads prospective member emails from the 'NewAccountIntake' tab of the MemberStatus sheet,
 * verifies whether each email is already registered or invited in Supabase,
 * dispatches official Supabase invitation emails to new accounts,
 * clears the processed email rows from the Google Sheet,
 * and returns summary statistics.
 */
export async function processNewAccountIntake(spreadsheetIdOrUrl?: string): Promise<AccountIntakeResult> {
  const spreadsheetId = extractSpreadsheetId(
    spreadsheetIdOrUrl ||
    process.env.GOOGLE_MEMBER_STATUS_SPREADSHEET_ID ||
    process.env.GOOGLE_SPREADSHEET_ID ||
    ''
  );

  if (!spreadsheetId) {
    throw new Error(
      'Member Status Spreadsheet ID is missing. Please define GOOGLE_MEMBER_STATUS_SPREADSHEET_ID in your environment variables.'
    );
  }

  const sheetName = 'NewAccountIntake';
  let sheetValues: unknown[][] = [];

  try {
    const res = await readRawSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      sheetName,
      range: 'A:Z',
    });
    sheetValues = res.values || [];
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('Unable to parse range') || errMsg.includes('not found')) {
      throw new Error(
        `Worksheet tab "${sheetName}" was not found in the MemberStatus spreadsheet. ` +
        `Please create a tab named "${sheetName}" with a column header "wicEmail".`
      );
    }
    throw err;
  }

  if (sheetValues.length === 0) {
    return {
      success: true,
      totalFound: 0,
      invitesSent: 0,
      alreadyUsed: 0,
      message: "0 invites sent. 0 email's already in use",
      wiped: false,
      invitedEmails: [],
      alreadyUsedEmails: [],
      errors: [],
    };
  }

  // 1. Locate the email column header (e.g. wicEmail, wiscEmail, email)
  const headers = (sheetValues[0] || []).map(h => String(h || '').trim().toLowerCase());
  let emailColIdx = headers.findIndex(h =>
    h === 'wicemail' ||
    h === 'wiscemail' ||
    h === 'wisc_email' ||
    h === 'wic_email' ||
    h === 'email' ||
    h.includes('wic') ||
    h.includes('wisc') ||
    h.includes('email')
  );

  // If header doesn't match standard terms, fallback to column 0
  if (emailColIdx === -1) {
    emailColIdx = 0;
  }

  // If row 0 itself looks like an email (user skipped header), include row 0 as data
  let dataRows = sheetValues.slice(1);
  if (headers[emailColIdx]?.includes('@')) {
    dataRows = sheetValues;
  }

  // 2. Extract and sanitize candidate emails
  const candidateEmails: string[] = [];
  const seen = new Set<string>();

  for (const row of dataRows) {
    const rawVal = row[emailColIdx];
    if (rawVal === undefined || rawVal === null) continue;
    let email = String(rawVal).trim().toLowerCase();
    if (!email) continue;

    // Normalize: if only NetID was entered, append @wisc.edu
    if (!email.includes('@')) {
      email = `${email}@wisc.edu`;
    }

    // Basic email format check
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      if (!seen.has(email)) {
        seen.add(email);
        candidateEmails.push(email);
      }
    }
  }

  if (candidateEmails.length === 0) {
    return {
      success: true,
      totalFound: 0,
      invitesSent: 0,
      alreadyUsed: 0,
      message: "0 invites sent. 0 email's already in use",
      wiped: false,
      invitedEmails: [],
      alreadyUsedEmails: [],
      errors: [],
    };
  }

  // 3. Query existing users in Supabase Auth and Profiles
  const adminSupabase = createAdminClient();
  const existingEmails = new Set<string>();

  // Gather all Supabase Auth users (paginated)
  let page = 1;
  const perPage = 1000;
  let hasMore = true;

  while (hasMore) {
    const { data: usersData, error: listError } = await adminSupabase.auth.admin.listUsers({
      page,
      perPage,
    });

    if (listError) {
      throw new Error(`Failed to query existing Supabase auth accounts: ${listError.message}`);
    }

    const users = usersData?.users || [];
    for (const u of users) {
      if (u.email) {
        existingEmails.add(u.email.toLowerCase().trim());
      }
    }

    if (users.length < perPage) {
      hasMore = false;
    } else {
      page++;
    }
  }

  // Gather existing usernames and emails from profiles table
  const { data: profiles, error: profileError } = await adminSupabase
    .from('profiles')
    .select('username, email');

  if (!profileError && profiles) {
    for (const p of profiles) {
      if (p.email) {
        existingEmails.add(String(p.email).toLowerCase().trim());
      }
      if (p.username) {
        const u = String(p.username).toLowerCase().trim();
        existingEmails.add(u.includes('@') ? u : `${u}@wisc.edu`);
      }
    }
  }

  // 4. Determine invite redirect destination
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thetatauxi.com';
  const redirectTo = `${siteUrl.replace(/\/+$/, '')}/auth/callback`;

  // 5. Process candidate emails: invite new or mark as already used
  const invitedEmails: string[] = [];
  const alreadyUsedEmails: string[] = [];
  const errors: string[] = [];

  for (const email of candidateEmails) {
    if (existingEmails.has(email)) {
      alreadyUsedEmails.push(email);
      continue;
    }

    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      email,
      { redirectTo }
    );

    if (inviteError) {
      const errMsg = inviteError.message.toLowerCase();
      if (
        errMsg.includes('already registered') ||
        errMsg.includes('already exists') ||
        errMsg.includes('already in use')
      ) {
        alreadyUsedEmails.push(email);
        existingEmails.add(email);
      } else {
        errors.push(`${email}: ${inviteError.message}`);
      }
    } else {
      invitedEmails.push(email);
      existingEmails.add(email);
    }
  }

  // 6. Wipe the processed emails from the Google Sheet (data rows A2:Z)
  let wiped = false;
  try {
    await clearSheetValues({
      spreadsheetIdOrUrl: spreadsheetId,
      sheetName,
      range: 'A2:Z',
    });
    wiped = true;
  } catch (wipeErr: unknown) {
    const msg = wipeErr instanceof Error ? wipeErr.message : String(wipeErr);
    errors.push(`Failed to wipe sheet after invites: ${msg}`);
  }

  const message = `${invitedEmails.length} invites sent. ${alreadyUsedEmails.length} email's already in use`;

  return {
    success: errors.length === 0,
    totalFound: candidateEmails.length,
    invitesSent: invitedEmails.length,
    alreadyUsed: alreadyUsedEmails.length,
    message,
    wiped,
    invitedEmails,
    alreadyUsedEmails,
    errors,
  };
}
