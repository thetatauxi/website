'use client'

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { TreeNode, TreeEdge, AlumniSession, removeMemberBigAction } from '@/app/family-tree/actions';
import {
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Users,
  GraduationCap,
  ChevronRight,
  ChevronLeft,
  X,
  Mail,
  GitFork,
  Plus,
  Trash2,
  Edit2,
  User,
  Network,
  Sparkles,
  Move,
  ArrowLeft,
  SlidersHorizontal,
  LogOut,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import LoadingLink from '@/components/ui/loading-link';

interface TreeVisualizerProps {
  nodes: TreeNode[];
  edges: TreeEdge[];
  currentUserNode: TreeNode | null;
  onOpenLineageEditor?: (node: TreeNode, mode?: 'big' | 'little') => void;
  canEdit?: boolean;
  onReload?: () => void;
  isAlumniSession?: boolean;
  alumniInfo?: AlumniSession | null;
  onLogoutAlumni?: () => void;
}

export default function TreeVisualizer({
  nodes,
  edges,
  currentUserNode,
  onOpenLineageEditor,
  canEdit = true,
  onReload,
  isAlumniSession = false,
  alumniInfo = null,
  onLogoutAlumni,
}: TreeVisualizerProps) {
  // View toggle: 'my_family' (Default) vs 'all'
  const [familyView, setFamilyView] = useState<'my_family' | 'all'>('my_family');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'alumni'>('all');
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [highlightedNodeId, setHighlightedNodeId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(0.95);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false);
  const [isDeletingEdge, setIsDeletingEdge] = useState(false);

  // References
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const treeWorldRef = useRef<HTMLDivElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Stabilize zoom & pan state for instantaneous cursor tracking & prevent re-centering loops
  const zoomLevelRef = useRef(zoomLevel);
  zoomLevelRef.current = zoomLevel;
  const panRef = useRef(pan);
  panRef.current = pan;
  const hasInitiallyCenteredRef = useRef(false);

  // Transition controller: true ONLY during deliberate programmatic actions (centering, jumping to person)
  const [isSmoothAnimating, setIsSmoothAnimating] = useState(false);
  const smoothTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerSmoothAnimation = useCallback((durationMs = 380) => {
    setIsSmoothAnimating(true);
    if (smoothTimeoutRef.current) clearTimeout(smoothTimeoutRef.current);
    smoothTimeoutRef.current = setTimeout(() => {
      setIsSmoothAnimating(false);
    }, durationMs);
  }, []);

  // Dragging state
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ startX: 0, startY: 0, panX: 0, panY: 0, hasMoved: false });

  // 1. Group edges into little -> bigs, big -> littles, and build undirected graph for family detection
  const { bigsMap, littlesMap, undirectedAdj } = useMemo(() => {
    const bMap = new Map<string, string[]>();
    const lMap = new Map<string, string[]>();
    const adj = new Map<string, string[]>();

    for (const node of nodes) {
      adj.set(node.id, []);
    }

    for (const edge of edges) {
      if (!bMap.has(edge.little_id)) bMap.set(edge.little_id, []);
      bMap.get(edge.little_id)!.push(edge.big_id);

      if (!lMap.has(edge.big_id)) lMap.set(edge.big_id, []);
      lMap.get(edge.big_id)!.push(edge.little_id);

      if (adj.has(edge.little_id) && adj.has(edge.big_id)) {
        adj.get(edge.little_id)!.push(edge.big_id);
        adj.get(edge.big_id)!.push(edge.little_id);
      }
    }

    return { bigsMap: bMap, littlesMap: lMap, undirectedAdj: adj };
  }, [nodes, edges]);

  // 2. Compute the connected component that represents "Your Family"
  const myFamilyNodeIds = useMemo(() => {
    if (!currentUserNode) return new Set<string>();

    const visited = new Set<string>();
    const queue = [currentUserNode.id];
    visited.add(currentUserNode.id);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = undirectedAdj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }

    return visited;
  }, [currentUserNode, undirectedAdj]);

  // 3. Find root nodes (nodes that have littles, but no bigs in the tree)
  const { roots, connectedNodeIds } = useMemo(() => {
    const allNodeIds = new Set(nodes.map(n => n.id));
    const conn = new Set<string>();

    for (const edge of edges) {
      if (allNodeIds.has(edge.little_id)) conn.add(edge.little_id);
      if (allNodeIds.has(edge.big_id)) conn.add(edge.big_id);
    }

    const rootList = nodes.filter(n => {
      const hasBig = bigsMap.has(n.id) && bigsMap.get(n.id)!.length > 0;
      const hasLittle = littlesMap.has(n.id) && littlesMap.get(n.id)!.length > 0;
      return !hasBig && (hasLittle || conn.has(n.id));
    });

    return { roots: rootList, connectedNodeIds: conn };
  }, [nodes, edges, bigsMap, littlesMap]);

  // 4. Filter roots based on viewMode ('my_family' vs 'all')
  const visibleRoots = useMemo(() => {
    if (familyView === 'my_family' && currentUserNode && myFamilyNodeIds.size > 0) {
      const famRoots = roots.filter(r => myFamilyNodeIds.has(r.id));
      if (famRoots.length > 0) return famRoots;
      const currentAsRoot = nodes.filter(n => n.id === currentUserNode.id);
      return currentAsRoot;
    }
    return roots;
  }, [roots, nodes, familyView, currentUserNode, myFamilyNodeIds]);

  // Unlinked members
  const unlinkedNodes = useMemo(() => {
    if (familyView === 'my_family') return [];
    return nodes.filter(n => !connectedNodeIds.has(n.id));
  }, [nodes, connectedNodeIds, familyView]);

  // Search Results for Autocomplete Dropdown
  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return [];
    return nodes
      .filter(node => {
        const fullName = `${node.first_name} ${node.last_name}`.toLowerCase();
        const uname = node.username.toLowerCase();
        const pc = (node.pledge_sem || '').toLowerCase();
        return fullName.includes(term) || uname.includes(term) || pc.includes(term);
      })
      .slice(0, 8);
  }, [nodes, searchTerm]);

  // Center on a specific node ID
  const centerOnNodeId = useCallback((nodeId: string, targetZoom?: number) => {
    const el = document.getElementById(`tree-node-${nodeId}`);
    const container = canvasContainerRef.current;
    const world = treeWorldRef.current;
    if (!el || !container || !world) return;

    const currentZoom = zoomLevelRef.current;
    const zoom = targetZoom ?? currentZoom;
    const elRect = el.getBoundingClientRect();
    const worldRect = world.getBoundingClientRect();

    // Node center coordinates in world space (unscaled)
    const unscaledNodeX = (elRect.left - worldRect.left + elRect.width / 2) / currentZoom;
    const unscaledNodeY = (elRect.top - worldRect.top + elRect.height / 2) / currentZoom;

    // Position pan so unscaledNode is right at center of container
    const newPanX = container.clientWidth / 2 - unscaledNodeX * zoom;
    const newPanY = container.clientHeight / 2 - unscaledNodeY * zoom;

    const nextPan = { x: newPanX, y: newPanY };
    triggerSmoothAnimation(380);
    zoomLevelRef.current = zoom;
    panRef.current = nextPan;

    setZoomLevel(zoom);
    setPan(nextPan);
  }, [triggerSmoothAnimation]);

  // Initial centering on page mount: center on user's node or first root ONCE only
  useEffect(() => {
    if (hasInitiallyCenteredRef.current) return;

    const timer = setTimeout(() => {
      if (hasInitiallyCenteredRef.current) return;

      if (currentUserNode && document.getElementById(`tree-node-${currentUserNode.id}`)) {
        centerOnNodeId(currentUserNode.id, 0.95);
        hasInitiallyCenteredRef.current = true;
      } else if (visibleRoots.length > 0 && document.getElementById(`tree-node-${visibleRoots[0].id}`)) {
        centerOnNodeId(visibleRoots[0].id, 0.85);
        hasInitiallyCenteredRef.current = true;
      } else if (canvasContainerRef.current && (currentUserNode || visibleRoots.length > 0)) {
        const nextPan = {
          x: canvasContainerRef.current.clientWidth / 3,
          y: 100,
        };
        panRef.current = nextPan;
        setPan(nextPan);
        hasInitiallyCenteredRef.current = true;
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [currentUserNode, visibleRoots, centerOnNodeId]);

  // Handle switching family view scope with deliberate re-centering
  const handleSwitchFamilyView = (view: 'my_family' | 'all') => {
    setFamilyView(view);
    setTimeout(() => {
      if (view === 'my_family' && currentUserNode) {
        centerOnNodeId(currentUserNode.id, 0.95);
      } else if (view === 'all' && roots.length > 0) {
        centerOnNodeId(roots[0].id, 0.85);
      }
    }, 150);
  };

  // Native Non-Passive Wheel Listener: Pinpoint zoom into exact mouse position with gentle sensitivity
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Cancel smooth transitions immediately so canvas tracks cursor with 0ms latency
      setIsSmoothAnimating(false);
      if (smoothTimeoutRef.current) clearTimeout(smoothTimeoutRef.current);

      const currentZoom = zoomLevelRef.current;
      const currentPan = panRef.current;

      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Normalize delta across different mice, wheels, and trackpads
      let delta = e.deltaY;
      if (e.deltaMode === 1) delta *= 20; // Line mode
      else if (e.deltaMode === 2) delta *= 300; // Page mode

      // Gentle, natural sensitivity:
      // A standard mouse wheel notch (~100px) gives ~6% zoom change
      // A trackpad scroll tick (~3px) gives ~0.2% fine zoom change
      const clampedDelta = Math.max(-100, Math.min(100, delta));
      const zoomFactor = Math.exp(-clampedDelta * 0.0007);
      const newZoom = Math.min(Math.max(0.35, currentZoom * zoomFactor), 2.2);

      if (Math.abs(newZoom - currentZoom) < 0.0001) return;

      // Pinpoint zoom: mathematically locks the world coordinate directly under the mouse
      const worldX = (mouseX - currentPan.x) / currentZoom;
      const worldY = (mouseY - currentPan.y) / currentZoom;

      const newPanX = mouseX - worldX * newZoom;
      const newPanY = mouseY - worldY * newZoom;

      const nextPan = { x: newPanX, y: newPanY };
      zoomLevelRef.current = newZoom;
      panRef.current = nextPan;

      setZoomLevel(newZoom);
      setPan(nextPan);
    };

    container.addEventListener('wheel', handleWheelNative, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheelNative);
    };
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Jump, Zoom, and Highlight when a Search Result is Clicked
  const handleSelectSearchResult = (node: TreeNode) => {
    if (familyView === 'my_family' && !myFamilyNodeIds.has(node.id)) {
      setFamilyView('all');
    }

    setIsSearchOpen(false);

    // Set temporary 2.2-second highlight
    setHighlightedNodeId(node.id);
    if (highlightTimeoutRef.current) {
      clearTimeout(highlightTimeoutRef.current);
    }
    highlightTimeoutRef.current = setTimeout(() => {
      setHighlightedNodeId(null);
    }, 2200);

    setSelectedNode(node);

    // Smoothly animate and center to the node
    setTimeout(() => {
      centerOnNodeId(node.id, 1.05);
    }, 120);
  };

  // Mouse Drag Handlers for Panning
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;

    setIsSmoothAnimating(false);
    if (smoothTimeoutRef.current) clearTimeout(smoothTimeoutRef.current);

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      panX: panRef.current.x,
      panY: panRef.current.y,
      hasMoved: false,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragStartRef.current.hasMoved = true;
    }

    const nextPan = {
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    };
    panRef.current = nextPan;
    setPan(nextPan);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile Panning
  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-no-drag]')) return;

    setIsSmoothAnimating(false);
    if (smoothTimeoutRef.current) clearTimeout(smoothTimeoutRef.current);

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        startX: touch.clientX,
        startY: touch.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        hasMoved: false,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const dx = touch.clientX - dragStartRef.current.startX;
    const dy = touch.clientY - dragStartRef.current.startY;

    const nextPan = {
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    };
    panRef.current = nextPan;
    setPan(nextPan);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Button Zoom Helpers
  const handleZoomBtn = (delta: number) => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const currentZoom = zoomLevelRef.current;
    const currentPan = panRef.current;
    const newZoom = Math.min(Math.max(0.35, currentZoom + delta), 2.2);
    if (Math.abs(newZoom - currentZoom) < 0.0001) return;

    const centerX = container.clientWidth / 2;
    const centerY = container.clientHeight / 2;

    const worldX = (centerX - currentPan.x) / currentZoom;
    const worldY = (centerY - currentPan.y) / currentZoom;

    const nextPan = {
      x: centerX - worldX * newZoom,
      y: centerY - worldY * newZoom,
    };

    triggerSmoothAnimation(200);
    zoomLevelRef.current = newZoom;
    panRef.current = nextPan;

    setZoomLevel(newZoom);
    setPan(nextPan);
  };

  const handleResetCenter = () => {
    if (currentUserNode) {
      centerOnNodeId(currentUserNode.id, 0.95);
    } else if (visibleRoots.length > 0) {
      centerOnNodeId(visibleRoots[0].id, 0.85);
    } else {
      triggerSmoothAnimation(350);
      const nextPan = { x: 100, y: 100 };
      zoomLevelRef.current = 0.95;
      panRef.current = nextPan;
      setZoomLevel(0.95);
      setPan(nextPan);
    }
  };

  // Direct edge deletion handler
  const handleRemoveEdge = async (littleId: string, bigId: string) => {
    if (!confirm('Are you sure you want to remove this relationship?')) return;
    setIsDeletingEdge(true);
    try {
      const res = await removeMemberBigAction(littleId, bigId);
      if (res.success && onReload) {
        onReload();
      }
    } catch {
      alert('Failed to remove relationship.');
    } finally {
      setIsDeletingEdge(false);
    }
  };

  // Recursive tree branch renderer
  const renderSubtree = (nodeId: string, visited: Set<string> = new Set()): React.ReactNode => {
    if (visited.has(nodeId)) return null;
    visited.add(nodeId);

    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    if (statusFilter === 'active' && node.is_alumni) return null;
    if (statusFilter === 'alumni' && !node.is_alumni) return null;

    const littles = (littlesMap.get(nodeId) || []).map(id => nodes.find(n => n.id === id)).filter(Boolean) as TreeNode[];
    const isJumpHighlighted = highlightedNodeId === node.id;
    const isCurrent = currentUserNode?.id === node.id;

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Node Card */}
        <div
          id={`tree-node-${node.id}`}
          data-no-drag="true"
          onClick={() => {
            if (!dragStartRef.current.hasMoved) {
              setSelectedNode(node);
            }
          }}
          className={`cursor-pointer group relative p-3 sm:p-4 rounded-2xl select-none transition-all duration-300 shadow-md hover:shadow-xl border ${
            isJumpHighlighted
              ? 'ring-4 ring-amber-400 dark:ring-amber-300 bg-amber-100/95 dark:bg-amber-950/90 scale-110 z-30 shadow-2xl animate-pulse border-amber-400 dark:border-amber-400'
              : isCurrent
              ? 'ring-2 ring-red-600 bg-red-50/80 dark:bg-red-950/50 border-red-400 dark:border-red-700'
              : 'bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800 hover:border-red-400 dark:hover:border-red-700'
          } w-[210px] text-center transform hover:-translate-y-0.5`}
        >
          {/* Status Badge */}
          <div className="flex items-center justify-between mb-2">
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
                node.is_alumni
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50'
                  : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/50'
              }`}
            >
              {node.is_alumni ? (
                <>
                  <GraduationCap className="h-3 w-3" />
                  Alumni
                </>
              ) : (
                <>
                  <Users className="h-3 w-3" />
                  Active
                </>
              )}
            </span>

            {node.pledge_sem && (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate max-w-[85px]">
                {node.pledge_sem}
              </span>
            )}
          </div>

          {/* Member Name */}
          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
            {node.first_name} {node.last_name}
          </h4>
          <p className="text-[11px] font-mono text-gray-400 truncate mt-0.5">
            @{node.username}
          </p>

          {/* Quick counts for Bigs / Littles */}
          <div className="mt-2 flex items-center justify-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-zinc-800/80 pt-1.5">
            <span>Bigs: <strong>{(bigsMap.get(node.id) || []).length}</strong></span>
            <span>•</span>
            <span>Littles: <strong>{littles.length}</strong></span>
          </div>

          {isCurrent && (
            <div className="mt-1.5 text-[10px] font-semibold text-red-700 dark:text-red-400 bg-red-100/70 dark:bg-red-950/70 py-0.5 rounded-md">
              ★ You
            </div>
          )}

          {isJumpHighlighted && (
            <div className="mt-1 text-[9px] font-black uppercase tracking-wider text-amber-700 dark:text-amber-300 flex items-center justify-center gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Target
            </div>
          )}
        </div>

        {/* Children (Littles) Connector Lines */}
        {littles.length > 0 && (
          <div className="flex flex-col items-center">
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-gray-300 dark:bg-zinc-700" />

            {/* Horizontal bar spanning children */}
            <div className="flex justify-center relative">
              {littles.length > 1 && (
                <div
                  className="absolute top-0 h-0.5 bg-gray-300 dark:bg-zinc-700"
                  style={{
                    left: '50%',
                    right: '50%',
                    transform: 'translateX(-50%)',
                    width: `calc(100% - ${210}px)`,
                  }}
                />
              )}

              {/* Little branches */}
              <div className="flex gap-6 sm:gap-10 pt-6 relative">
                {littles.map(little => (
                  <div key={little.id} className="relative flex flex-col items-center">
                    <div className="absolute -top-6 w-0.5 h-6 bg-gray-300 dark:bg-zinc-700" />
                    {renderSubtree(little.id, new Set(visited))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-gray-50/80 dark:bg-zinc-950">
      
      {/* -------------------------------------------------------------------- */}
      {/* 1. Floating Controls Window on the Left */}
      {/* -------------------------------------------------------------------- */}
      {isControlsCollapsed ? (
        /* Collapsed Floating Trigger Pill */
        <button
          type="button"
          onClick={() => setIsControlsCollapsed(false)}
          className="fixed top-24 left-4 sm:left-6 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-gray-200 dark:border-zinc-800 shadow-xl px-3.5 py-2.5 rounded-2xl flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-200 hover:border-red-500 transition-all active:scale-95 group"
          title="Open Controls Window"
        >
          <div className="p-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
            <SlidersHorizontal className="h-4 w-4" />
          </div>
          <span>Controls</span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800 text-gray-500">
            {familyView === 'my_family' ? 'Your Family' : 'All'}
          </span>
          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      ) : (
        /* Expanded Floating Controls Window */
        <div
          data-no-drag="true"
          className="fixed top-24 left-4 sm:left-6 z-40 w-80 sm:w-88 max-h-[calc(100vh-7.5rem)] flex flex-col bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border border-gray-200/80 dark:border-zinc-800 rounded-3xl shadow-2xl overflow-hidden transition-all duration-200"
        >
          {/* Window Header */}
          <div className="p-4 pb-3 border-b border-gray-100 dark:border-zinc-800/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Link
                href={isAlumniSession ? '/' : '/members-only'}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                title="Return"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="flex items-center gap-1.5">
                <div className="p-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                  <GitFork className="h-3.5 w-3.5" />
                </div>
                <h3 className="font-black text-sm tracking-tight text-gray-900 dark:text-white">
                  Family Tree
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsControlsCollapsed(true)}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
              title="Collapse Window"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          </div>

          {/* Window Body (Scrollable Controls) */}
          <div className="p-4 space-y-4 overflow-y-auto flex-1">
            
            {/* Search Brother with Live Autocomplete Dropdown */}
            <div ref={searchContainerRef} className="relative">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Search Brother
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <Input
                  type="text"
                  value={searchTerm}
                  onFocus={() => setIsSearchOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setIsSearchOpen(true);
                  }}
                  placeholder="Type name (jumps to person)..."
                  className="pl-9 pr-7 text-xs bg-gray-50 dark:bg-zinc-800/80 border-gray-200 dark:border-zinc-700 h-9 rounded-xl focus:ring-2 focus:ring-red-600"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setIsSearchOpen(false);
                    }}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Autocomplete Dropdown Menu */}
              {isSearchOpen && searchTerm.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800">
                  {searchResults.length === 0 ? (
                    <div className="p-3 text-center text-xs text-gray-400 italic">
                      No brothers found matching &ldquo;{searchTerm}&rdquo;
                    </div>
                  ) : (
                    searchResults.map(match => {
                      const isInUserFamily = myFamilyNodeIds.has(match.id);
                      return (
                        <button
                          key={match.id}
                          type="button"
                          onClick={() => handleSelectSearchResult(match)}
                          className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-red-50/50 dark:hover:bg-red-950/30 transition-colors group"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-bold text-gray-900 dark:text-white truncate group-hover:text-red-700 dark:group-hover:text-red-400">
                                {match.first_name} {match.last_name}
                              </p>
                              {isInUserFamily && (
                                <span className="text-[8px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded-full border border-emerald-200/50">
                                  Your Line
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 truncate">
                              @{match.username} {match.pledge_sem ? `• ${match.pledge_sem}` : ''}
                            </p>
                          </div>

                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${
                              match.is_alumni
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                                : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                            }`}
                          >
                            {match.is_alumni ? 'Alum' : 'Act'}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Lineage Scope Toggle: Your Family vs All Families */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Lineage Scope
              </label>
              <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => handleSwitchFamilyView('my_family')}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    familyView === 'my_family'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <User className="h-3 w-3" />
                  <span>Your Family</span>
                  {myFamilyNodeIds.size > 0 && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                        familyView === 'my_family'
                          ? 'bg-red-800 text-white'
                          : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {myFamilyNodeIds.size}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => handleSwitchFamilyView('all')}
                  className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    familyView === 'all'
                      ? 'bg-red-700 text-white shadow-xs'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Network className="h-3 w-3" />
                  <span>All Families</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full ${
                      familyView === 'all'
                        ? 'bg-red-800 text-white'
                        : 'bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {nodes.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Status Filter: All / Active / Alumni */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Filter Status
              </label>
              <div className="grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-semibold gap-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`py-1 rounded-lg transition-all text-center ${
                    statusFilter === 'all'
                      ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('active')}
                  className={`py-1 rounded-lg transition-all text-center ${
                    statusFilter === 'active'
                      ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('alumni')}
                  className={`py-1 rounded-lg transition-all text-center ${
                    statusFilter === 'alumni'
                      ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
                  }`}
                >
                  Alumni
                </button>
              </div>
            </div>

            {/* Zoom & Canvas Map Navigation Toolbar */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">
                Map Zoom &amp; Navigation
              </label>
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-gray-100 dark:bg-zinc-800">
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoomBtn(-0.15)}
                    className="h-7 w-7 p-0"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                  </Button>

                  <span className="text-[10px] font-mono font-bold px-1.5 text-gray-700 dark:text-gray-300 min-w-[36px] text-center">
                    {Math.round(zoomLevel * 100)}%
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleZoomBtn(0.15)}
                    className="h-7 w-7 p-0"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5 text-gray-700 dark:text-gray-300" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetCenter}
                  className="h-7 px-2 text-[10px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1 hover:bg-white dark:hover:bg-zinc-900 rounded-lg"
                  title="Center View"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Center</span>
                </Button>
              </div>
              <p className="text-[9px] text-gray-400 mt-1 flex items-center gap-1">
                <Move className="h-2.5 w-2.5" /> Drag map to pan • Scroll to zoom
              </p>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2 border-t border-gray-100 dark:border-zinc-800/80">
              {canEdit && onOpenLineageEditor && (
                <Button
                  type="button"
                  onClick={() => onOpenLineageEditor(currentUserNode || nodes[0])}
                  className="w-full h-8.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition-all active:scale-95"
                >
                  <GitFork className="h-3.5 w-3.5" />
                  <span>Edit Lineage</span>
                </Button>
              )}

              <LoadingLink
                href="/alumni"
                className="w-full h-8 px-3 text-xs rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 font-semibold flex items-center justify-center gap-1.5 transition-colors border border-gray-200 dark:border-zinc-700"
              >
                <GraduationCap className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                <span>Alumni Directory</span>
              </LoadingLink>
            </div>

            {/* User Session Chip / Alumni Logout */}
            {isAlumniSession && alumniInfo && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <GraduationCap className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="font-semibold text-amber-900 dark:text-amber-200 truncate text-[11px]">
                    {alumniInfo.first_name} {alumniInfo.last_name}
                  </span>
                </div>
                {onLogoutAlumni && (
                  <button
                    type="button"
                    onClick={onLogoutAlumni}
                    className="text-gray-400 hover:text-red-600 transition-colors p-1"
                    title="Alumni Log Out"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {!isAlumniSession && currentUserNode && (
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800/60 border border-gray-100 dark:border-zinc-800 flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300 truncate">
                  Logged in as {currentUserNode.first_name} {currentUserNode.last_name}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* 2. Full-Page Interactive Map Canvas */}
      {/* -------------------------------------------------------------------- */}
      <div
        ref={canvasContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`w-full h-full relative overflow-hidden select-none family-tree-canvas-bg ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* Infinite World Container */}
        <div
          ref={treeWorldRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
            transformOrigin: '0 0',
            transition: isSmoothAnimating
              ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
              : 'none',
          }}
          className="absolute top-0 left-0 min-w-max min-h-max p-28 sm:p-36 flex flex-col items-center gap-16"
        >
          {visibleRoots.length === 0 ? (
            <div className="py-24 text-center text-gray-400 space-y-3 max-w-md mx-auto" data-no-drag="true">
              <GitFork className="h-12 w-12 mx-auto text-gray-300 dark:text-zinc-700" />
              <h3 className="text-base font-bold text-gray-700 dark:text-gray-300">
                {familyView === 'my_family'
                  ? 'No Lineage Linked Yet for Your Profile'
                  : 'No Family Trees Found'}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                {familyView === 'my_family'
                  ? 'You haven\'t linked your Big or Little brothers yet! Click "Edit Lineage" to connect your line, or switch to "All Families" to explore the chapter trees.'
                  : 'Start building your chapter lineage by clicking "Edit Lineage" in the controls window.'}
              </p>
              {familyView === 'my_family' && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <Button
                    type="button"
                    onClick={() => setFamilyView('all')}
                    variant="outline"
                    className="text-xs rounded-xl"
                  >
                    View All Families
                  </Button>
                  {canEdit && onOpenLineageEditor && (
                    <Button
                      type="button"
                      onClick={() => onOpenLineageEditor(currentUserNode || nodes[0])}
                      className="text-xs rounded-xl bg-red-700 hover:bg-red-800 text-white"
                    >
                      Edit Lineage
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-start justify-center gap-16 sm:gap-24">
              {visibleRoots.map(root => (
                <div key={root.id} className="flex flex-col items-center">
                  {renderSubtree(root.id)}
                </div>
              ))}
            </div>
          )}

          {/* Unlinked Brothers Section (shown in All Families mode) */}
          {unlinkedNodes.length > 0 && statusFilter !== 'alumni' && (
            <div className="w-full pt-12 border-t border-gray-200/80 dark:border-zinc-800 flex flex-col items-center">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">
                Brothers Not Yet Linked ({unlinkedNodes.length})
              </h4>
              <div className="flex flex-wrap justify-center gap-4 max-w-4xl" data-no-drag="true">
                {unlinkedNodes.map(node => (
                  <div
                    key={node.id}
                    id={`tree-node-${node.id}`}
                    onClick={() => setSelectedNode(node)}
                    className={`cursor-pointer p-3 rounded-xl border bg-white dark:bg-zinc-900 text-xs w-[180px] text-center shadow-sm hover:border-red-400 transition-all ${
                      highlightedNodeId === node.id
                        ? 'ring-4 ring-amber-400 scale-105 bg-amber-50 dark:bg-amber-950/60'
                        : 'border-gray-200 dark:border-zinc-800'
                    }`}
                  >
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {node.first_name} {node.last_name}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">@{node.username}</p>
                    <span className="mt-1.5 inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-gray-100 dark:bg-zinc-800 text-gray-500">
                      Unlinked
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* 3. Selected Node Details Slide-Out Drawer (Right Side) */}
      {/* -------------------------------------------------------------------- */}
      {selectedNode && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-zinc-900 border-l border-gray-200 dark:border-zinc-800 shadow-2xl z-50 p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-zinc-800">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                selectedNode.is_alumni
                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
                  : 'bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300'
              }`}>
                {selectedNode.is_alumni ? 'Alumni Brother' : 'Active Brother'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedNode(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedNode.first_name} {selectedNode.last_name}
                </h3>
                <p className="text-xs font-mono text-gray-400">@{selectedNode.username}</p>
              </div>

              {selectedNode.pledge_sem && (
                <div className="text-xs text-gray-600 dark:text-gray-300">
                  <span className="font-semibold text-gray-400 uppercase text-[10px] block">Pledge Class</span>
                  {selectedNode.pledge_sem}
                </div>
              )}

              {selectedNode.email && (
                <div className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  <a href={`mailto:${selectedNode.email}`} className="text-red-700 dark:text-red-400 hover:underline">
                    {selectedNode.email}
                  </a>
                </div>
              )}

              {/* Big Brothers */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-400 uppercase text-[10px]">
                    Big Brother(s) ({(bigsMap.get(selectedNode.id) || []).length})
                  </span>
                  {canEdit && onOpenLineageEditor && (
                    <button
                      type="button"
                      onClick={() => onOpenLineageEditor(selectedNode, 'big')}
                      className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Add Big
                    </button>
                  )}
                </div>

                {(!bigsMap.has(selectedNode.id) || bigsMap.get(selectedNode.id)!.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">No Big brothers recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {bigsMap.get(selectedNode.id)!.map(bigId => {
                      const big = nodes.find(n => n.id === bigId);
                      if (!big) return null;
                      return (
                        <div
                          key={big.id}
                          className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800 text-xs flex items-center justify-between border border-gray-100 dark:border-zinc-700/60"
                        >
                          <span
                            onClick={() => {
                              setSelectedNode(big);
                              centerOnNodeId(big.id);
                            }}
                            className="font-semibold text-gray-800 dark:text-gray-200 cursor-pointer hover:underline flex items-center gap-1.5"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-red-600" />
                            {big.first_name} {big.last_name}
                          </span>

                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isDeletingEdge}
                                onClick={() => handleRemoveEdge(selectedNode.id, big.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                title="Remove Big"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNode(big);
                                centerOnNodeId(big.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Little Brothers */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-gray-400 uppercase text-[10px]">
                    Little Brother(s) ({(littlesMap.get(selectedNode.id) || []).length})
                  </span>
                  {canEdit && onOpenLineageEditor && (
                    <button
                      type="button"
                      onClick={() => onOpenLineageEditor(selectedNode, 'little')}
                      className="text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" /> Add Little
                    </button>
                  )}
                </div>

                {(!littlesMap.has(selectedNode.id) || littlesMap.get(selectedNode.id)!.length === 0) ? (
                  <p className="text-xs text-gray-400 italic">No Little brothers recorded.</p>
                ) : (
                  <div className="space-y-1.5">
                    {littlesMap.get(selectedNode.id)!.map(littleId => {
                      const little = nodes.find(n => n.id === littleId);
                      if (!little) return null;
                      return (
                        <div
                          key={little.id}
                          className="p-2 rounded-xl bg-gray-50 dark:bg-zinc-800 text-xs flex items-center justify-between border border-gray-100 dark:border-zinc-700/60"
                        >
                          <span
                            onClick={() => {
                              setSelectedNode(little);
                              centerOnNodeId(little.id);
                            }}
                            className="font-semibold text-gray-800 dark:text-gray-200 cursor-pointer hover:underline flex items-center gap-1.5"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                            {little.first_name} {little.last_name}
                          </span>

                          <div className="flex items-center gap-1">
                            {canEdit && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                disabled={isDeletingEdge}
                                onClick={() => handleRemoveEdge(little.id, selectedNode.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                title="Remove Little"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedNode(little);
                                centerOnNodeId(little.id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
            {canEdit && onOpenLineageEditor && (
              <Button
                type="button"
                onClick={() => onOpenLineageEditor(selectedNode, 'big')}
                className="w-full h-9 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit {selectedNode.first_name}&rsquo;s Bigs &amp; Littles</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedNode(null)}
              className="w-full text-xs h-8 rounded-xl"
            >
              Close Drawer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
