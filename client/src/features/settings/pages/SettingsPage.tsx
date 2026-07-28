import React, { useState, useEffect } from 'react';
import {
  useGetSystemSettingsQuery,
  useUpdateSystemSettingsMutation,
  useGetBranchesQuery,
  useCreateBranchMutation,
  useUpdateBranchMutation,
  useDeleteBranchMutation,
  type Branch,
} from '../../users/api/systemPeopleApi';
import { Button } from '../../../shared/ui/button';

interface BranchFormData {
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
}

const emptyBranchForm: BranchFormData = {
  name: '', code: '', address: '', city: '',
  state: '', pincode: '', phone: '', email: '',
};

export const SettingsPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'branches'>('company');

  // Queries
  const { data: settings, isLoading: isLoadingSettings } = useGetSystemSettingsQuery();
  const { data: branches, isLoading: isLoadingBranches } = useGetBranchesQuery();

  const [updateSettings, { isLoading: isSavingSettings }] = useUpdateSystemSettingsMutation();
  const [createBranch, { isLoading: isCreatingBranch }] = useCreateBranchMutation();
  const [updateBranch, { isLoading: isUpdatingBranch }] = useUpdateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  // Company settings states
  const [companyName, setCompanyName] = useState('');
  const [taxRate, setTaxRate] = useState('5');
  const [contactEmail, setContactEmail] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [companyAddress, setCompanyAddress] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync settings when loaded
  useEffect(() => {
    if (settings) {
      setCompanyName(settings.companyName ?? 'SuperBento Corp');
      setTaxRate(settings.taxRate ?? '5');
      setContactEmail(settings.contactEmail ?? 'info@superbento.com');
      setCurrency(settings.currency ?? 'INR');
      setCompanyAddress(settings.companyAddress ?? '123 Anna Salai, Chennai');
    }
  }, [settings]);

  // Branch modal states
  const [showBranchModal, setShowBranchModal] = useState(false);
  const [editTargetBranch, setEditTargetBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState<BranchFormData>(emptyBranchForm);
  const [branchError, setBranchError] = useState<string | null>(null);

  const handleSaveCompanySettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      await updateSettings({
        companyName,
        taxRate,
        contactEmail,
        currency,
        companyAddress,
      }).unwrap();
      setSaveStatus('Settings updated successfully!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Failed to save settings.');
    }
  };

  const openAddBranch = () => {
    setEditTargetBranch(null);
    setBranchForm(emptyBranchForm);
    setBranchError(null);
    setShowBranchModal(true);
  };

  const openEditBranch = (b: Branch) => {
    setEditTargetBranch(b);
    setBranchForm({
      name: b.name,
      code: b.code,
      address: b.address ?? '',
      city: b.city ?? '',
      state: b.state ?? '',
      pincode: b.pincode ?? '',
      phone: b.phone ?? '',
      email: b.email ?? '',
    });
    setBranchError(null);
    setShowBranchModal(true);
  };

  const handleBranchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBranchError(null);

    if (!branchForm.name.trim() || !branchForm.code.trim()) {
      setBranchError('Branch Name and Code are required.');
      return;
    }

    try {
      if (editTargetBranch) {
        await updateBranch({ id: editTargetBranch.id, ...branchForm }).unwrap();
      } else {
        await createBranch(branchForm).unwrap();
      }
      setShowBranchModal(false);
    } catch (err: any) {
      setBranchError(err?.data?.message || 'Failed to save branch.');
    }
  };

  const handleDeleteBranch = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    try {
      await deleteBranch(id).unwrap();
    } catch {
      alert('Failed to delete branch.');
    }
  };

  const isBranchBusy = isCreatingBranch || isUpdatingBranch;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">System Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure company preferences and operational branches</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b gap-4 text-sm">
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeSubTab === 'company'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveSubTab('company')}
        >
          Company Profile
        </button>
        <button
          className={`pb-2.5 font-medium transition-all ${
            activeSubTab === 'branches'
              ? 'border-b-2 border-primary text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          onClick={() => setActiveSubTab('branches')}
        >
          Branches & Hubs
        </button>
      </div>

      {/* ─── Company Settings ────────────────────────────────────────── */}
      {activeSubTab === 'company' && (
        <div className="bg-card border rounded-lg p-6 max-w-2xl shadow-sm">
          {isLoadingSettings ? (
            <p className="text-muted-foreground text-sm">Loading config...</p>
          ) : (
            <form onSubmit={handleSaveCompanySettings} className="space-y-4">
              {saveStatus && (
                <div className={`text-sm rounded-md px-4 py-2 border ${saveStatus.includes('success') ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-destructive/10 border-destructive/30 text-destructive'}`}>
                  {saveStatus}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Company Name</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contact Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Default Tax / GST Rate (%)</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={taxRate}
                    onChange={(e) => setTaxRate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Company Billing Address</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none resize-none"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                />
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={isSavingSettings}>
                  {isSavingSettings ? 'Saving...' : 'Save Settings'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ─── Branches CRUD ────────────────────────────────────────────── */}
      {activeSubTab === 'branches' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold">Branch Master List</h2>
            <Button size="sm" onClick={openAddBranch}>+ Add Operating Branch</Button>
          </div>

          <div className="bg-card border rounded-lg overflow-hidden">
            {isLoadingBranches ? (
              <div className="p-12 text-center text-muted-foreground">Loading branches...</div>
            ) : !branches || branches.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">No branches found.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Code</th>
                    <th className="px-6 py-3 font-medium">Contact</th>
                    <th className="px-6 py-3 font-medium">Location</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {branches.map((b) => (
                    <tr key={b.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-6 py-4 font-medium">{b.name}</td>
                      <td className="px-6 py-4 font-mono text-xs">{b.code}</td>
                      <td className="px-6 py-4">
                        {b.email && <p className="text-xs">{b.email}</p>}
                        {b.phone && <p className="text-[10px] text-muted-foreground font-mono">{b.phone}</p>}
                      </td>
                      <td className="px-6 py-4 text-xs text-muted-foreground">
                        {b.city ? `${b.city}, ${b.state}` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${b.isActive ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                          {b.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openEditBranch(b)}>Edit</Button>
                        {b.code !== 'HQ' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/20 hover:bg-destructive/10"
                            onClick={() => handleDeleteBranch(b.id)}
                          >
                            Delete
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Branch Form Modal */}
      {showBranchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editTargetBranch ? 'Edit Branch' : 'Add New Branch'}</h2>
              <button onClick={() => setShowBranchModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleBranchSubmit} className="space-y-4">
              {branchError && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{branchError}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Branch Name *</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Branch Code *</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none font-mono"
                    placeholder="e.g. VEL"
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    required
                    disabled={!!editTargetBranch}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Contact Phone</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={branchForm.phone}
                    onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Branch Email</label>
                  <input
                    type="email"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={branchForm.email}
                    onChange={(e) => setBranchForm({ ...branchForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Street Address</label>
                <input
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-xs font-medium">City</label>
                  <input
                    className="w-full px-2 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">State</label>
                  <input
                    className="w-full px-2 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                    value={branchForm.state}
                    onChange={(e) => setBranchForm({ ...branchForm, state: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium">Pincode</label>
                  <input
                    className="w-full px-2 py-1.5 bg-background border rounded-md text-xs focus:outline-none"
                    value={branchForm.pincode}
                    onChange={(e) => setBranchForm({ ...branchForm, pincode: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowBranchModal(false)} disabled={isBranchBusy}>Cancel</Button>
                <Button type="submit" disabled={isBranchBusy}>{isBranchBusy ? 'Saving...' : 'Save Branch'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default SettingsPage;
