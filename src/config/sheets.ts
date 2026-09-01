/**
 * Google Sheets & Supabase Sync Configuration Registry
 * 
 * To add a new Google Sheet integration:
 * 1. Add a new entry to the `SHEET_CONFIGS` array below.
 * 2. Provide the Google Sheet URL, raw Spreadsheet ID, or env variable name.
 * 3. Define the tab name, target Supabase table, match key, and column mappings.
 * 4. Share your Google Sheet with your service account email (found in your .env.local).
 */

export type ColumnType = 'string' | 'number' | 'boolean' | 'date' | 'json';
export type SyncMode = 'upsert' | 'update_only' | 'replace_all';

export interface ColumnMapping {
  /** 
   * Header name in the Google Sheet (case-insensitive) OR array of alias names OR 0-based column index.
   * Example: 'Username', ['event_name', 'title'], 0
   */
  sheetColumn: string | string[] | number;

  /** 
   * Matching column name in the Supabase database table.
   * Example: 'username', 'dues_paid', 'attendance_points'
   */
  supabaseColumn: string;

  /** 
   * Target data type for automatic parsing.
   * - 'string': trims whitespace, defaults to empty string or null
   * - 'number': strips $, commas, %, parses float/int, defaults to 0
   * - 'boolean': parses 'true', 'yes', 'y', '1', 'x', 'checked' as true
   * - 'date': parses string to ISO 8601 date string
   * - 'json': parses JSON string or comma-separated list to JSON array
   */
  type?: ColumnType;

  /** 
   * Optional custom transformation function.
   */
  transform?: (rawValue: unknown, allRowValues?: unknown[]) => unknown;

  /** 
   * Optional fallback value if the sheet cell is blank.
   */
  defaultValue?: unknown;
}

export interface SheetConfig {
  /** 
   * Unique identifier used in code, UI, and API sync endpoints.
   * Example: 'roster_status', 'calendar_events', 'quick_links', 'finances_overview'
   */
  id: string;

  /** 
   * Human-readable label displayed in the website sync panel.
   */
  name: string;

  /** 
   * Description of what this sync does.
   */
  description?: string;

  /** 
   * Full Google Sheets link (e.g. 'https://docs.google.com/spreadsheets/d/1ABC.../edit')
   * OR raw Spreadsheet ID (e.g. '1Uhxpi6HbciDZxVo7aAK-4mH7CILhAGKT_B85kp0_bq8')
   * OR an environment variable reference starting with 'env:' (e.g. 'env:GOOGLE_MEMBER_STATUS_SPREADSHEET_ID')
   */
  spreadsheetIdOrUrl: string;

  /** 
   * Tab name inside the Google Spreadsheet.
   * Example: 'MemberStatus', 'Calendar', 'Links', 'FinancesOverview', 'Budget', 'AlumniOverview'
   */
  sheetName: string;

  /** 
   * Cell range to query (default is 'A:Z').
   * Example: 'A1:G', 'A1:D', or 'A:Z'
   */
  range?: string;

  /** 
   * Target Supabase table name.
   * Example: 'profiles', 'events', 'links', 'finances_overview', 'budget', 'alumni'
   */
  supabaseTable: string;

  /** 
   * Column in Supabase used as the primary identifier to match records (e.g. 'username', 'title', 'id', 'email').
   */
  primaryKey: string;

  /** 
   * How to synchronize rows with Supabase:
   * - 'update_only' (default for profiles): Only update existing rows matching the primaryKey
   * - 'upsert': Insert row if primaryKey is not found, otherwise update
   * - 'replace_all': Delete existing table contents and re-insert (use with caution)
   */
  syncMode?: SyncMode;

  /** 
   * If true, any registered username in Supabase not found in the Google Sheet
   * will be automatically appended to the bottom of the Google Sheet with default values:
   * [username, FALSE, FALSE, FALSE, FALSE, FALSE, 0]
   */
  autoAppendMissingMembers?: boolean;

  /** 
   * Column definitions and mappings.
   */
  columns: ColumnMapping[];

  /** 
   * Which user roles are allowed to trigger this sync in the website portal.
   * Defaults to all E-Board and Admin roles.
   */
  allowedRoles?: string[];
}

