import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNow, format } from 'date-fns';
import {
  ArrowLeft, Mail, Phone, Building2, Briefcase,
  Globe, MapPin, Edit2, Save, X, Plus, Loader2,
} from 'lucide-react';
import api from '../api/client';
import { Contact, Activity, ActivityType } from '../types';
import ActivityIcon from '../components/ActivityIcon';
import ContactStatusBadge from '../components/ContactStatusBadge';
import DealStageBadge from '../components/DealStageBadge';

const ACTIVITY_TYPES: ActivityType[] = ['EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK'];

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [activityForm, setActivityForm] = useState({ type: 'EMAIL' as ActivityType, subject: '', body: '' });

  const { data: contact, isLoading } = useQuery<Contact>({
    queryKey: ['contact', id],
    queryFn: () => api.get(`/api/contacts/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const updateMut = useMutation({
    mutationFn: (data: Partial<Contact>) => api.put(`/api/contacts/${id}`, data).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contact', id] }); setEditing(false); },
  });

  const activityMut = useMutation({
    mutationFn: (data: typeof activityForm) =>
      api.post('/api/activities', { ...data, contactId: id, completedAt: new Date().toISOString() }).then((r) => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['contact', id] }); setShowLogActivity(false); setActivityForm({ type: 'EMAIL', subject: '', body: '' }); },
  });

  if (isLoading || !contact) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
      </div>
    );
  }

  function startEdit() {
    setEditForm({ firstName: contact!.firstName, lastName: contact!.lastName, email: contact!.email, phone: contact!.phone, company: contact!.company, jobTitle: contact!.jobTitle, notes: contact!.notes });
    setEditing(true);
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <Link to="/contacts" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to contacts
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="w-14 h-14 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-bold text-xl">
              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
            </div>
            <button onClick={editing ? () => setEditing(false) : startEdit} className="btn-secondary text-xs px-2 py-1">
              {editing ? <X className="w-3.5 h-3.5" /> : <Edit2 className="w-3.5 h-3.5" />}
            </button>
          </div>

          {editing ? (
            <div className="space-y-2">
              {(['firstName', 'lastName', 'email', 'phone', 'company', 'jobTitle'] as const).map((f) => (
                <div key={f}>
                  <label className="label text-xs capitalize">{f.replace(/([A-Z])/g, ' $1')}</label>
                  <input className="input text-sm" value={(editForm[f] as string) ?? ''} onChange={(e) => setEditForm((p) => ({ ...p, [f]: e.target.value }))} />
                </div>
              ))}
              <button className="btn-primary w-full justify-center mt-3" onClick={() => updateMut.mutate(editForm)} disabled={updateMut.isPending}>
                {updateMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-lg font-bold text-gray-900">{contact.firstName} {contact.lastName}</h2>
              {contact.jobTitle && <p className="text-sm text-gray-500">{contact.jobTitle}</p>}
              <div className="mt-3"><ContactStatusBadge status={contact.status} /></div>
              <div className="mt-4 space-y-2 text-sm text-gray-600">
                {contact.company && <div className="flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400" />{contact.company}</div>}
                {contact.email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{contact.email}</div>}
                {contact.phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{contact.phone}</div>}
                {contact.website && <div className="flex items-center gap-2"><Globe className="w-4 h-4 text-gray-400" />{contact.website}</div>}
                {contact.address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-gray-400" />{contact.address}</div>}
              </div>
              {contact.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                  <p className="text-sm text-gray-700">{contact.notes}</p>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400">
                Added {format(new Date(contact.createdAt), 'MMM d, yyyy')}
              </div>
            </>
          )}
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Deals */}
          {contact.deals && contact.deals.length > 0 && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gray-400" /> Deals ({contact.deals.length})
              </h3>
              <div className="space-y-2">
                {contact.deals.map((d) => (
                  <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{d.title}</p>
                      <p className="text-xs text-gray-500">${d.value.toLocaleString()}</p>
                    </div>
                    <DealStageBadge stage={d.stage} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity timeline */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Activity History</h3>
              <button className="btn-secondary text-xs px-2 py-1" onClick={() => setShowLogActivity(true)}>
                <Plus className="w-3.5 h-3.5" /> Log
              </button>
            </div>

            {showLogActivity && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="label text-xs">Type</label>
                    <select className="input text-sm" value={activityForm.type} onChange={(e) => setActivityForm((p) => ({ ...p, type: e.target.value as ActivityType }))}>
                      {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs">Subject</label>
                    <input className="input text-sm" value={activityForm.subject} onChange={(e) => setActivityForm((p) => ({ ...p, subject: e.target.value }))} />
                  </div>
                  <div className="col-span-2">
                    <label className="label text-xs">Notes</label>
                    <textarea className="input text-sm resize-none" rows={2} value={activityForm.body} onChange={(e) => setActivityForm((p) => ({ ...p, body: e.target.value }))} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="btn-primary text-xs px-3 py-1.5" onClick={() => activityMut.mutate(activityForm)} disabled={activityMut.isPending || !activityForm.subject}>
                    {activityMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : null} Save
                  </button>
                  <button className="btn-secondary text-xs px-3 py-1.5" onClick={() => setShowLogActivity(false)}>Cancel</button>
                </div>
              </div>
            )}

            {contact.activities && contact.activities.length > 0 ? (
              <div className="space-y-4">
                {contact.activities.map((a: Activity) => (
                  <div key={a.id} className="flex gap-3">
                    <ActivityIcon type={a.type} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-gray-900">{a.subject}</p>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(a.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      {a.body && <p className="text-sm text-gray-600 mt-0.5">{a.body}</p>}
                      {a.outcome && <p className="text-xs text-gray-400 mt-0.5">Outcome: {a.outcome}</p>}
                      <p className="text-xs text-gray-400 mt-0.5">by {a.user?.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-6">No activities yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
