import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, DollarSign, Loader2, GripVertical, ChevronDown } from 'lucide-react';
import api from '../api/client';
import { Deal, DealStage, Contact } from '../types';
import DealStageBadge from '../components/DealStageBadge';

const STAGES: DealStage[] = ['LEAD', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST'];

const STAGE_LABELS: Record<DealStage, string> = {
  LEAD: 'Lead', QUALIFIED: 'Qualified', PROPOSAL: 'Proposal',
  NEGOTIATION: 'Negotiation', CLOSED_WON: 'Closed Won', CLOSED_LOST: 'Closed Lost',
};

const STAGE_HEADER_COLORS: Record<DealStage, string> = {
  LEAD: 'bg-gray-100 text-gray-700',
  QUALIFIED: 'bg-blue-50 text-blue-700',
  PROPOSAL: 'bg-yellow-50 text-yellow-700',
  NEGOTIATION: 'bg-orange-50 text-orange-700',
  CLOSED_WON: 'bg-green-50 text-green-700',
  CLOSED_LOST: 'bg-red-50 text-red-700',
};

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

function DealCard({ deal, onStageChange }: { deal: Deal; onStageChange: (id: string, stage: DealStage) => void }) {
  const [showMove, setShowMove] = useState(false);
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-sm font-medium text-gray-900 leading-tight">{deal.title}</p>
        <GripVertical className="w-3.5 h-3.5 text-gray-300 flex-shrink-0 mt-0.5" />
      </div>
      {deal.contact && (
        <p className="text-xs text-gray-500 mb-2">
          {deal.contact.firstName} {deal.contact.lastName}
          {deal.contact.company ? ` · ${deal.contact.company}` : ''}
        </p>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
          <DollarSign className="w-3.5 h-3.5 text-gray-400" />
          {fmt(deal.value)}
        </div>
        <div className="relative">
          <button
            className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-700"
            onClick={() => setShowMove((v) => !v)}
          >
            Move <ChevronDown className="w-3 h-3" />
          </button>
          {showMove && (
            <div className="absolute right-0 top-6 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 min-w-36">
              {STAGES.filter((s) => s !== deal.stage).map((s) => (
                <button
                  key={s}
                  className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                  onClick={() => { onStageChange(deal.id, s); setShowMove(false); }}
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="mt-2 flex items-center gap-1">
        <div className="h-1 bg-gray-100 rounded-full flex-1">
          <div className="h-1 bg-primary-500 rounded-full" style={{ width: `${deal.probability}%` }} />
        </div>
        <span className="text-xs text-gray-400">{deal.probability}%</span>
      </div>
    </div>
  );
}

function CreateDealModal({ onClose, contacts }: { onClose: () => void; contacts: Contact[] }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ title: '', value: '', stage: 'LEAD' as DealStage, contactId: '', closeDate: '', notes: '' });
  const [error, setError] = useState('');

  const mut = useMutation({
    mutationFn: (data: typeof form) =>
      api.post('/api/deals', { ...data, value: parseFloat(data.value) || 0 }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['deals'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message ?? 'Error creating deal'),
  });

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold mb-4">New Deal</h2>
        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
        <div className="space-y-3">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Value ($)</label>
              <input className="input" type="number" value={form.value} onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))} />
            </div>
            <div>
              <label className="label">Stage</label>
              <select className="input" value={form.stage} onChange={(e) => setForm((p) => ({ ...p, stage: e.target.value as DealStage }))}>
                {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">Contact</label>
            <select className="input" value={form.contactId} onChange={(e) => setForm((p) => ({ ...p, contactId: e.target.value }))}>
              <option value="">Select contact...</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>{c.firstName} {c.lastName}{c.company ? ` (${c.company})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Close Date</label>
            <input className="input" type="date" value={form.closeDate} onChange={(e) => setForm((p) => ({ ...p, closeDate: e.target.value }))} />
          </div>
          <div>
            <label className="label">Notes</label>
            <textarea className="input resize-none" rows={2} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={() => mut.mutate(form)} disabled={mut.isPending || !form.title}>
            {mut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Create
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);

  const { data: deals = [], isLoading } = useQuery<Deal[]>({
    queryKey: ['deals'],
    queryFn: () => api.get('/api/deals').then((r) => r.data),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-all'],
    queryFn: () => api.get('/api/contacts', { params: { limit: 200 } }).then((r) => r.data.data as Contact[]),
  });

  const stageMut = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      api.patch(`/api/deals/${id}/stage`, { stage }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deals'] }),
  });

  const byStage = (stage: DealStage) => deals.filter((d) => d.stage === stage);
  const stageValue = (stage: DealStage) => byStage(stage).reduce((s, d) => s + d.value, 0);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pipeline</h1>
          <p className="text-sm text-gray-500 mt-1">{deals.length} deals</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4" /> New Deal
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
          {STAGES.map((stage) => (
            <div key={stage} className="flex-shrink-0 w-64 flex flex-col">
              <div className={`rounded-t-lg px-3 py-2.5 flex items-center justify-between ${STAGE_HEADER_COLORS[stage]}`}>
                <div>
                  <span className="text-xs font-semibold">{STAGE_LABELS[stage]}</span>
                  <span className="ml-2 text-xs opacity-70">{byStage(stage).length}</span>
                </div>
                <span className="text-xs font-medium">{fmt(stageValue(stage))}</span>
              </div>
              <div className="bg-gray-50 border border-t-0 border-gray-200 rounded-b-lg p-2 flex-1 space-y-2 min-h-48">
                {byStage(stage).map((deal) => (
                  <DealCard
                    key={deal.id}
                    deal={deal}
                    onStageChange={(id, s) => stageMut.mutate({ id, stage: s })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateDealModal onClose={() => setShowCreate(false)} contacts={contactsData ?? []} />}
    </div>
  );
}
