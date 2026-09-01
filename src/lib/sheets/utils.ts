import { ColumnMapping, ColumnType } from '@/config/sheets';

/**
 * Extracts a clean Google Spreadsheet ID from:
 * 1. Full Google Sheets URL: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit#gid=0
 * 2. Environment variable reference: 'env:GOOGLE_SPREADSHEET_ID' or 'env:GOOGLE_MEMBER_STATUS_SPREADSHEET_ID'
 * 3. Raw Spreadsheet ID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms'
 */
export function extractSpreadsheetId(idOrUrl: string): string {
  if (!idOrUrl) {
    return process.env.GOOGLE_SPREADSHEET_ID || '';
  }

  const trimmed = idOrUrl.trim();

  // Handle environment variable references
  if (trimmed.startsWith('env:')) {
    const envVarName = trimmed.replace('env:', '').trim();
    const envValue = process.env[envVarName];
    if (!envValue) {
      // Fallback to GOOGLE_SPREADSHEET_ID if specific sheet env var is not set
      if (process.env.GOOGLE_SPREADSHEET_ID) {
        return extractSpreadsheetId(process.env.GOOGLE_SPREADSHEET_ID);
      }
      console.warn(`Environment variable "${envVarName}" is not defined.`);
      return '';
    }
    return extractSpreadsheetId(envValue);
  }

  // Handle full Google Sheets URLs: /spreadsheets/d/([a-zA-Z0-9-_]+)
  const urlMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }

  // Handle plain ID (strip any trailing query params or slashes if present)
  return trimmed.split('/')[0].split('?')[0];
}

/**
 * Robust boolean parser for common Google Sheet checkboxes and inputs.
 * Returns true for: 'true', 'yes', 'y', '1', 'x', 'checked', 1, true.
 */
export function parseBooleanValue(val: unknown, fallback = false): boolean {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  if (typeof val === 'boolean') {
    return val;
  }
  if (typeof val === 'number') {
    return val !== 0;
  }
  const str = String(val).trim().toLowerCase();
  if (['true', 'yes', 'y', '1', 'x', 'checked', 'met', 'done', 'paid'].includes(str)) {
    return true;
  }
  if (['false', 'no', 'n', '0', 'unpaid', 'not met', ''].includes(str)) {
    return false;
  }
  return fallback;
}

/**
 * Robust number parser for Google Sheets numbers (removes currency symbols, commas, percent signs).
 */
export function parseNumberValue(val: unknown, fallback = 0): number {
  if (val === null || val === undefined || val === '') {
    return fallback;
  }
  if (typeof val === 'number') {
    return isNaN(val) ? fallback : val;
  }
  // Strip currency symbols, commas, spaces, %
  const cleaned = String(val).replace(/[\$,\s%]/g, '');
  const parsed = Number(cleaned);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Date parser for Google Sheet date cells.
 */
export function parseDateValue(val: unknown): string | null {
  if (!val) return null;
  const d = new Date(String(val));
  return isNaN(d.getTime()) ? String(val).trim() : d.toISOString();
}

/**
 * JSON / List parser for Google Sheets.
 */
export function parseJsonValue(val: unknown): unknown {
  if (!val) return null;
  if (typeof val === 'object') return val;
  const str = String(val).trim();
  if (str.startsWith('{') || str.startsWith('[')) {
    try {
      return JSON.parse(str);
    } catch {
      // Fallback to array if comma separated
    }
  }
  // Split comma-separated items
  if (str.includes(',')) {
    return str.split(',').map(s => s.trim());
  }
  return str;
}

/**
 * Coerce a raw value based on ColumnType
 */
export function castValueByType(rawVal: unknown, type?: ColumnType, defaultValue?: unknown): unknown {
  if (rawVal === undefined || rawVal === null || rawVal === '') {
    if (defaultValue !== undefined) return defaultValue;
    if (type === 'boolean') return false;
    if (type === 'number') return 0;
    return null;
  }

  switch (type) {
    case 'boolean':
      return parseBooleanValue(rawVal, typeof defaultValue === 'boolean' ? defaultValue : false);
    case 'number':
      return parseNumberValue(rawVal, typeof defaultValue === 'number' ? defaultValue : 0);
    case 'date':
      return parseDateValue(rawVal);
    case 'json':
      return parseJsonValue(rawVal);
    case 'string':
    default:
      return String(rawVal).trim();
  }
}

/**
 * Map Google Sheet header names to their column indexes (0-based)
 */
export function buildHeaderIndexMap(headers: string[]): Map<string, number> {
  const map = new Map<string, number>();
  headers.forEach((header, index) => {
    if (header) {
      // Store exact lowercase trimmed header
      const normalized = header.trim().toLowerCase();
      map.set(normalized, index);
      // Also store clean alphanumeric version (e.g. 'dues_paid' matches 'Dues Paid')
      const stripped = normalized.replace(/[^a-z0-9]/g, '');
      if (stripped && !map.has(stripped)) {
        map.set(stripped, index);
      }
    }
  });
  return map;
}

/**
 * Finds the column index for a given sheetColumn definition (supports single string, array of aliases, or index)
 */
export function findColumnIndex(
  sheetCol: string | string[] | number,
  headerMap: Map<string, number>
): number | undefined {
  if (typeof sheetCol === 'number') {
    return sheetCol;
  }

  const aliases = Array.isArray(sheetCol) ? sheetCol : [sheetCol];

  for (const alias of aliases) {
    const normalized = alias.trim().toLowerCase();
    const stripped = normalized.replace(/[^a-z0-9]/g, '');
    const idx = headerMap.get(normalized) ?? headerMap.get(stripped);
    if (idx !== undefined) {
      return idx;
    }
  }

  return undefined;
}

/**
 * Transforms a single row of Google Sheet values into a structured Supabase object
 * using the configured column mappings and header index map.
 */
export function transformRowToSupabaseRecord(
  row: unknown[],
  headerMap: Map<string, number>,
  columns: ColumnMapping[]
): Record<string, unknown> {
  const record: Record<string, unknown> = {};

  for (const col of columns) {
    const colIndex = findColumnIndex(col.sheetColumn, headerMap);
    const rawVal = colIndex !== undefined && colIndex < row.length ? row[colIndex] : undefined;

    let finalVal: unknown;
    if (col.transform) {
      finalVal = col.transform(rawVal, row);
    } else {
      finalVal = castValueByType(rawVal, col.type, col.defaultValue);
    }

    record[col.supabaseColumn] = finalVal;
  }

  return record;
}
