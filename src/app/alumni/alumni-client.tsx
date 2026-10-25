'use client'

import React, { useState, useMemo } from 'react';
import { AlumniRecord, createAlumniAction, updateAlumniAction, deleteAlumniAction } from '@/app/alumni/actions';
import { Search, GraduationCap, Plus, Download, Mail, Linkedin, MapPin, Trash2, Edit2, ArrowLeft, Loader2, AlertCircle, GitFork } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import LoadingLink from '@/components/ui/loading-link';
import { useRouter } from 'next/navigation';

interface AlumniClientProps {
  initialAlumni: AlumniRecord[];
  isOfficer: boolean;
}

export default function AlumniClient({ initialAlumni, isOfficer }: AlumniClientProps) {
  const [alumniList, setAlumniList] = useState<AlumniRecord[]>(initialAlumni);
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlumni, setEditingAlumni] = useState<AlumniRecord | null>(null);

  // Form states
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [formStatus, setFormStatus] = useState('ALUMNI');
  const [formEmail, setFormEmail] = useState('');
  const [formLinkedin, setFormLinkedin] = useState('');
  const [formGradYear, setFormGradYear] = useState('');
  const [formPledgeSem, setFormPledgeSem] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();

  // Distinct grad years for filter
  const gradYears = useMemo(() => {
    const years = new Set<number>();
    for (const a of alumniList) {
      if (a.grad_year) years.add(a.grad_year);
    }
    return Array.from(years).sort((a, b) => b - a);
  }, [alumniList]);

  // Filtered alumni list
  const filteredAlumni = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return alumniList.filter(a => {
      const name = `${a.first_name} ${a.last_name}`.toLowerCase();
      const matchesSearch = !term ||
        name.includes(term) ||
        (a.email || '').toLowerCase().includes(term) ||
        (a.pledge_sem || '').toLowerCase().includes(term) ||
        (a.id || '').toLowerCase().includes(term) ||
        (a.address || '').toLowerCase().includes(term);

      const matchesYear = yearFilter === 'all' || String(a.grad_year) === yearFilter;

      return matchesSearch && matchesYear;
    });
  }, [alumniList, searchTerm, yearFilter]);

  const handleOpenCreate = () => {
    setEditingAlumni(null);
    setFormFirstName('');
    setFormLastName('');
    setFormStatus('ALUMNI');
    setFormEmail('');
    setFormLinkedin('');
    setFormGradYear('');
    setFormPledgeSem('');
    setFormAddress('');
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (record: AlumniRecord) => {
    setEditingAlumni(record);
    setFormFirstName(record.first_name);
    setFormLastName(record.last_name);
    setFormStatus(record.status || 'ALUMNI');
    setFormEmail(record.email || '');
    setFormLinkedin(record.linkedin || '');
    setFormGradYear(record.grad_year ? String(record.grad_year) : '');
    setFormPledgeSem(record.pledge_sem || '');
    setFormAddress(record.address || '');
    setError(null);
    setIsModalOpen(true);
  };

  const handleSaveAlumni = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formFirstName.trim() || !formLastName.trim()) {
      setError('First and Last name are required.');
      return;
    }
    if (!formStatus.trim()) {
      setError('Status is required.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (editingAlumni) {
        const res = await updateAlumniAction(editingAlumni.id, {
          first_name: formFirstName.trim(),
          last_name: formLastName.trim(),
          status: formStatus.trim().toUpperCase(),
          email: formEmail.trim() || null,
          linkedin: formLinkedin.trim() || null,
          grad_year: formGradYear ? parseInt(formGradYear, 10) : null,
          pledge_sem: formPledgeSem.trim() || null,
          address: formAddress.trim() || null,
        });

        if (!res.success) {
          setError(res.error || 'Failed to update alumni.');
          return;
        }

        setAlumniList(prev => prev.map(a => a.id === editingAlumni.id ? {
          ...a,
          first_name: formFirstName.trim(),
          last_name: formLastName.trim(),
          status: formStatus.trim().toUpperCase(),
          email: formEmail.trim() || null,
          linkedin: formLinkedin.trim() || null,
          grad_year: formGradYear ? parseInt(formGradYear, 10) : null,
          pledge_sem: formPledgeSem.trim() || null,
          address: formAddress.trim() || null,
        } : a));
      } else {
        const res = await createAlumniAction({
          first_name: formFirstName.trim(),
          last_name: formLastName.trim(),
          status: formStatus.trim().toUpperCase(),
          email: formEmail.trim() || undefined,
          linkedin: formLinkedin.trim() || undefined,
          grad_year: formGradYear ? parseInt(formGradYear, 10) : undefined,
          pledge_sem: formPledgeSem.trim() || undefined,
          address: formAddress.trim() || undefined,
        });

        if (!res.success || !res.id) {
          setError(res.error || 'Failed to create alumni.');
          return;
        }

        const newRecord: AlumniRecord = {
          id: res.id,
          first_name: formFirstName.trim(),
          last_name: formLastName.trim(),
          status: formStatus.trim().toUpperCase(),
          email: formEmail.trim() || null,
          linkedin: formLinkedin.trim() || null,
          grad_year: formGradYear ? parseInt(formGradYear, 10) : null,
          pledge_sem: formPledgeSem.trim() || null,
          address: formAddress.trim() || null,
        };
        setAlumniList(prev => [newRecord, ...prev]);
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete alumni record for ${name}?`)) return;

    try {
      const res = await deleteAlumniAction(id);
      if (res.success) {
        setAlumniList(prev => prev.filter(a => a.id !== id));
        router.refresh();
      } else {
        alert(res.error || 'Failed to delete record.');
      }
    } catch {
      alert('Delete failed.');
    }
  };

  // Export filtered alumni to CSV
  const handleExportCSV = () => {
    const headers = ['Alumni ID', 'First Name', 'Last Name', 'Status', 'Email', 'LinkedIn', 'Grad Year', 'Pledge Sem', 'Address'];
    const rows = filteredAlumni.map(a => [
      `"${a.id}"`,
      `"${a.first_name}"`,
      `"${a.last_name}"`,
      `"${a.status}"`,
      `"${a.email || ''}"`,
      `"${a.linkedin || ''}"`,
      `"${a.grad_year || ''}"`,
      `"${a.pledge_sem || ''}"`,
      `"${(a.address || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `theta_tau_alumni_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-black text-gray-900 dark:text-white pb-20">
      {/* Header */}
      <div className="border-b border-gray-200/60 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/members-only"
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                  <GraduationCap className="h-4 w-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Alumni Database &amp; Directory
                </h1>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Xi Chapter Graduated Brothers ({alumniList.length} recorded)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <LoadingLink
              href="/family-tree"
              className="h-9 px-3 text-xs rounded-xl bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-gray-200 font-semibold flex items-center gap-1.5 transition-colors border border-gray-200 dark:border-zinc-700"
            >
              <GitFork className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
              <span>Family Tree</span>
            </LoadingLink>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="h-9 px-3 text-xs border-gray-200 dark:border-zinc-700 flex items-center gap-1.5"
            >
              <Download className="h-3.5 w-3.5 text-gray-600 dark:text-gray-400" />
              <span>Export CSV</span>
            </Button>

            {isOfficer && (
              <Button
                type="button"
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 px-3.5 bg-amber-700 hover:bg-amber-800 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Add Alumni</span>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-4">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, pledge semester, location..."
              className="pl-10 text-xs bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 h-9 rounded-xl"
            />
          </div>

          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500 whitespace-nowrap">Grad Year:</Label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="h-9 px-3 text-xs rounded-xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Years</option>
              {gradYears.map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Alumni Records List / Grid */}
        {filteredAlumni.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-gray-200 dark:border-zinc-800 p-12 text-center text-gray-400 space-y-2">
            <GraduationCap className="h-10 w-10 mx-auto text-gray-300 dark:text-zinc-700" />
            <p className="text-sm font-semibold">No alumni records found</p>
            <p className="text-xs">Try adjusting your search criteria or add a new alumni record.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAlumni.map(alumni => (
              <div
                key={alumni.id}
                className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="font-bold text-base text-gray-900 dark:text-white">
                        {alumni.first_name} {alumni.last_name}
                      </h3>
                      <span className="font-mono text-[10px] text-gray-400 block truncate max-w-[200px]">
                        {alumni.id}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 uppercase">
                      {alumni.status || 'ALUMNI'}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                    {alumni.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <a href={`mailto:${alumni.email}`} className="text-red-700 dark:text-red-400 hover:underline truncate">
                          {alumni.email}
                        </a>
                      </div>
                    )}

                    {alumni.linkedin && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Linkedin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <a href={alumni.linkedin.startsWith('http') ? alumni.linkedin : `https://${alumni.linkedin}`} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline truncate">
                          LinkedIn Profile
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {alumni.pledge_sem && (
                        <span>Pledge: <strong>{alumni.pledge_sem}</strong></span>
                      )}
                      {alumni.grad_year && (
                        <span>Class: <strong>{alumni.grad_year}</strong></span>
                      )}
                    </div>

                    {alumni.address && (
                      <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-0.5 truncate">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{alumni.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isOfficer && (
                  <div className="flex items-center justify-end gap-1 pt-4 mt-4 border-t border-gray-100 dark:border-zinc-800">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenEdit(alumni)}
                      className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300"
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(alumni.id, `${alumni.first_name} ${alumni.last_name}`)}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/40"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Alumni Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => !isLoading && setIsModalOpen(open)}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-white">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-amber-600" />
              {editingAlumni ? 'Edit Alumni Record' : 'Add New Alumni Record'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
              First name, Last name, and Status are required.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-700 dark:text-red-400 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSaveAlumni} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">First Name *</Label>
                <Input
                  type="text"
                  value={formFirstName}
                  onChange={(e) => setFormFirstName(e.target.value)}
                  placeholder="e.g. John"
                  className="text-xs bg-gray-50 dark:bg-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Last Name *</Label>
                <Input
                  type="text"
                  value={formLastName}
                  onChange={(e) => setFormLastName(e.target.value)}
                  placeholder="e.g. Doe"
                  className="text-xs bg-gray-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Status *</Label>
              <Input
                type="text"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
                placeholder="ALUMNI"
                className="text-xs uppercase bg-gray-50 dark:bg-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Email (Optional)</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="john@example.com"
                className="text-xs bg-gray-50 dark:bg-zinc-800"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">LinkedIn URL (Optional)</Label>
              <Input
                type="text"
                value={formLinkedin}
                onChange={(e) => setFormLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="text-xs bg-gray-50 dark:bg-zinc-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Grad Year</Label>
                <Input
                  type="number"
                  value={formGradYear}
                  onChange={(e) => setFormGradYear(e.target.value)}
                  placeholder="e.g. 2024"
                  className="text-xs bg-gray-50 dark:bg-zinc-800"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Pledge Sem</Label>
                <Input
                  type="text"
                  value={formPledgeSem}
                  onChange={(e) => setFormPledgeSem(e.target.value)}
                  placeholder="e.g. Fall 2020"
                  className="text-xs bg-gray-50 dark:bg-zinc-800"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-700 dark:text-gray-300">Mailing / City Address</Label>
              <Input
                type="text"
                value={formAddress}
                onChange={(e) => setFormAddress(e.target.value)}
                placeholder="Madison, WI"
                className="text-xs bg-gray-50 dark:bg-zinc-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-zinc-800">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsModalOpen(false)}
                className="text-xs h-8 px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="text-xs h-8 px-4 bg-amber-700 hover:bg-amber-800 text-white font-semibold"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                    Saving...
                  </>
                ) : (
                  'Save Alumni Record'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
