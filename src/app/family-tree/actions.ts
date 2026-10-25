'use server'

import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export interface TreeNode {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  email?: string | null;
  is_alumni: boolean;
  user_id?: string | null;
  alum_id?: string | null;
  pledge_sem?: string | null;
  family_name?: string | null;
  avatar_url?: string | null;
}

export interface TreeEdge {
  id: number;
  little_id: string;
  big_id: string;
  relationship_type?: string;
}

export interface AlumniSession {
  alumniId: string;
  first_name: string;
  last_name: string;
  email?: string;
}

const ALUMNI_COOKIE_NAME = 'tt_alumni_session';

/**
 * Validates and sets an Alumni session cookie based on user input (alum_{id}, username, or email)
 */
export async function alumniLoginAction(identifierInput: string): Promise<{
  success: boolean;
  alumni?: AlumniSession;
  error?: string;
}> {
  try {
    const raw = (identifierInput || '').trim();
    if (!raw) {
      return { success: false, error: 'Please enter your Alumni User ID or username.' };
    }

    const admin = createAdminClient();
    const cleanId = raw.startsWith('alum_') ? raw : `alum_${raw}`;

    // Search by exact id, prefixed alum_id, or email
    const { data: alumniMatch, error: findError } = await admin
      .from('alumni')
      .select('id, first_name, last_name, email')
      .or(`id.eq."${raw}",id.eq."${cleanId}",email.ilike."${raw}"`)
      .limit(1)
      .maybeSingle();

    if (findError) {
      return { success: false, error: findError.message };
    }

    if (!alumniMatch) {
      return {
        success: false,
        error: 'No alumni record found with this ID or email. Please verify with chapter leadership.'
      };
    }

    const sessionData: AlumniSession = {
      alumniId: alumniMatch.id,
      first_name: alumniMatch.first_name,
      last_name: alumniMatch.last_name,
      email: alumniMatch.email || undefined,
    };

    cookies().set({
      name: ALUMNI_COOKIE_NAME,
      value: JSON.stringify(sessionData),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    revalidatePath('/family-tree');
    return { success: true, alumni: sessionData };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Alumni authentication failed.';
    return { success: false, error: msg };
  }
}

/**
 * Clears the alumni session cookie
 */
export async function alumniLogoutAction(): Promise<void> {
  cookies().delete(ALUMNI_COOKIE_NAME);
  revalidatePath('/family-tree');
}

/**
 * Returns current alumni session if present
 */
export async function getAlumniSessionAction(): Promise<AlumniSession | null> {
  const cookie = cookies().get(ALUMNI_COOKIE_NAME);
  if (!cookie?.value) return null;

  try {
    const parsed = JSON.parse(cookie.value);
    return parsed as AlumniSession;
  } catch {
    return null;
  }
}

/**
 * Fetches all nodes and edges for the Family Tree, and ensures the current active user has a node
 */
export async function getFamilyTreeDataAction(): Promise<{
  nodes: TreeNode[];
  edges: TreeEdge[];
  currentUserNode: TreeNode | null;
  isAlumniSession: boolean;
  alumniInfo: AlumniSession | null;
  error?: string;
}> {
  try {
    const admin = createAdminClient();
    const supabase = createClient();

    // 1. Check active user session
    const { data: { user } } = await supabase.auth.getUser();
    let currentUserNode: TreeNode | null = null;

    // 2. Check alumni session cookie
    const alumniSession = await getAlumniSessionAction();

    // 3. Query all nodes and edges
    const [nodesRes, edgesRes] = await Promise.all([
      admin.from('family_tree_nodes').select('*').order('last_name', { ascending: true }),
      admin.from('family_tree_edges').select('*'),
    ]);

    const nodes = (nodesRes.data || []) as TreeNode[];
    const edges = (edgesRes.data || []) as TreeEdge[];

    // 4. If active user is logged in, ensure they have a node in the tree
    if (user) {
      let existingNode = nodes.find(n => n.user_id === user.id || n.id === user.id);
      if (!existingNode) {
        // Fetch profile to initialize node
        const { data: profile } = await admin
          .from('profiles')
          .select('id, first_name, last_name, username, graduation_year, pledge_class')
          .eq('id', user.id)
          .single();

        if (profile) {
          const defaultUsername = profile.username || (user.email ? user.email.split('@')[0] : `user_${user.id.slice(0, 8)}`);
          const newNode: TreeNode = {
            id: profile.id,
            first_name: (profile.first_name && profile.first_name !== 'TEMP') ? profile.first_name : 'Brother',
            last_name: (profile.last_name && profile.last_name !== 'TEMP') ? profile.last_name : '',
            username: defaultUsername,
            email: user.email || null,
            is_alumni: false,
            user_id: profile.id,
            pledge_sem: profile.pledge_class || null,
          };

          const { data: inserted, error: insErr } = await admin
            .from('family_tree_nodes')
            .upsert(newNode, { onConflict: 'username' })
            .select()
            .single();

          if (!insErr && inserted) {
            existingNode = inserted as TreeNode;
            nodes.push(existingNode);
          }
        }
      }
      currentUserNode = existingNode || null;
    } else if (alumniSession) {
      // Find matching alumni node
      currentUserNode = nodes.find(n => n.alum_id === alumniSession.alumniId || n.id === alumniSession.alumniId) || null;
    }

    return {
      nodes,
      edges,
      currentUserNode,
      isAlumniSession: !!alumniSession,
      alumniInfo: alumniSession,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to load family tree data.';
    return {
      nodes: [],
      edges: [],
      currentUserNode: null,
      isAlumniSession: false,
      alumniInfo: null,
      error: msg,
    };
  }
}

/**
 * Searches active profiles and existing alumni to link as a Big
 */
export async function searchActiveAndAlumniAction(query: string): Promise<{
  activeMembers: Array<{ id: string; name: string; username: string; email?: string; pledge_class?: string }>;
  alumniMembers: Array<{ id: string; name: string; username: string; email?: string; pledge_sem?: string; grad_year?: number }>;
}> {
  const cleanQ = (query || '').trim();
  if (cleanQ.length < 1) {
    return { activeMembers: [], alumniMembers: [] };
  }

  const admin = createAdminClient();

  // Search active profiles
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, first_name, last_name, username, pledge_class')
    .or(`first_name.ilike.%${cleanQ}%,last_name.ilike.%${cleanQ}%,username.ilike.%${cleanQ}%`)
    .limit(8);

  const activeResults = (profiles || []).map(p => ({
    id: p.id,
    name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username,
    username: p.username || '',
    pledge_class: p.pledge_class || undefined,
  }));

  // Search alumni table
  const { data: alumni } = await admin
    .from('alumni')
    .select('id, first_name, last_name, email, pledge_sem, grad_year')
    .or(`first_name.ilike.%${cleanQ}%,last_name.ilike.%${cleanQ}%,id.ilike.%${cleanQ}%,email.ilike.%${cleanQ}%`)
    .limit(8);

  const alumniResults = (alumni || []).map(a => ({
    id: a.id,
    name: `${a.first_name} ${a.last_name}`.trim(),
    username: a.id.replace(/^alum_/, ''),
    email: a.email || undefined,
    pledge_sem: a.pledge_sem || undefined,
    grad_year: a.grad_year || undefined,
  }));

  return {
    activeMembers: activeResults,
    alumniMembers: alumniResults,
  };
}

/**
 * Sets or adds a Big for a given Little node.
 * Handles cycle prevention so a brother cannot be their own ancestor.
 */
export async function setMemberBigAction(params: {
  littleId: string;
  bigId?: string;
  isAlumni: boolean;
  alumniData?: {
    first_name: string;
    last_name: string;
    username: string;
    email?: string;
    pledge_sem?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { littleId, isAlumni, alumniData } = params;
    let targetBigNodeId = params.bigId;

    // 1. Verify little node exists
    const { data: littleNode } = await admin
      .from('family_tree_nodes')
      .select('id, username')
      .eq('id', littleId)
      .single();

    if (!littleNode) {
      return { success: false, error: 'Target Little node does not exist in family tree.' };
    }

    // 2. If adding a new or un-noded alumni Big
    if (isAlumni && alumniData) {
      const cleanUsername = alumniData.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (!cleanUsername) {
        return { success: false, error: 'A unique username is required for this alumni Big.' };
      }

      const generatedAlumId = `alum_${cleanUsername}`;

      // Ensure record in public.alumni
      await admin.from('alumni').upsert({
        id: generatedAlumId,
        first_name: alumniData.first_name.trim(),
        last_name: alumniData.last_name.trim(),
        status: 'ALUMNI',
        email: alumniData.email?.trim() || null,
        pledge_sem: alumniData.pledge_sem?.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Ensure node in public.family_tree_nodes
      const { data: alumNode, error: nodeErr } = await admin
        .from('family_tree_nodes')
        .upsert({
          id: generatedAlumId,
          first_name: alumniData.first_name.trim(),
          last_name: alumniData.last_name.trim(),
          username: cleanUsername,
          email: alumniData.email?.trim() || null,
          is_alumni: true,
          alum_id: generatedAlumId,
          pledge_sem: alumniData.pledge_sem?.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'username' })
        .select('id')
        .single();

      if (nodeErr || !alumNode) {
        return { success: false, error: `Failed to create alumni node: ${nodeErr?.message || 'Unknown error'}` };
      }

      targetBigNodeId = alumNode.id;
    } else if (targetBigNodeId) {
      // Big is an active member or existing alumni node
      // If Big node doesn't exist yet, create it from profiles
      const { data: existingBigNode } = await admin
        .from('family_tree_nodes')
        .select('id')
        .eq('id', targetBigNodeId)
        .maybeSingle();

      if (!existingBigNode) {
        // Try to fetch from profiles
        const { data: p } = await admin
          .from('profiles')
          .select('id, first_name, last_name, username, pledge_class')
          .eq('id', targetBigNodeId)
          .single();

        if (p) {
          const uname = p.username || `user_${p.id.slice(0, 8)}`;
          await admin.from('family_tree_nodes').upsert({
            id: p.id,
            first_name: p.first_name || 'Brother',
            last_name: p.last_name || '',
            username: uname,
            is_alumni: false,
            user_id: p.id,
            pledge_sem: p.pledge_class || null,
          }, { onConflict: 'username' });
        }
      }
    }

    if (!targetBigNodeId) {
      return { success: false, error: 'Please specify a Big brother.' };
    }

    if (targetBigNodeId === littleId) {
      return { success: false, error: 'A member cannot be their own Big!' };
    }

    // 3. Cycle prevention check
    const { data: allEdges } = await admin
      .from('family_tree_edges')
      .select('little_id, big_id');

    const visited = new Set<string>();
    const queue = [targetBigNodeId];
    let isCycle = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === littleId) {
        isCycle = true;
        break;
      }
      visited.add(curr);

      const parents = (allEdges || [])
        .filter(e => e.little_id === curr)
        .map(e => e.big_id);

      for (const p of parents) {
        if (!visited.has(p)) {
          queue.push(p);
        }
      }
    }

    if (isCycle) {
      return { success: false, error: 'Invalid relationship: This creates a circular lineage loop.' };
    }

    // 4. Insert relationship edge
    const { error: edgeError } = await admin
      .from('family_tree_edges')
      .insert({
        little_id: littleId,
        big_id: targetBigNodeId,
        relationship_type: 'big_little',
      });

    if (edgeError && !edgeError.message.includes('duplicate key')) {
      return { success: false, error: edgeError.message };
    }

    revalidatePath('/family-tree');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to set Big brother.';
    return { success: false, error: msg };
  }
}

/**
 * Removes a Big-Little relationship
 */
export async function removeMemberBigAction(littleId: string, bigId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from('family_tree_edges')
      .delete()
      .eq('little_id', littleId)
      .eq('big_id', bigId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath('/family-tree');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to remove relationship.';
    return { success: false, error: msg };
  }
}

/**
 * Adds a Little brother to a given Big node.
 * Supports adding multiple Littles to any brother.
 */
export async function setMemberLittleAction(params: {
  bigId: string;
  littleId?: string;
  isAlumni: boolean;
  alumniData?: {
    first_name: string;
    last_name: string;
    username: string;
    email?: string;
    pledge_sem?: string;
  };
}): Promise<{ success: boolean; error?: string }> {
  try {
    const admin = createAdminClient();
    const { bigId, isAlumni, alumniData } = params;
    let targetLittleNodeId = params.littleId;

    // 1. Verify big node exists
    const { data: bigNode } = await admin
      .from('family_tree_nodes')
      .select('id, username')
      .eq('id', bigId)
      .single();

    if (!bigNode) {
      return { success: false, error: 'Target Big node does not exist in family tree.' };
    }

    // 2. If adding a new alumni Little
    if (isAlumni && alumniData) {
      const cleanUsername = alumniData.username.trim().toLowerCase().replace(/[^a-z0-9._-]/g, '');
      if (!cleanUsername) {
        return { success: false, error: 'A unique username is required for this alumni Little.' };
      }

      const generatedAlumId = `alum_${cleanUsername}`;

      // Ensure record in public.alumni
      await admin.from('alumni').upsert({
        id: generatedAlumId,
        first_name: alumniData.first_name.trim(),
        last_name: alumniData.last_name.trim(),
        status: 'ALUMNI',
        email: alumniData.email?.trim() || null,
        pledge_sem: alumniData.pledge_sem?.trim() || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

      // Ensure node in public.family_tree_nodes
      const { data: alumNode, error: nodeErr } = await admin
        .from('family_tree_nodes')
        .upsert({
          id: generatedAlumId,
          first_name: alumniData.first_name.trim(),
          last_name: alumniData.last_name.trim(),
          username: cleanUsername,
          email: alumniData.email?.trim() || null,
          is_alumni: true,
          alum_id: generatedAlumId,
          pledge_sem: alumniData.pledge_sem?.trim() || null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'username' })
        .select('id')
        .single();

      if (nodeErr || !alumNode) {
        return { success: false, error: `Failed to create alumni node: ${nodeErr?.message || 'Unknown error'}` };
      }

      targetLittleNodeId = alumNode.id;
    } else if (targetLittleNodeId) {
      // Little is an active member or existing alumni node
      const { data: existingLittleNode } = await admin
        .from('family_tree_nodes')
        .select('id')
        .eq('id', targetLittleNodeId)
        .maybeSingle();

      if (!existingLittleNode) {
        const { data: p } = await admin
          .from('profiles')
          .select('id, first_name, last_name, username, pledge_class')
          .eq('id', targetLittleNodeId)
          .single();

        if (p) {
          const uname = p.username || `user_${p.id.slice(0, 8)}`;
          await admin.from('family_tree_nodes').upsert({
            id: p.id,
            first_name: p.first_name || 'Brother',
            last_name: p.last_name || '',
            username: uname,
            is_alumni: false,
            user_id: p.id,
            pledge_sem: p.pledge_class || null,
          }, { onConflict: 'username' });
        }
      }
    }

    if (!targetLittleNodeId) {
      return { success: false, error: 'Please specify a Little brother.' };
    }

    if (targetLittleNodeId === bigId) {
      return { success: false, error: 'A member cannot be their own Little!' };
    }

    // 3. Cycle check: ensure targetLittleNodeId is not an ancestor of bigId
    const { data: allEdges } = await admin
      .from('family_tree_edges')
      .select('little_id, big_id');

    const visited = new Set<string>();
    const queue = [bigId];
    let isCycle = false;

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === targetLittleNodeId) {
        isCycle = true;
        break;
      }
      visited.add(curr);

      const parents = (allEdges || [])
        .filter(e => e.little_id === curr)
        .map(e => e.big_id);

      for (const p of parents) {
        if (!visited.has(p)) {
          queue.push(p);
        }
      }
    }

    if (isCycle) {
      return { success: false, error: 'Invalid relationship: This creates a circular lineage loop.' };
    }

    // 4. Insert relationship edge (little_id, big_id)
    const { error: edgeError } = await admin
      .from('family_tree_edges')
      .insert({
        little_id: targetLittleNodeId,
        big_id: bigId,
        relationship_type: 'big_little',
      });

    if (edgeError && !edgeError.message.includes('duplicate key')) {
      return { success: false, error: edgeError.message };
    }

    revalidatePath('/family-tree');
    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to set Little brother.';
    return { success: false, error: msg };
  }
}
