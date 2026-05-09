import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Plus, Filter, Loader2, Trash2 } from 'lucide-react';
import api from '../api/client';
import { Activity, ActivityType, Contact, Deal, PaginatedResponse } from '../types';
import ActivityIcon from '../components/ActivityIcon';

const TYPES: ActivityType[] = ['EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK'];

function LogActivityModal({ onClose, contacts, deals }: { onClose: () => void; contacts: Contact[]; deals: Deal[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    type: 'EMAIL' as ActivityType,
    subject: '',
    body: '',
    outcome: '',
    contactId: '',
    dealId: '',
    completedAt: new Date().toISOString().slice(0, 16),
  });
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: (data: typeof form) => api.post('/api/activities', data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activities'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error logging activity'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Log Activity</h2>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as ActivityType }))}>
                {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input className="input" type="datetime-local" value={form.completedAt} onChange={(e) => setForm((p) => ({ ...p, completedAt: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Subject</label>
            <input className="input" value={form.subject} onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={3} value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} />
          </div>
          <div>
            <label className="label">Outcome</label>
            <input className="input" value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Contact</label>
              <select className="input" value={form.contactId} onChange={(e) => setForm((p) => ({ ...p, contactId: e.target.value }))}>
                <option value="">Select...</option>
                {contacts.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Deal</label>
              <select className="input" value={form.dealId} onChange={(e) => setForm((p) => ({ ...p, dealId: e.target.value }))}>
                <option value="">Select...</option>
                {deals.map((d) => <option key={d.id} value={d.id}>{d.title}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending || !form.subject}>
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Log Activity
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const qc = useQueryClient();
  const [typeFilter, setTypeFilter] = useState('');
  const [showLog, setShowLog] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery<PaginatedResponse<Activity>>({
    queryKey: ['activities', typeFilter, page],
    queryFn: () =>
      api.get('/api/activities', { params: { type: typeFilter || undefined, page, limit: 20 } }).then((r) => r.data),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => api.get('/api/contacts', { params: { limit: 200 } }).then((r) => r.data.data as Contact[]),
  });

  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then((r) => r.data as Deal[]),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/api/activities/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activities'] }),
  });

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activities</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total ?? 0} total</p>
        </div>
        <button className="btn-primary" onClick={() => setShowLog(true)}>
          <Plus className="w-4 h-4" /> Log Activity
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Type:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            className={`badge cursor-pointer ${!typeFilter ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            onClick={() => setTypeFilter('')}
          >
            All
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              className={`badge cursor-pointer ${typeFilter === t ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              onClick={() => setTypeFilter(t)}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="card divide-y divide-gray-100">
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary-600" /></div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No activities found</div>
        ) : (
          data?.data.map((a) => (
            <div key={a.id} className="flex gap-4 p-4 hover:bg-gray-50 group">
              <ActivityIcon type={a.type} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-400">
                      {a.completedAt ? format(new Date(a.completedAt), 'MMM d, yyyy') : format(new Date(a.createdAt), 'MMM d, yyyy')}
                    </span>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all"
                      onClick={() => deleteMut.mutate(a.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {a.body && <p className="text-sm text-gray-600 mt-0.5">{a.body}</p>}
                {a.outcome && <p className="text-xs text-gray-400 mt-1">Outcome: {a.outcome}</p>}
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                  {a.contact && <span>{a.contact.firstName} {a.contact.lastName}{a.contact.company ? ` · ${a.contact.company}` : ''}</span>}
                  {a.deal && <span>📋 {a.deal.title}</span>}
                  {a.user && <span>by {a.user.name}</span>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-5">
          <button className="btn-secondary text-xs px-3 py-1.5" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
          <span className="text-sm text-gray-500 flex items-center">{page} / {totalPages}</span>
          <button className="btn-secondary text-xs px-3 py-1.5" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
        </div>
      )}

      {showLog && <LogActivityModal onClose={() => setShowLog(false)} contacts={contactsData ?? []} deals={dealsData ?? []} />}
    </div>
  );
}
