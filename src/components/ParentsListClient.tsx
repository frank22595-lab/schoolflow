'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Search, Filter, Download, Upload, X,
  Phone, Mail, MessageCircle, Sparkles, Grid3x3, List,
  KeyRound, User, Copy, CheckCircle2,
} from 'lucide-react';

interface Parent {
  id: string;
  title?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  primary_phone: string;
  alternate_phone?: string;
  whatsapp_number?: string;
  email?: string;
  occupation?: string;
  employer?: string;
  city?: string;
  state?: string;
  access_code: string;
  photo_url?: string;
}

interface Link {
  parent_id: string;
  student_id: string;
  relationship: string;
  is_primary_contact: boolean;
  students?: any;
}

interface Props {
  schoolId: string;
  initialParents: Parent[];
  links: Link[];
}

export default function ParentsListClient({ schoolId, initialParents, links }: Props) {
  const [parents] = useState(initialParents);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!search) return parents;
    const q = search.toLowerCase();
    return parents.filter(p => {
      const full = `${p.first_name} ${p.middle_name || ''} ${p.last_name}`.toLowerCase();
      return full.includes(q) ||
        (p.primary_phone && p.primary_phone.includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.access_code && p.access_code.toLowerCase().includes(q));
    });
  }, [parents, search]);

  const childrenByParent = useMemo(() => {
    const map: Record<string, any[]> = {};
    links.forEach(l => {
      if (!map[l.parent_id]) map[l.parent_id] = [];
      map[l.parent_id].push(l);
    });
    return map;
  }, [links]);

  async function copyCode(code: string) {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Parents</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Parents & Guardians</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {parents.length === 0 ? 'No parents yet. Add your first guardian below.' :
                `${parents.length} parent${parents.length !== 1 ? 's' : ''} · ${links.length} link${links.length !== 1 ? 's' : ''} to students`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary text-sm"><Upload className="w-4 h-4 mr-1.5" />Import</button>
            <button className="btn-secondary text-sm"><Download className="w-4 h-4 mr-1.5" />Export</button>
            <Link href="/dashboard/parents/new" className="btn-primary text-sm">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add parent
            </Link>
          </div>
        </div>
      </div>

      {parents.length === 0 ? (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 lg:p-8">
          <div className="max-w-lg">
            <div className="w-12 h-12 bg-indigo rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let's add your first parent</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Parents can be linked to one or more students. Each parent gets a unique access code to log into the parent portal (coming soon).
            </p>
            <Link href="/dashboard/parents/new" className="btn-primary text-sm">
              <UserPlus className="w-4 h-4 mr-2" />
              Add first parent
            </Link>
          </div>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-3 lg:p-4 flex gap-2">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by name, phone, email, or access code..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
                value={search} onChange={(e) => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
              <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
                <List className="w-4 h-4 text-gray-600" />
              </button>
              <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                <Grid3x3 className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <p className="text-xs text-gray-500 px-1">Showing <strong>{filtered.length}</strong> of {parents.length}</p>

          {view === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Parent</div>
                <div className="col-span-3">Contact</div>
                <div className="col-span-3">Children</div>
                <div className="col-span-2">Access code</div>
              </div>
              <div className="divide-y divide-gray-100">
                {filtered.map(p => {
                  const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
                  const children = childrenByParent[p.id] || [];
                  return (
                    <div key={p.id} className="p-3 lg:p-4 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
                          {p.photo_url ? <img src={p.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                        </div>
                        <div className="min-w-0">
                          <Link href={`/dashboard/parents/${p.id}`} className="font-medium text-sm text-gray-900 hover:text-indigo transition-colors truncate block">
                            {p.title && `${p.title} `}{p.first_name} {p.middle_name && p.middle_name[0] + '.'} {p.last_name}
                          </Link>
                          <div className="text-[11px] text-gray-500 truncate">{p.occupation || '—'}</div>
                        </div>
                      </div>
                      <div className="col-span-3 hidden sm:flex flex-col text-[11px] text-gray-600 truncate min-w-0">
                        {p.primary_phone && <span className="flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{p.primary_phone}</span>}
                        {p.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{p.email}</span>}
                      </div>
                      <div className="col-span-3 hidden sm:block">
                        {children.length === 0 ? (
                          <span className="text-[11px] text-gray-400 italic">No children linked</span>
                        ) : (
                          <div className="space-y-0.5">
                            {children.slice(0, 2).map((l, i) => (
                              <div key={i} className="text-[11px] text-gray-700 truncate">
                                {l.students?.first_name} {l.students?.last_name} <span className="text-gray-400">({l.relationship})</span>
                              </div>
                            ))}
                            {children.length > 2 && (
                              <div className="text-[11px] text-indigo font-medium">+{children.length - 2} more</div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-1">
                        <button
                          onClick={() => copyCode(p.access_code)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo text-[10px] font-mono font-bold rounded hover:bg-indigo-100"
                          title="Click to copy"
                        >
                          {p.access_code}
                          {copiedCode === p.access_code ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="p-12 text-center">
                    <p className="text-sm text-gray-500">No parents match your search</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {filtered.map(p => {
                const initials = `${p.first_name[0]}${p.last_name[0]}`.toUpperCase();
                const children = childrenByParent[p.id] || [];
                return (
                  <Link key={p.id} href={`/dashboard/parents/${p.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-semibold shadow-sm mb-3">
                        {p.photo_url ? <img src={p.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate w-full">
                        {p.title && `${p.title} `}{p.first_name} {p.last_name}
                      </div>
                      <div className="text-[10px] text-gray-500 mt-0.5 truncate w-full">{p.primary_phone}</div>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo text-[10px] font-semibold rounded-full">
                        <Users className="w-3 h-3" />
                        {children.length} child{children.length !== 1 ? 'ren' : ''}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
