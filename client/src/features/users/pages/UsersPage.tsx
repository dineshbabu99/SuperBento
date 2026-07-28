import React, { useState } from 'react';
import {
  useGetUsersQuery,
  useCreateUserMutation,
  useActivateUserMutation,
  useDeactivateUserMutation,
  useAssignUserRoleMutation,
  type User,
} from '../api/systemPeopleApi';
import { useGetRolesQuery, useGetBranchesQuery } from '../api/systemPeopleApi';
import { Button } from '../../../shared/ui/button';

interface OnboardFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password?: string;
  roleId: string;
  branchId: string;
}

const emptyOnboardForm: OnboardFormData = {
  email: '',
  firstName: '',
  lastName: '',
  phoneNumber: '',
  password: 'SuperBentoPassword@2026',
  roleId: '',
  branchId: '',
};

export const UsersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [roleIdFilter, setRoleIdFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data: usersResponse, isLoading } = useGetUsersQuery({
    search: search || undefined,
    roleId: roleIdFilter === 'ALL' ? undefined : roleIdFilter,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    page,
  });

  const { data: roles } = useGetRolesQuery();
  const { data: branches } = useGetBranchesQuery();

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [activateUser] = useActivateUserMutation();
  const [deactivateUser] = useDeactivateUserMutation();
  const [assignUserRole] = useAssignUserRoleMutation();

  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [form, setForm] = useState<OnboardFormData>(emptyOnboardForm);
  const [error, setError] = useState<string | null>(null);

  // Quick action: Change user role modal state
  const [roleTargetUser, setRoleTargetUser] = useState<User | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState('');

  const users = usersResponse?.data ?? [];
  const total = usersResponse?.total ?? 0;

  const handleOpenOnboard = () => {
    setError(null);
    setForm({
      ...emptyOnboardForm,
      roleId: roles?.[0]?.id ?? '',
      branchId: branches?.[0]?.id ?? '',
    });
    setShowOnboardModal(true);
  };

  const handleOnboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!form.email.trim() || !form.firstName.trim() || !form.lastName.trim()) {
      setError('Please fill in email, first name, and last name.');
      return;
    }

    try {
      await createUser({
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber.trim() || undefined,
        password: form.password,
        roleId: form.roleId,
        branchId: form.branchId || undefined,
      }).unwrap();
      setShowOnboardModal(false);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to onboard user.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      if (user.status === 'ACTIVE') {
        await deactivateUser(user.id).unwrap();
      } else {
        await activateUser(user.id).unwrap();
      }
    } catch {
      alert('Failed to toggle user account status.');
    }
  };

  const handleOpenRoleChange = (user: User) => {
    setRoleTargetUser(user);
    setSelectedRoleId(user.roleId);
  };

  const handleSaveRoleChange = async () => {
    if (!roleTargetUser) return;
    try {
      await assignUserRole({ id: roleTargetUser.id, roleId: selectedRoleId }).unwrap();
      setRoleTargetUser(null);
    } catch {
      alert('Failed to update user role.');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users & Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage user directories, roles, and branch assignments</p>
        </div>
        <Button onClick={handleOpenOnboard}>+ Onboard Staff</Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="w-full max-w-xs px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />

        <select
          className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none"
          value={roleIdFilter}
          onChange={(e) => { setRoleIdFilter(e.target.value); setPage(1); }}
        >
          <option value="ALL">All Roles</option>
          {roles?.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>

        <select
          className="px-3 py-1.5 bg-background border rounded-md text-sm focus:outline-none"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">Loading directory...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">No users found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Role</th>
                <th className="px-6 py-3 font-medium">Branch</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4 font-medium">{u.firstName} {u.lastName}</td>
                  <td className="px-6 py-4 text-muted-foreground">{u.email}</td>
                  <td className="px-6 py-4">
                    <span className="font-semibold text-xs text-primary">{u.role?.name ?? '—'}</span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{u.branch?.name ?? 'HQ'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${u.status === 'ACTIVE' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-muted text-muted-foreground border-border'}`}>
                      {u.status === 'ACTIVE' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenRoleChange(u)}>Change Role</Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={u.status === 'ACTIVE' ? 'text-destructive border-destructive/20 hover:bg-destructive/10' : 'text-green-600 border-green-500/20 hover:bg-green-500/10'}
                      onClick={() => handleToggleStatus(u)}
                    >
                      {u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Onboard Staff Modal */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Onboard Staff User</h2>
              <button onClick={() => setShowOnboardModal(false)} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleOnboardSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">First Name *</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Last Name *</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Email Address *</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Phone Number</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    placeholder="e.g. +919988776655"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Initial Password</label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Assign System Role</label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={form.roleId}
                    onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                  >
                    {roles?.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Operating Branch</label>
                  <select
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                    value={form.branchId}
                    onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                  >
                    <option value="">Central HQ</option>
                    {branches?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowOnboardModal(false)} disabled={isCreating}>Cancel</Button>
                <Button type="submit" disabled={isCreating}>{isCreating ? 'Onboarding...' : 'Onboard Staff'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Role Dialog */}
      {roleTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6 space-y-4">
            <h3 className="font-semibold text-base">Assign Role: {roleTargetUser.firstName}</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">Select Role</label>
                <select
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none"
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                >
                  {roles?.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setRoleTargetUser(null)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveRoleChange}>Save Role</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default UsersPage;
