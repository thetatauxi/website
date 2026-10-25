'use client'

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  TreeNode,
  TreeEdge,
  searchActiveAndAlumniAction,
  setMemberBigAction,
  setMemberLittleAction,
  removeMemberBigAction,
} from '@/app/family-tree/actions';
import { Users, GraduationCap, Plus, Trash2, Search, CheckCircle2, AlertCircle, Loader2, GitFork, User } from 'lucide-react';

interface LineageEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetNode: TreeNode | null;
  allNodes: TreeNode[];
  allEdges: TreeEdge[];
  initialMode?: 'big' | 'little';
  onUpdated: () => void;
  onSelectDifferentPerson?: (node: TreeNode) => void;
}

export default function LineageEditorModal({
  isOpen,
  onClose,
  targetNode,
  allNodes,
  allEdges,
  initialMode = 'big',
  onUpdated,
  onSelectDifferentPerson,
}: LineageEditorModalProps) {
  // Mode: Are we managing Bigs or Littles for this person?
  const [relationMode, setRelationMode] = useState<'big' | 'little'>(initialMode);
  // Source: Are we searching an active brother or entering an alumni brother?
  const [sourceType, setSourceType] = useState<'active' | 'alumni'>('active');

  // Person Switcher Search
  const [isSwitchingPerson, setIsSwitchingPerson] = useState(false);
  const [personSearchQuery, setPersonSearchQuery] = useState('');

  // Search state for active brothers
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeResults, setActiveResults] = useState<Array<{ id: string; name: string; username: string; email?: string; pledge_class?: string }>>([]);
  const [selectedActiveMember, setSelectedActiveMember] = useState<{ id: string; name: string; username: string } | null>(null);

  // Form state for alumni
  const [alumniFirstName, setAlumniFirstName] = useState('');
  const [alumniLastName, setAlumniLastName] = useState('');
  const [alumniUsername, setAlumniUsername] = useState('');
  const [alumniEmail, setAlumniEmail] = useState('');
  const [alumniPledgeSem, setAlumniPledgeSem] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setRelationMode(initialMode);
    setError(null);
    setSuccess(null);
    setSelectedActiveMember(null);
    setSearchQuery('');
  }, [initialMode, targetNode, isOpen]);

  // Debounced search for active members
  useEffect(() => {
    if (!searchQuery.trim() || sourceType !== 'active') {
      setActiveResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchActiveAndAlumniAction(searchQuery.trim());
        setActiveResults(res.activeMembers);
      } catch {
        setActiveResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, sourceType]);

  if (!targetNode) return null;

  // Identify current Bigs for targetNode
  const currentBigEdges = allEdges.filter(e => e.little_id === targetNode.id);
  const currentBigNodes = currentBigEdges.map(e => allNodes.find(n => n.id === e.big_id)).filter(Boolean) as TreeNode[];

  // Identify current Littles for targetNode
  const currentLittleEdges = allEdges.filter(e => e.big_id === targetNode.id);
  const currentLittleNodes = currentLittleEdges.map(e => allNodes.find(n => n.id === e.little_id)).filter(Boolean) as TreeNode[];

  // Auto-generate suggested alumni username from first/last name
  const handleAlumniNameChange = (first: string, last: string) => {
    setAlumniFirstName(first);
    setAlumniLastName(last);
    if (!alumniUsername || alumniUsername.startsWith('alum_')) {
      const clean = `${first.toLowerCase()}_${last.toLowerCase()}`.replace(/[^a-z0-9_]/g, '');
      if (clean && clean !== '_') {
        setAlumniUsername(`alum_${clean}`);
      }
    }
  };

  // Submit adding Big or Little
  const handleAddRelationship = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (relationMode === 'big') {
        // Adding a Big to targetNode
        if (sourceType === 'active') {
          if (!selectedActiveMember) {
            setError('Please search and select an active brother to add as Big.');
            setIsLoading(false);
            return;
          }

          const res = await setMemberBigAction({
            littleId: targetNode.id,
            bigId: selectedActiveMember.id,
            isAlumni: false,
          });

          if (!res.success) {
            setError(res.error || 'Failed to add Big.');
            setIsLoading(false);
            return;
          }

          setSuccess(`Added ${selectedActiveMember.name} as a Big for ${targetNode.first_name}!`);
          setSelectedActiveMember(null);
          setSearchQuery('');
          onUpdated();
        } else {
          // Alumni Big
          if (!alumniFirstName.trim() || !alumniLastName.trim()) {
            setError('First and Last name are required for alumni.');
            setIsLoading(false);
            return;
          }
          if (!alumniUsername.trim()) {
            setError('A unique username is required for this alumni Big.');
            setIsLoading(false);
            return;
          }

          const res = await setMemberBigAction({
            littleId: targetNode.id,
            isAlumni: true,
            alumniData: {
              first_name: alumniFirstName.trim(),
              last_name: alumniLastName.trim(),
              username: alumniUsername.trim().toLowerCase(),
              email: alumniEmail.trim() || undefined,
              pledge_sem: alumniPledgeSem.trim() || undefined,
            },
          });

          if (!res.success) {
            setError(res.error || 'Failed to add alumni Big.');
            setIsLoading(false);
            return;
          }

          setSuccess(`Added ${alumniFirstName} ${alumniLastName} (Alumni) as a Big!`);
          setAlumniFirstName('');
          setAlumniLastName('');
          setAlumniUsername('');
          setAlumniEmail('');
          setAlumniPledgeSem('');
          onUpdated();
        }
      } else {
        // Adding a Little to targetNode
        if (sourceType === 'active') {
          if (!selectedActiveMember) {
            setError('Please search and select an active brother to add as Little.');
            setIsLoading(false);
            return;
          }

          const res = await setMemberLittleAction({
            bigId: targetNode.id,
            littleId: selectedActiveMember.id,
            isAlumni: false,
          });

          if (!res.success) {
            setError(res.error || 'Failed to add Little.');
            setIsLoading(false);
            return;
          }

          setSuccess(`Added ${selectedActiveMember.name} as a Little for ${targetNode.first_name}!`);
          setSelectedActiveMember(null);
          setSearchQuery('');
          onUpdated();
        } else {
          // Alumni Little
          if (!alumniFirstName.trim() || !alumniLastName.trim()) {
            setError('First and Last name are required for alumni.');
            setIsLoading(false);
            return;
          }
          if (!alumniUsername.trim()) {
            setError('A unique username is required for this alumni Little.');
            setIsLoading(false);
            return;
          }

          const res = await setMemberLittleAction({
            bigId: targetNode.id,
            isAlumni: true,
            alumniData: {
              first_name: alumniFirstName.trim(),
              last_name: alumniLastName.trim(),
              username: alumniUsername.trim().toLowerCase(),
              email: alumniEmail.trim() || undefined,
              pledge_sem: alumniPledgeSem.trim() || undefined,
            },
          });

          if (!res.success) {
            setError(res.error || 'Failed to add alumni Little.');
            setIsLoading(false);
            return;
          }

          setSuccess(`Added ${alumniFirstName} ${alumniLastName} (Alumni) as a Little!`);
          setAlumniFirstName('');
          setAlumniLastName('');
          setAlumniUsername('');
          setAlumniEmail('');
          setAlumniPledgeSem('');
          onUpdated();
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Big relationship: (little = targetNode, big = bigId)
  const handleRemoveBig = async (bigId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await removeMemberBigAction(targetNode.id, bigId);
      if (!res.success) {
        setError(res.error || 'Failed to remove relationship.');
      } else {
        setSuccess('Big brother removed.');
        onUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove relationship.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Remove Little relationship: (little = littleId, big = targetNode)
  const handleRemoveLittle = async (littleId: string) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await removeMemberBigAction(littleId, targetNode.id);
      if (!res.success) {
        setError(res.error || 'Failed to remove relationship.');
      } else {
        setSuccess('Little brother removed.');
        onUpdated();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to remove relationship.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Switch person search filtered results
  const matchingBrothers = allNodes.filter(n => {
    if (!personSearchQuery.trim()) return false;
    const term = personSearchQuery.toLowerCase();
    const fullName = `${n.first_name} ${n.last_name}`.toLowerCase();
    return fullName.includes(term) || n.username.toLowerCase().includes(term);
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400">
                <GitFork className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">
                  Manage Lineage
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                  Editing Bigs &amp; Littles for <strong>{targetNode.first_name} {targetNode.last_name}</strong> (@{targetNode.username})
                </DialogDescription>
              </div>
            </div>

            {onSelectDifferentPerson && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsSwitchingPerson(!isSwitchingPerson)}
                className="text-[11px] h-7 px-2 border-gray-200 dark:border-zinc-700"
              >
                <User className="h-3 w-3 mr-1" />
                Change Person
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Change person dropdown search */}
        {isSwitchingPerson && (
          <div className="p-3 bg-gray-50 dark:bg-zinc-800/80 rounded-xl border border-gray-200 dark:border-zinc-700 space-y-2 animate-in fade-in duration-150">
            <Label className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
              Select another brother to edit their Bigs/Littles:
            </Label>
            <Input
              type="text"
              value={personSearchQuery}
              onChange={(e) => setPersonSearchQuery(e.target.value)}
              placeholder="Search brother name or username..."
              className="text-xs h-8 bg-white dark:bg-zinc-900"
            />
            {matchingBrothers.length > 0 && (
              <div className="max-h-32 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-700/60 rounded-lg border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                {matchingBrothers.slice(0, 6).map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      if (onSelectDifferentPerson) onSelectDifferentPerson(b);
                      setIsSwitchingPerson(false);
                      setPersonSearchQuery('');
                    }}
                    className="w-full text-left p-2 text-xs hover:bg-gray-50 dark:hover:bg-zinc-800 flex items-center justify-between"
                  >
                    <span className="font-semibold text-gray-900 dark:text-white">{b.first_name} {b.last_name}</span>
                    <span className="text-[10px] text-gray-400 font-mono">@{b.username}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-start gap-2 text-xs text-red-700 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900 flex items-start gap-2 text-xs text-green-700 dark:text-green-300">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        {/* Bigs vs Littles Mode Selector */}
        <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => { setRelationMode('big'); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              relationMode === 'big'
                ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <GitFork className="h-4 w-4" />
            Big Brothers ({currentBigNodes.length})
          </button>
          <button
            type="button"
            onClick={() => { setRelationMode('little'); setError(null); }}
            className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              relationMode === 'little'
                ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-xs'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Users className="h-4 w-4" />
            Little Brothers ({currentLittleNodes.length})
          </button>
        </div>

        {/* Current Relationships List */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
              {relationMode === 'big'
                ? `Current Big(s) for ${targetNode.first_name}`
                : `Current Little(s) for ${targetNode.first_name}`}
            </Label>
            <span className="text-[11px] text-gray-400">
              {relationMode === 'big' ? 'Supports multiple Co-Bigs' : 'Supports multiple Littles'}
            </span>
          </div>

          {(relationMode === 'big' ? currentBigNodes : currentLittleNodes).length === 0 ? (
            <p className="text-xs text-gray-400 italic bg-gray-50 dark:bg-zinc-800/60 p-3 rounded-xl border border-dashed border-gray-200 dark:border-zinc-700 text-center">
              {relationMode === 'big'
                ? `No Big brothers linked yet for ${targetNode.first_name}.`
                : `No Little brothers linked yet for ${targetNode.first_name}.`}
            </p>
          ) : (
            <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
              {(relationMode === 'big' ? currentBigNodes : currentLittleNodes).map(rel => (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                      rel.is_alumni
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300'
                    }`}>
                      {rel.is_alumni ? 'Alumni' : 'Active'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">
                        {rel.first_name} {rel.last_name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        @{rel.username} {rel.pledge_sem ? `• ${rel.pledge_sem}` : ''}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => relationMode === 'big' ? handleRemoveBig(rel.id) : handleRemoveLittle(rel.id)}
                    disabled={isLoading}
                    className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    title={relationMode === 'big' ? 'Remove Big' : 'Remove Little'}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Relationship Form */}
        <div className="pt-3 border-t border-gray-100 dark:border-zinc-800 space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            {relationMode === 'big'
              ? `Add Another Big Brother for ${targetNode.first_name}`
              : `Add A Little Brother for ${targetNode.first_name}`}
          </Label>

          {/* Sub-tab: Active vs Alumni brother */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-zinc-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setSourceType('active'); setError(null); }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sourceType === 'active'
                  ? 'bg-white dark:bg-zinc-900 text-red-700 dark:text-red-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              Active Brother
            </button>
            <button
              type="button"
              onClick={() => { setSourceType('alumni'); setError(null); }}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                sourceType === 'alumni'
                  ? 'bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              Alumni Brother
            </button>
          </div>

          <form onSubmit={handleAddRelationship} className="space-y-3">
            {sourceType === 'active' ? (
              // Active Brother Search Selector
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search active brothers by name or username..."
                    className="pl-9 text-xs bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>

                {selectedActiveMember && (
                  <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-red-900 dark:text-red-200">Selected: {selectedActiveMember.name}</span>
                      <span className="text-red-700/70 dark:text-red-400 text-[11px] block">@{selectedActiveMember.username}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedActiveMember(null)}
                      className="h-6 px-2 text-[11px]"
                    >
                      Change
                    </Button>
                  </div>
                )}

                {searchQuery.trim().length > 0 && !selectedActiveMember && (
                  <div className="border border-gray-200 dark:border-zinc-700 rounded-xl max-h-36 overflow-y-auto divide-y divide-gray-100 dark:divide-zinc-800 bg-white dark:bg-zinc-800 shadow-xs">
                    {activeResults.length === 0 ? (
                      <p className="p-3 text-xs text-gray-400 text-center">No active brothers found matching &ldquo;{searchQuery}&rdquo;</p>
                    ) : (
                      activeResults
                        .filter(b => b.id !== targetNode.id)
                        .map(brother => (
                          <button
                            key={brother.id}
                            type="button"
                            onClick={() => {
                              setSelectedActiveMember(brother);
                              setSearchQuery('');
                            }}
                            className="w-full p-2.5 text-left text-xs hover:bg-gray-50 dark:hover:bg-zinc-700/60 flex items-center justify-between transition-colors"
                          >
                            <div>
                              <span className="font-bold text-gray-900 dark:text-white">{brother.name}</span>
                              <span className="text-[11px] text-gray-400 block">@{brother.username} {brother.pledge_class ? `• ${brother.pledge_class}` : ''}</span>
                            </div>
                            <Plus className="h-4 w-4 text-red-700 dark:text-red-400" />
                          </button>
                        ))
                    )}
                  </div>
                )}
              </div>
            ) : (
              // Alumni Form
              <div className="space-y-2.5 p-3 rounded-xl bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">First Name *</Label>
                    <Input
                      type="text"
                      value={alumniFirstName}
                      onChange={(e) => handleAlumniNameChange(e.target.value, alumniLastName)}
                      placeholder="e.g. John"
                      className="text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Last Name *</Label>
                    <Input
                      type="text"
                      value={alumniLastName}
                      onChange={(e) => handleAlumniNameChange(alumniFirstName, e.target.value)}
                      placeholder="e.g. Doe"
                      className="text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Unique Username *</Label>
                  <Input
                    type="text"
                    value={alumniUsername}
                    onChange={(e) => setAlumniUsername(e.target.value)}
                    placeholder="e.g. alum_johndoe"
                    className="text-xs font-mono bg-white dark:bg-zinc-800"
                  />
                  <p className="text-[10px] text-gray-400">Unique identifier for this alumni brother.</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Email (Optional)</Label>
                    <Input
                      type="email"
                      value={alumniEmail}
                      onChange={(e) => setAlumniEmail(e.target.value)}
                      placeholder="john@example.com"
                      className="text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">Pledge Class (Optional)</Label>
                    <Input
                      type="text"
                      value={alumniPledgeSem}
                      onChange={(e) => setAlumniPledgeSem(e.target.value)}
                      placeholder="e.g. Fall 2020"
                      className="text-xs bg-white dark:bg-zinc-800"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                className="text-xs h-8 px-3"
              >
                Close
              </Button>
              <Button
                type="submit"
                disabled={isLoading || (sourceType === 'active' && !selectedActiveMember) || (sourceType === 'alumni' && (!alumniFirstName || !alumniLastName || !alumniUsername))}
                className={`text-xs h-8 px-4 ${
                  sourceType === 'alumni'
                    ? 'bg-amber-700 hover:bg-amber-800 text-white'
                    : 'bg-red-700 hover:bg-red-800 text-white'
                } font-semibold`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Linking...
                  </>
                ) : (
                  relationMode === 'big' ? 'Add as Big' : 'Add as Little'
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
