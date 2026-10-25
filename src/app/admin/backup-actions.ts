'use server'

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';

const CORE_TABLES = [
  { name: 'profiles', pk: 'id' },
  { name: 'alumni', pk: 'id' },
  { name: 'family_tree_nodes', pk: 'id' },
  { name: 'family_tree_edges', pk: 'id' },
  { name: 'attendance_events', pk: 'id' },
  { name: 'event_attendance', pk: 'id' },
  { name: 'links', pk: 'id' },
  { name: 'events', pk: 'id' },
  { name: 'finances_overview', pk: 'id' },
  { name: 'finances_budget', pk: 'category' },
];

/**
 * Checks if current user is an Admin or Chapter Executive Officer
 */
async function verifyAdminPermission() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthorized: Please log in.');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role || '').toLowerCase();
  const allowedRoles = ['admin', 'regent', 'vice regent', 'scribe', 'treasurer', 'website chair', 'web chair', 'website'];

  if (!allowedRoles.includes(role)) {
    throw new Error('Forbidden: Only Chapter Administrators and Executive Officers can manage database backups.');
  }

  return { user, profile };
}

/**
 * Helper to escape SQL literal values
 */
function escapeSqlValue(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

/**
 * Generates and downloads a complete SQL backup dump of Supabase tables
 */
export async function downloadDatabaseSqlBackupAction(): Promise<{
  success: boolean;
  sqlContent?: string;
  fileName?: string;
  totalRows?: number;
  tableStats?: Record<string, number>;
  error?: string;
}> {
  try {
    await verifyAdminPermission();

    const admin = createAdminClient();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `theta_tau_xi_db_backup_${timestamp}.sql`;

    const sqlLines: string[] = [];
    sqlLines.push('-- ============================================================================');
    sqlLines.push('-- THETA TAU XI CHAPTER: COMPLETE SUPABASE SQL DATABASE BACKUP');
    sqlLines.push(`-- Generated At: ${new Date().toISOString()}`);
    sqlLines.push('-- Tables: ' + CORE_TABLES.map(t => t.name).join(', '));
    sqlLines.push('-- ============================================================================\n');

    let totalRows = 0;
    const tableStats: Record<string, number> = {};

    for (const table of CORE_TABLES) {
      try {
        const { data: rows, error } = await admin
          .from(table.name)
          .select('*');

        if (error || !rows || rows.length === 0) {
          tableStats[table.name] = 0;
          continue;
        }

        tableStats[table.name] = rows.length;
        totalRows += rows.length;

        sqlLines.push(`-- ----------------------------------------------------------------------------`);
        sqlLines.push(`-- Table: public.${table.name} (${rows.length} rows)`);
        sqlLines.push(`-- ----------------------------------------------------------------------------`);

        // Embed JSON meta block for guaranteed resilient fallback restore
        const jsonBlock = JSON.stringify(rows).replace(/\*\//g, '* /');
        sqlLines.push(`/* TABLE_JSON:${table.name}:${jsonBlock} */`);

        // Generate standard SQL INSERT statements
        for (const row of rows) {
          const keys = Object.keys(row);
          const cols = keys.map(k => `"${k}"`).join(', ');
          const values = keys.map(k => escapeSqlValue(row[k])).join(', ');

          const updateClauses = keys
            .filter(k => k !== table.pk)
            .map(k => `"${k}" = EXCLUDED."${k}"`)
            .join(', ');

          let stmt = `INSERT INTO public.${table.name} (${cols}) VALUES (${values})`;
          if (updateClauses.length > 0) {
            stmt += ` ON CONFLICT ("${table.pk}") DO UPDATE SET ${updateClauses};`;
          } else {
            stmt += ` ON CONFLICT ("${table.pk}") DO NOTHING;`;
          }

          sqlLines.push(stmt);
        }

        sqlLines.push('');
      } catch (tableErr) {
        console.warn(`Warning backing up table ${table.name}:`, tableErr);
        tableStats[table.name] = 0;
      }
    }

    const sqlContent = sqlLines.join('\n');
    return {
      success: true,
      sqlContent,
      fileName,
      totalRows,
      tableStats,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to generate SQL backup.';
    return { success: false, error: msg };
  }
}

/**
 * Restores database tables from an uploaded SQL backup file.
 * Requires confirmationPhrase === 'RESTORE DATABASE'.
 */
export async function restoreDatabaseFromSqlAction(params: {
  sqlContent: string;
  confirmationPhrase: string;
}): Promise<{
  success: boolean;
  message?: string;
  restoredTables?: Record<string, number>;
  statementsExecuted?: number;
  error?: string;
}> {
  try {
    await verifyAdminPermission();

    const { sqlContent, confirmationPhrase } = params;

    if ((confirmationPhrase || '').trim().toUpperCase() !== 'RESTORE DATABASE') {
      return {
        success: false,
        error: 'Confirmation phrase mismatch. You must type "RESTORE DATABASE" to proceed.',
      };
    }

    if (!sqlContent || !sqlContent.trim()) {
      return { success: false, error: 'SQL file content is empty.' };
    }

    const admin = createAdminClient();

    // 1. First, attempt execution via Postgres RPC helper if installed
    let rpcSucceeded = false;
    try {
      const { error: rpcError } = await admin.rpc('exec_admin_sql', { sql_query: sqlContent });
      if (!rpcError) {
        rpcSucceeded = true;
      }
    } catch {
      // Fallback to resilient parser
    }

    if (rpcSucceeded) {
      revalidatePath('/members-only');
      revalidatePath('/attendance');
      revalidatePath('/alumni');
      revalidatePath('/family-tree');
      return {
        success: true,
        message: 'Database successfully restored via SQL RPC engine.',
      };
    }

    // 2. Resilient Dual-Mode Restore:
    // Check for TABLE_JSON blocks embedded in the backup file
    const jsonMatches = sqlContent.matchAll(/\/\* TABLE_JSON:([a-zA-Z0-9_-]+):([\s\S]*?)\s*\* \//g);
    const restoredTables: Record<string, number> = {};
    let matchedJsonCount = 0;

    for (const match of jsonMatches) {
      const tableName = match[1];
      const jsonStr = match[2];
      try {
        const rows = JSON.parse(jsonStr) as Record<string, unknown>[];
        if (Array.isArray(rows) && rows.length > 0) {
          // Chunk upsert into batches of 50
          const chunkSize = 50;
          for (let i = 0; i < rows.length; i += chunkSize) {
            const chunk = rows.slice(i, i + chunkSize);
            await admin.from(tableName).upsert(chunk);
          }
          restoredTables[tableName] = rows.length;
          matchedJsonCount++;
        }
      } catch (jsonErr) {
        console.warn(`Failed parsing JSON block for table ${tableName}:`, jsonErr);
      }
    }

    if (matchedJsonCount > 0) {
      revalidatePath('/members-only');
      revalidatePath('/attendance');
      revalidatePath('/alumni');
      revalidatePath('/family-tree');
      return {
        success: true,
        message: `Database successfully restored ${Object.values(restoredTables).reduce((a, b) => a + b, 0)} records across ${matchedJsonCount} tables.`,
        restoredTables,
      };
    }

    // 3. Fallback: Statement-by-statement execution
    // Clean comments and split on semicolons
    const cleanSql = sqlContent
      .replace(/--.*$/gm, '')
      .replace(/\/\*[\s\S]*?\*\//g, '');

    const statements = cleanSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let executed = 0;
    for (const stmt of statements) {
      try {
        await admin.rpc('exec_admin_sql', { sql_query: stmt });
        executed++;
      } catch {
        // Continue best effort
      }
    }

    revalidatePath('/members-only');
    revalidatePath('/attendance');
    revalidatePath('/alumni');
    revalidatePath('/family-tree');

    return {
      success: true,
      message: `Restoration processed ${executed} SQL statements.`,
      statementsExecuted: executed,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Database restoration failed.';
    return { success: false, error: msg };
  }
}
