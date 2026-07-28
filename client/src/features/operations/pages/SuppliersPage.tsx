import React, { useState } from 'react';
import {
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useDeleteSupplierMutation,
  type Supplier,
} from '../api/operationsApi';
import { Button } from '../../../shared/ui/button';

interface FormData {
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  gstin: string;
  isActive: boolean;
}

const emptyForm: FormData = {
  name: '', contactPerson: '', phone: '',
  email: '', address: '', gstin: '', isActive: true,
};

export const SuppliersPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const { data: suppliers, isLoading } = useGetSuppliersQuery({ search: search || undefined });
  const [createSupplier, { isLoading: isCreating }] = useCreateSupplierMutation();
  const [updateSupplier, { isLoading: isUpdating }] = useUpdateSupplierMutation();
  const [deleteSupplier] = useDeleteSupplierMutation();

  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Supplier | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [error, setError] = useState<string | null>(null);

  const openAdd = () => { setEditTarget(null); setForm(emptyForm); setError(null); setShowModal(true); };
  const openEdit = (s: Supplier) => {
    setEditTarget(s);
    setForm({ name: s.name, contactPerson: s.contactPerson ?? '', phone: s.phone ?? '', email: s.email ?? '', address: s.address ?? '', gstin: s.gstin ?? '', isActive: s.isActive });
    setError(null);
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditTarget(null); setForm(emptyForm); setError(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim()) { setError('Supplier name is required.'); return; }
    const payload = {
      name: form.name.trim(),
      contactPerson: form.contactPerson.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      address: form.address.trim() || undefined,
      gstin: form.gstin.trim() || undefined,
      isActive: form.isActive,
    };
    try {
      if (editTarget) { await updateSupplier({ id: editTarget.id, ...payload }).unwrap(); }
      else { await createSupplier(payload).unwrap(); }
      closeModal();
    } catch { setError('Failed to save supplier. Please try again.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;
    await deleteSupplier(id);
  };

  const isBusy = isCreating || isUpdating;
  const list = (suppliers ?? []) as Supplier[];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suppliers</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your vendor master list</p>
        </div>
        <Button onClick={openAdd}>+ Add Supplier</Button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-3">
        <input
          className="w-full max-w-sm px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          placeholder="Search by name, contact, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <Button variant="outline" size="sm" onClick={() => setSearch('')}>Clear</Button>
        )}
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-4xl mb-3">🏭</div>Loading suppliers...
          </div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <div className="text-5xl mb-3">🤝</div>
            <p className="font-medium">{search ? 'No suppliers match your search' : 'No suppliers yet'}</p>
            {!search && <Button className="mt-4" onClick={openAdd}>Add Supplier</Button>}
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground border-b">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Contact</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">GSTIN</th>
                <th className="px-6 py-3 font-medium">Status</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((s) => (
                <tr key={s.id} className="hover:bg-muted/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium">{s.name}</p>
                    {s.email && <p className="text-xs text-muted-foreground mt-0.5">{s.email}</p>}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{s.contactPerson ?? '—'}</td>
                  <td className="px-6 py-4 text-muted-foreground">{s.phone ?? '—'}</td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">{s.gstin ?? '—'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${s.isActive ? 'bg-green-500/15 text-green-600 border-green-500/30' : 'bg-muted text-muted-foreground border-border'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(s.id)}>Delete</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card border rounded-xl shadow-2xl w-full max-w-lg mx-4 p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{editTarget ? 'Edit Supplier' : 'Add New Supplier'}</h2>
              <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="bg-destructive/10 border border-destructive/30 text-destructive text-sm rounded-md px-4 py-2">{error}</div>}

              {[
                { label: 'Supplier Name *', key: 'name', placeholder: 'e.g. AgroFresh Farms' },
                { label: 'Contact Person', key: 'contactPerson', placeholder: 'e.g. Rajan Krishnamurthy' },
                { label: 'Phone', key: 'phone', placeholder: 'e.g. +919876543210' },
                { label: 'Email', key: 'email', placeholder: 'e.g. orders@supplier.com' },
                { label: 'GSTIN', key: 'gstin', placeholder: 'e.g. 33ABCDE1234F1Z5' },
              ].map(({ label, key, placeholder }) => (
                <div key={key} className="space-y-1">
                  <label className="text-sm font-medium">{label}</label>
                  <input
                    className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder={placeholder}
                    value={(form as any)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    disabled={isBusy}
                  />
                </div>
              ))}

              <div className="space-y-1">
                <label className="text-sm font-medium">Address</label>
                <textarea
                  rows={2}
                  className="w-full px-3 py-2 bg-background border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                  placeholder="Full address"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  disabled={isBusy}
                />
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} disabled={isBusy} />
                <label htmlFor="isActive" className="text-sm">Active supplier</label>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={closeModal} disabled={isBusy}>Cancel</Button>
                <Button type="submit" disabled={isBusy}>{isBusy ? 'Saving...' : editTarget ? 'Save Changes' : 'Add Supplier'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