export interface SyncResult {
  sheetId: string;
  sheetName: string;
  supabaseTable: string;
  success: boolean;
  totalRowsRead: number;
  updatedCount: number;
  insertedCount: number;
  failedCount: number;
  addedToSheetCount?: number;
  errors: string[];
  durationMs: number;
  syncedAt: string;
}

/**
 * ============================================================================
 * Chapter Google Sheets Registry
 * ============================================================================
 */
export const SHEET_CONFIGS: SheetConfig[] = [
  // 1. Member Status Spreadsheet
  {
    id: 'roster_status',
    name: 'Member Status & Roster',
    description: 'Syncs dues payment status, event attendance points, and pillar requirements from the Member Status sheet. Automatically appends new registered members.',
    spreadsheetIdOrUrl: 'env:GOOGLE_MEMBER_STATUS_SPREADSHEET_ID',
    sheetName: 'MemberStatus',
    range: 'A1:G',
    supabaseTable: 'profiles',
    primaryKey: 'username',
    syncMode: 'update_only',
    autoAppendMissingMembers: true,
    columns: [
      {
        sheetColumn: 'username',
        supabaseColumn: 'username',
        type: 'string',
        transform: (val: unknown) => {
          if (!val) return '';
          const cleaned = String(val).trim().toLowerCase();
          // Extract username if an email was entered (e.g., 'john@wisc.edu' -> 'john')
          return cleaned.includes('@') ? cleaned.split('@')[0] : cleaned;
        }
      },
      { sheetColumn: 'dues_paid', supabaseColumn: 'dues_paid', type: 'boolean', defaultValue: false },
      { sheetColumn: 'brotherhood_met', supabaseColumn: 'brotherhood_met', type: 'boolean', defaultValue: false },
      { sheetColumn: 'prof_dev_met', supabaseColumn: 'prof_dev_met', type: 'boolean', defaultValue: false },
      { sheetColumn: 'comm_service_met', supabaseColumn: 'comm_service_met', type: 'boolean', defaultValue: false },
      { sheetColumn: 'concessions_done', supabaseColumn: 'concessions_done', type: 'boolean', defaultValue: false },
      { sheetColumn: 'attendance_points', supabaseColumn: 'attendance_points', type: 'number', defaultValue: 0 }
    ],
    allowedRoles: ['regent', 'vice regent', 'corresponding secretary', 'scribe', 'treasurer', 'marshall', 'general chair', 'admin']
  },

  // 2. Calendar and Links Spreadsheet -> Calendar Tab
  {
    id: 'calendar_events',
    name: 'Chapter Calendar',
    description: 'Syncs chapter events, times, locations, and details from the Calendar and Links spreadsheet.',
    spreadsheetIdOrUrl: 'env:GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID',
    sheetName: 'Calendar',
    range: 'A1:D',
    supabaseTable: 'events',
    primaryKey: 'title',
    syncMode: 'upsert',
    columns: [
      { sheetColumn: ['event_name', 'title', 'event'], supabaseColumn: 'title', type: 'string' },
      { sheetColumn: ['time', 'date', 'datetime'], supabaseColumn: 'date', type: 'string' },
      { sheetColumn: ['location', 'place'], supabaseColumn: 'location', type: 'string' },
      { sheetColumn: ['details', 'description', 'notes'], supabaseColumn: 'details', type: 'string' }
    ]
  },

  // 2. Calendar and Links Spreadsheet -> Links Tab
  {
    id: 'quick_links',
    name: 'Important Links',
    description: 'Syncs portal quick links from the Calendar and Links spreadsheet.',
    spreadsheetIdOrUrl: 'env:GOOGLE_CALENDAR_LINKS_SPREADSHEET_ID',
    sheetName: 'Links',
    range: 'A1:B',
    supabaseTable: 'links',
    primaryKey: 'title',
    syncMode: 'upsert',
    columns: [
      { sheetColumn: ['label', 'title', 'name'], supabaseColumn: 'title', type: 'string' },
      { sheetColumn: ['url', 'link'], supabaseColumn: 'url', type: 'string' }
    ]
  },

  // 3. Finances Spreadsheet -> FinancesOverview Tab
  {
    id: 'finances_overview',
    name: 'Finances Overview',
    description: 'Syncs high-level chapter account balances and accounts overview from Finances spreadsheet.',
    spreadsheetIdOrUrl: 'env:GOOGLE_FINANCES_SPREADSHEET_ID',
    sheetName: 'FinancesOverview',
    range: 'A1:E',
    supabaseTable: 'finances_overview',
    primaryKey: 'id',
    syncMode: 'upsert',
    columns: [
      { sheetColumn: ['id', 'account_id'], supabaseColumn: 'id', type: 'string' },
      { sheetColumn: ['account_name', 'name', 'account'], supabaseColumn: 'account_name', type: 'string' },
      { sheetColumn: ['category', 'type'], supabaseColumn: 'category', type: 'string' },
      { sheetColumn: ['balance', 'amount'], supabaseColumn: 'balance', type: 'number', defaultValue: 0 },
      { sheetColumn: ['notes', 'details'], supabaseColumn: 'notes', type: 'string' }
    ],
    allowedRoles: ['regent', 'treasurer', 'admin']
  },

  // 3. Finances Spreadsheet -> Budget Tab
  {
    id: 'finances_budget',
    name: 'Chapter Budget',
    description: 'Syncs semester committee budget allocations and actual expenditures from Finances spreadsheet.',
    spreadsheetIdOrUrl: 'env:GOOGLE_FINANCES_SPREADSHEET_ID',
    sheetName: 'Budget',
    range: 'A1:E',
    supabaseTable: 'finances_budget',
    primaryKey: 'category',
    syncMode: 'upsert',
    columns: [
      { sheetColumn: ['category', 'committee', 'line_item'], supabaseColumn: 'category', type: 'string' },
      { sheetColumn: ['allocated_amount', 'budgeted', 'allocation'], supabaseColumn: 'allocated_amount', type: 'number', defaultValue: 0 },
      { sheetColumn: ['spent_amount', 'actual', 'spent'], supabaseColumn: 'spent_amount', type: 'number', defaultValue: 0 },
      { sheetColumn: ['remaining_amount', 'remaining'], supabaseColumn: 'remaining_amount', type: 'number', defaultValue: 0 },
      { sheetColumn: ['notes', 'description'], supabaseColumn: 'notes', type: 'string' }
    ],
    allowedRoles: ['regent', 'treasurer', 'admin']
  },

  // 4. Alumni Management Spreadsheet -> AlumniOverview Tab
  {
    id: 'alumni_overview',
    name: 'Alumni Directory & Management',
    description: 'Syncs alumni contact information, graduation classes, and industry data from Alumni Management spreadsheet.',
    spreadsheetIdOrUrl: 'env:GOOGLE_ALUMNI_SPREADSHEET_ID',
    sheetName: 'AlumniOverview',
    range: 'A1:G',
    supabaseTable: 'alumni',
    primaryKey: 'email',
    syncMode: 'upsert',
    columns: [
      { sheetColumn: ['email', 'email_address'], supabaseColumn: 'email', type: 'string' },
      { sheetColumn: ['full_name', 'name'], supabaseColumn: 'full_name', type: 'string' },
      { sheetColumn: ['grad_year', 'graduation_year', 'year'], supabaseColumn: 'grad_year', type: 'number' },
      { sheetColumn: ['major', 'degree'], supabaseColumn: 'major', type: 'string' },
      { sheetColumn: ['company', 'employer'], supabaseColumn: 'company', type: 'string' },
      { sheetColumn: ['location', 'city'], supabaseColumn: 'location', type: 'string' },
      { sheetColumn: ['linkedin_url', 'linkedin'], supabaseColumn: 'linkedin_url', type: 'string' }
    ],
    allowedRoles: ['regent', 'vice regent', 'corresponding secretary', 'admin']
  }
];

/**
 * Helper to get a sheet configuration by its ID
 */
export function getSheetConfigById(id: string): SheetConfig | undefined {
  return SHEET_CONFIGS.find(cfg => cfg.id.toLowerCase() === id.toLowerCase());
}
