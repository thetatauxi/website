'use client'

import React, { useState, useEffect } from 'react';
import { TreeNode, TreeEdge, AlumniSession, alumniLogoutAction } from '@/app/family-tree/actions';
import TreeVisualizer from '@/components/family-tree/tree-visualizer';
import LineageEditorModal from '@/components/family-tree/lineage-editor-modal';
import AlumniLoginCard from '@/components/family-tree/alumni-login-card';
import { useRouter } from 'next/navigation';

interface FamilyTreeClientProps {
  initialNodes: TreeNode[];
  initialEdges: TreeEdge[];
  currentUserNode: TreeNode | null;
  isAlumniSession: boolean;
  alumniInfo: AlumniSession | null;
  isAuthenticated: boolean;
}

export default function FamilyTreeClient({
  initialNodes,
  initialEdges,
  currentUserNode,
  isAlumniSession,
  alumniInfo,
  isAuthenticated,
}: FamilyTreeClientProps) {
  const nodes = initialNodes;
  const edges = initialEdges;
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorTargetNode, setEditorTargetNode] = useState<TreeNode | null>(currentUserNode || initialNodes[0] || null);
  const [editorMode, setEditorMode] = useState<'big' | 'little'>('big');
  const router = useRouter();

  // Prevent outer browser page scrolling while inside the full-screen family tree map
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleLogoutAlumni = async () => {
    await alumniLogoutAction();
    router.refresh();
  };

  if (!isAuthenticated && !isAlumniSession) {
    return (
      <div className="fixed top-20 bottom-0 left-0 right-0 z-30 flex items-center justify-center bg-gray-50/80 dark:bg-zinc-950 p-4 overflow-y-auto">
        <AlumniLoginCard onSuccess={() => router.refresh()} />
      </div>
    );
  }

  return (
    <div className="fixed top-20 bottom-0 left-0 right-0 z-30 overflow-hidden bg-gray-50/70 dark:bg-zinc-950">
      <TreeVisualizer
        nodes={nodes}
        edges={edges}
        currentUserNode={currentUserNode}
        canEdit={!isAlumniSession && isAuthenticated}
        isAlumniSession={isAlumniSession}
        alumniInfo={alumniInfo}
        onLogoutAlumni={handleLogoutAlumni}
        onOpenLineageEditor={(target, mode = 'big') => {
          setEditorTargetNode(target || currentUserNode || nodes[0] || null);
          setEditorMode(mode);
          setIsEditorOpen(true);
        }}
        onReload={() => router.refresh()}
      />

      {/* Lineage Editor Modal (Manage Bigs & Littles for any brother) */}
      {editorTargetNode && (
        <LineageEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          targetNode={editorTargetNode}
          allNodes={nodes}
          allEdges={edges}
          initialMode={editorMode}
          onSelectDifferentPerson={(newPerson) => setEditorTargetNode(newPerson)}
          onUpdated={() => {
            router.refresh();
          }}
        />
      )}
    </div>
  );
}
