import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight, Building2, Mail, Phone, Loader2 } from 'lucide-react';
import api from '../api/client';
import { Contact, ContactStatus, PaginatedResponse } from '../types';
import ContactStatusBadge from '../components/ContactStatusBadge';

const STATUSES: ContactStatus[] = ['LEAD', 'PROSPECT', 'CUSTOMER', 'CHURNED'];

function CreateContactModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', company: '', jobTitle: '', status: 'LEAD' as ContactStatus });
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/contacts', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contacts'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error creating contact'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">New Contact</h2>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          {(['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle'] as const).map((f) => (
            <div key={f} className={f === 'email' || f === 'company' ? 'col-span-2' : ''}>
              <label className="label capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
              <input
                className="input"
                value={form[f]}
                onChange={(e) => setForm((p) => ({ ...p, [f]: e.target.value }))}
                type={f === 'email' ? 'email' : 'text'}
              />
            </div>
          ))}
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as ContactStatus }))}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending || !form.firstName || !form.lastName}>
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery<PaginatedResponse<Contact>>({
    queryKey: ['contacts', search, statusFilter],
    queryFn: () =>
      api.get('/api/contacts', { params: { search: search || undefined, status: statusFilter || undefined, limit: 50 } })
        .then((r) => r.data),
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Contact
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search contacts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input w-36" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Company', 'Contact', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data?.data.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-xs">
                        {c.firstName.charAt(0)}{c.lastName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.firstName} {c.lastName}</p>
                        {c.jobTitle && <p className="text-xs text-gray-500">{c.jobTitle}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {c.company && (
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {c.company}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500 space-y-0.5">
                    {c.email && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Mail className="w-3 h-3" /> {c.email}
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <Phone className="w-3 h-3" /> {c.phone}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <ContactStatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/contacts/${c.id}`} className="text-primary-600 hover:text-primary-800">
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && <CreateContactModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
