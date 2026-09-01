import { google } from 'googleapis';
import { SHEET_CONFIGS, SheetConfig, SyncResult, getSheetConfigById } from '@/config/sheets';
import { extractSpreadsheetId, buildHeaderIndexMap, transformRowToSupabaseRecord, findColumnIndex } from './utils';
import { createClient } from '@/lib/supabase/server';
import { SupabaseClient } from '@supabase/supabase-js';

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
