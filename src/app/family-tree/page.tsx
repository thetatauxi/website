import { getFamilyTreeDataAction } from '@/app/family-tree/actions';
import FamilyTreeClient from '@/app/family-tree/family-tree-client';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Family Tree | Theta Tau Xi Chapter',
  description: 'Chapter Big-Little Lineage and Alumni Tree',
};

export default async function FamilyTreePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const {
    nodes,
    edges,
    currentUserNode,
    isAlumniSession,
    alumniInfo,
  } = await getFamilyTreeDataAction();

  const isAuthenticated = !!user;

  return (
    <FamilyTreeClient
      initialNodes={nodes}
      initialEdges={edges}
      currentUserNode={currentUserNode}
      isAlumniSession={isAlumniSession}
      alumniInfo={alumniInfo}
      isAuthenticated={isAuthenticated}
    />
  );
}
