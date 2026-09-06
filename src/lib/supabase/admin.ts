import { createClient, SupabaseClient } from '@supabase/supabase-js';

let adminClient: SupabaseClient | null = null;

/**
 * Creates or returns a singleton Supabase Admin client with service_role privileges.
 * This client bypasses Row Level Security and can invoke administrative auth endpoints
 * such as inviteUserByEmail and listUsers.
 * 
 * SERVER-ONLY: Never import or use this client in browser components.
 */
export function createAdminClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rwdejhnhvzfhfwatvhgl.supabase.co';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for administrative actions. ' +
      'Please add your secret service_role key to .env.local (Supabase Dashboard -> Project Settings -> API -> service_role).'
    );
  }

  if (!adminClient) {
    adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return adminClient;
}
