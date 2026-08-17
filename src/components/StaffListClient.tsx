'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Search, Filter, Download, Upload, ArrowRight,
  Briefcase, Phone, Mail, X, Grid3x3, List, Sparkles,
  GraduationCap, Shield, Wrench, Award, AlertCircle,
} from 'lucide-react';

interface Staff {
  id: string;
  staff_number: string;
  title?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  staff_type: string;
  designation?: string;
  department?: string;
  primary_phone?: string;
  email?: string;
  gender?: string;
  status: string;
  photo_url?: string;
  employment_date?: string;
  qualifications?: string;
}

interface Props {
  schoolId: string;
  initialStaff: Staff[];
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
  on_leave: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'On Leave' },
  terminated: { bg: 'bg-red-50', text: 'text-red-700', label: 'Terminated' },
  resigned: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Resigned' },
  retired: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Retired' },
};

const TYPE_STYLES: Record<string, { icon: any; bg: string; text: string; label: string }> = {
  teaching: { icon: GraduationCap, bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Teacher' },
  non_teaching: { icon: Users, bg: 'bg-sky-50', text: 'text-sky-700', label: 'Non-teaching' },
  admin: { icon: Shield, bg: 'bg-indigo-50', text: 'text-indigo', label: 'Admin' },
  management: { icon: Award, bg: 'bg-purple-50', text: 'text-purple-700', label: 'Management' },
  support: { icon: Wrench, bg: 'bg-amber-50', text: 'text-amber-700', label: 'Support' },
};

export default function StaffListClient({ schoolId, initialStaff }: Props) {
  const [staff] = useState(initialStaff);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return staff.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (typeFilter !== 'all' && s.staff_type !== typeFilter) return false;
      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const full = `${s.first_name} ${s.middle_name || ''} ${s.last_name} ${s.designation || ''}`.toLowerCase();
        if (!full.includes(q) && !s.staff_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [staff, search, statusFilter, typeFilter, genderFilter]);

  const activeFilters = [
    statusFilter !== 'all' && { key: 'status', label: STATUS_STYLES[statusFilter]?.label, reset: () => setStatusFilter('all') },
    typeFilter !== 'all' && { key: 'type', label: TYPE_STYLES[typeFilter]?.label, reset: () => setTypeFilter('all') },
    genderFilter !== 'all' && { key: 'gender', label: genderFilter, reset: () => setGenderFilter('all') },
  ].filter(Boolean) as any[];

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    teachers: staff.filter(s => s.staff_type === 'teaching' && s.status === 'active').length,
    others: staff.filter(s => s.staff_type !== 'teaching' && s.status === 'active').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Staff</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Staff</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {stats.total === 0 ? 'No staff yet. Add your first team member below.' :
                `${stats.active} active · ${stats.teachers} teachers · ${stats.others} others`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary text-sm"><Upload className="w-4 h-4 mr-1.5" />Import</button>
            <button className="btn-secondary text-sm"><Download className="w-4 h-4 mr-1.5" />Export</button>
            <Link href="/dashboard/staff/new" className="btn-primary text-sm">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add staff
            </Link>
          </div>
        </div>
      </div>

      {stats.total === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 lg:p-8">
          <div className="max-w-lg">
            <div className="w-12 h-12 bg-indigo rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let's add your first team member</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              Add teachers, admin staff, and support workers. You'll be able to assign teachers to classes and subjects later.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/staff/new" className="btn-primary text-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add first staff member
              </Link>
              <button className="btn-secondary text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Bulk import
              </button>
            </div>
          </div>
        </div>
      )}

      {stats.total > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-3 lg:p-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search by name, staff number, or designation..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary text-sm ${activeFilters.length > 0 ? 'ring-2 ring-indigo/30 text-indigo' : ''}`}>
                  <Filter className="w-4 h-4 mr-1.5" />
                  Filters
                  {activeFilters.length > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-indigo text-white text-[10px] font-bold rounded-full">{activeFilters.length}</span>}
                </button>
                <div className="hidden sm:flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-lg">
                  <button onClick={() => setView('list')} className={`p-1.5 rounded ${view === 'list' ? 'bg-white shadow-sm' : ''}`}>
                    <List className="w-4 h-4 text-gray-600" />
                  </button>
                  <button onClick={() => setView('grid')} className={`p-1.5 rounded ${view === 'grid' ? 'bg-white shadow-sm' : ''}`}>
                    <Grid3x3 className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {showFilters && (
              <div className="border-t border-gray-100 p-3 lg:p-4 bg-gray-50/50 grid grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Status</label>
                  <select className="input text-sm py-1.5" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {Object.entries(STATUS_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Type</label>
                  <select className="input text-sm py-1.5" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                    <option value="all">All types</option>
                    {Object.entries(TYPE_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Gender</label>
                  <select className="input text-sm py-1.5" value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)}>
                    <option value="all">All</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
              </div>
            )}

            {activeFilters.length > 0 && (
              <div className="border-t border-gray-100 p-3 lg:p-4 flex flex-wrap items-center gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {activeFilters.map((f: any) => (
                  <button key={f.key} onClick={f.reset}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo text-xs font-medium rounded-md hover:bg-indigo-100">
                    {f.label}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                <button
                  onClick={() => { setStatusFilter('all'); setTypeFilter('all'); setGenderFilter('all'); }}
                  className="text-xs text-gray-500 hover:text-gray-900 ml-auto">
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing <strong>{filtered.length}</strong> of {staff.length} staff
            </p>
          </div>

          {view === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Name</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Designation</div>
                <div className="col-span-2">Contact</div>
                <div className="col-span-1">Status</div>
              </div>
              <div className="divide-y divide-gray-100">
                {filtered.map(s => {
                  const status = STATUS_STYLES[s.status];
                  const type = TYPE_STYLES[s.staff_type];
                  const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
                  return (
                    <Link key={s.id} href={`/dashboard/staff/${s.id}`}
                      className="p-3 lg:p-4 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center block group">
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
                          {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 group-hover:text-indigo transition-colors truncate">
                            {s.title && `${s.title} `}{s.first_name} {s.middle_name && s.middle_name[0] + '.'} {s.last_name}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">{s.staff_number}</div>
                          <div className="sm:hidden text-[10px] text-gray-500 mt-1">{s.designation || type?.label}</div>
                        </div>
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-2">
                        {type && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 ${type.bg} ${type.text} text-[10px] font-semibold rounded-full`}>
                            <type.icon className="w-3 h-3" />
                            {type.label}
                          </span>
                        )}
                      </div>
                      <div className="col-span-3 hidden sm:block text-xs text-gray-600 truncate">
                        {s.designation || <span className="text-gray-400 italic">—</span>}
                        {s.department && <span className="text-gray-400"> · {s.department}</span>}
                      </div>
                      <div className="col-span-2 hidden sm:flex flex-col text-[11px] text-gray-600 truncate min-w-0">
                        {s.primary_phone && <span className="flex items-center gap-1 truncate"><Phone className="w-3 h-3" />{s.primary_phone}</span>}
                        {s.email && <span className="flex items-center gap-1 truncate"><Mail className="w-3 h-3" />{s.email}</span>}
                      </div>
                      <div className="col-span-1 hidden sm:block">
                        <span className={`inline-flex px-2 py-0.5 ${status?.bg} ${status?.text} text-[10px] font-semibold rounded-full`}>
                          {status?.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No staff match these filters</p>
                    <p className="text-xs text-gray-500">Try adjusting your search or clearing filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(s => {
                const status = STATUS_STYLES[s.status];
                const type = TYPE_STYLES[s.staff_type];
                const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
                return (
                  <Link key={s.id} href={`/dashboard/staff/${s.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm mb-3">
                        {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate w-full">
                        {s.title && `${s.title} `}{s.first_name} {s.last_name}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate w-full mt-0.5">{s.staff_number}</div>
                      {s.designation && <div className="text-[10px] text-gray-600 mt-1 truncate w-full">{s.designation}</div>}
                      {type && (
                        <span className={`mt-2 inline-flex items-center gap-1 px-2 py-0.5 ${type.bg} ${type.text} text-[10px] font-semibold rounded-full`}>
                          <type.icon className="w-3 h-3" />
                          {type.label}
                        </span>
                      )}
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
