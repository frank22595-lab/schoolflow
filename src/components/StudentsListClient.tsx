'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Users, Plus, Search, Filter, Download, Upload, ArrowRight,
  UserPlus, MoreHorizontal, GraduationCap, Home as HouseIcon,
  Phone, Mail, MapPin, AlertCircle, CheckCircle2, XCircle, Circle,
  ChevronDown, X, Grid3x3, List, Calendar, Sparkles,
} from 'lucide-react';

interface Student {
  id: string;
  admission_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: string;
  date_of_birth?: string;
  photo_url?: string;
  current_section_id?: string;
  house_id?: string;
  status: string;
  blood_group?: string;
  genotype?: string;
  medical_alert_flag?: boolean;
  admission_date: string;
}

interface Props {
  schoolId: string;
  initialStudents: Student[];
  sections: any[];
  classes: any[];
  classLevels: any[];
  houses: any[];
  currentSession: any;
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-emerald-50', text: 'text-emerald-700', label: 'Active' },
  graduated: { bg: 'bg-indigo-50', text: 'text-indigo-700', label: 'Graduated' },
  withdrawn: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Withdrawn' },
  suspended: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Suspended' },
  expelled: { bg: 'bg-red-50', text: 'text-red-700', label: 'Expelled' },
};

export default function StudentsListClient({
  schoolId, initialStudents, sections, classes, classLevels, houses, currentSession,
}: Props) {
  const router = useRouter();
  const [students] = useState(initialStudents);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectionFilter, setSectionFilter] = useState<string>('all');
  const [houseFilter, setHouseFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => {
    return students.filter(s => {
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (sectionFilter !== 'all' && s.current_section_id !== sectionFilter) return false;
      if (houseFilter !== 'all' && s.house_id !== houseFilter) return false;
      if (genderFilter !== 'all' && s.gender !== genderFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        const full = `${s.first_name} ${s.middle_name || ''} ${s.last_name}`.toLowerCase();
        if (!full.includes(q) && !s.admission_number.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [students, search, statusFilter, sectionFilter, houseFilter, genderFilter]);

  const sectionName = (sectionId?: string) => {
    if (!sectionId) return null;
    const section = sections.find(s => s.id === sectionId);
    if (!section) return null;
    const cls = classes.find(c => c.id === section.class_id);
    const level = classLevels.find(l => l.id === cls?.class_level_id);
    return level ? `${level.name} ${section.name}` : section.name;
  };

  const houseName = (houseId?: string) => {
    if (!houseId) return null;
    return houses.find(h => h.id === houseId);
  };

  const activeFilters = [
    statusFilter !== 'all' && { key: 'status', label: STATUS_STYLES[statusFilter]?.label, reset: () => setStatusFilter('all') },
    sectionFilter !== 'all' && { key: 'section', label: sectionName(sectionFilter), reset: () => setSectionFilter('all') },
    houseFilter !== 'all' && { key: 'house', label: houses.find(h => h.id === houseFilter)?.name, reset: () => setHouseFilter('all') },
    genderFilter !== 'all' && { key: 'gender', label: genderFilter, reset: () => setGenderFilter('all') },
  ].filter(Boolean) as any[];

  const stats = {
    total: students.length,
    active: students.filter(s => s.status === 'active').length,
    male: students.filter(s => s.gender === 'male' && s.status === 'active').length,
    female: students.filter(s => s.gender === 'female' && s.status === 'active').length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <span>Students</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Students</h1>
            <p className="text-gray-500 mt-1 text-sm">
              {stats.total === 0
                ? 'No students yet. Add your first student below.'
                : `${stats.active} active · ${stats.male} boys · ${stats.female} girls`}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button className="btn-secondary text-sm">
              <Upload className="w-4 h-4 mr-1.5" />
              Import
            </button>
            <button className="btn-secondary text-sm">
              <Download className="w-4 h-4 mr-1.5" />
              Export
            </button>
            <Link href="/dashboard/students/new" className="btn-primary text-sm">
              <UserPlus className="w-4 h-4 mr-1.5" />
              Add student
            </Link>
          </div>
        </div>
      </div>

      {/* Empty state (first student) */}
      {stats.total === 0 && (
        <div className="bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-xl p-6 lg:p-8">
          <div className="max-w-lg">
            <div className="w-12 h-12 bg-indigo rounded-xl flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Let's add your first student</h3>
            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              You can add students one at a time, or bulk import from an Excel/CSV file with all your existing records.
            </p>
            {!currentSession && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  Set a current session first so students can be enrolled. <Link href="/dashboard/settings/academic" className="font-semibold underline">Go to Academic Calendar</Link>
                </div>
              </div>
            )}
            {sections.length === 0 && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-800">
                  Add class sections first so you can assign students. <Link href="/dashboard/settings/classes" className="font-semibold underline">Go to Classes</Link>
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Link href="/dashboard/students/new" className="btn-primary text-sm">
                <UserPlus className="w-4 h-4 mr-2" />
                Add first student
              </Link>
              <button className="btn-secondary text-sm">
                <Upload className="w-4 h-4 mr-2" />
                Bulk import from Excel
              </button>
            </div>
          </div>
        </div>
      )}

      {stats.total > 0 && (
        <>
          {/* Search bar + filters */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="p-3 lg:p-4 flex flex-col sm:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or admission number..."
                  className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo focus:bg-white transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`btn-secondary text-sm ${activeFilters.length > 0 ? 'ring-2 ring-indigo/30 text-indigo' : ''}`}
                >
                  <Filter className="w-4 h-4 mr-1.5" />
                  Filters
                  {activeFilters.length > 0 && (
                    <span className="ml-1.5 px-1.5 py-0.5 bg-indigo text-white text-[10px] font-bold rounded-full">{activeFilters.length}</span>
                  )}
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

            {/* Filter panel */}
            {showFilters && (
              <div className="border-t border-gray-100 p-3 lg:p-4 bg-gray-50/50 grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="label text-xs">Status</label>
                  <select className="input text-sm py-1.5" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="all">All statuses</option>
                    {Object.entries(STATUS_STYLES).map(([v, s]) => <option key={v} value={v}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">Section</label>
                  <select className="input text-sm py-1.5" value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)}>
                    <option value="all">All sections</option>
                    {sections.map(s => <option key={s.id} value={s.id}>{sectionName(s.id)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs">House</label>
                  <select className="input text-sm py-1.5" value={houseFilter} onChange={(e) => setHouseFilter(e.target.value)}>
                    <option value="all">All houses</option>
                    {houses.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
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

            {/* Active filter chips */}
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
                  onClick={() => { setStatusFilter('all'); setSectionFilter('all'); setHouseFilter('all'); setGenderFilter('all'); }}
                  className="text-xs text-gray-500 hover:text-gray-900 ml-auto">
                  Clear all
                </button>
              </div>
            )}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between px-1">
            <p className="text-xs text-gray-500">
              Showing <strong>{filtered.length}</strong> of {students.length} students
            </p>
          </div>

          {/* List view */}
          {view === 'list' && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="hidden sm:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                <div className="col-span-4">Student</div>
                <div className="col-span-2">Class</div>
                <div className="col-span-2">House</div>
                <div className="col-span-2">Health</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-1"></div>
              </div>
              <div className="divide-y divide-gray-100">
                {filtered.map(s => {
                  const status = STATUS_STYLES[s.status];
                  const section = sectionName(s.current_section_id);
                  const house = houseName(s.house_id);
                  const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
                  return (
                    <Link
                      key={s.id}
                      href={`/dashboard/students/${s.id}`}
                      className="p-3 lg:p-4 hover:bg-gray-50 transition-colors sm:grid sm:grid-cols-12 sm:gap-3 sm:items-center block group"
                    >
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0 shadow-sm">
                          {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-sm text-gray-900 group-hover:text-indigo transition-colors truncate">
                            {s.first_name} {s.middle_name && s.middle_name[0] + '.'} {s.last_name}
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {s.admission_number}
                            {s.gender && ` · ${s.gender === 'male' ? 'M' : 'F'}`}
                          </div>
                          <div className="sm:hidden text-[10px] text-gray-500 mt-1">
                            {section && `${section}`}
                            {house && ` · ${house.name}`}
                          </div>
                        </div>
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-2 text-xs text-gray-600 min-w-0">
                        {section ? (
                          <>
                            <GraduationCap className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                            <span className="truncate">{section}</span>
                          </>
                        ) : <span className="text-gray-400 italic">Not assigned</span>}
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-2 text-xs text-gray-600 min-w-0">
                        {house ? (
                          <>
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: house.color || '#94a3b8' }} />
                            <span className="truncate">{house.name}</span>
                          </>
                        ) : <span className="text-gray-400 italic">—</span>}
                      </div>
                      <div className="col-span-2 hidden sm:flex items-center gap-1.5 text-[11px]">
                        {s.blood_group && (
                          <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded font-mono font-semibold">
                            {s.blood_group}
                          </span>
                        )}
                        {s.genotype && (
                          <span className={`px-1.5 py-0.5 rounded font-mono font-semibold ${
                            s.genotype === 'SS' ? 'bg-red-100 text-red-700' :
                            s.genotype === 'AS' || s.genotype === 'SC' ? 'bg-amber-50 text-amber-700' :
                            'bg-emerald-50 text-emerald-700'
                          }`}>
                            {s.genotype}
                          </span>
                        )}
                        {s.medical_alert_flag && <AlertCircle className="w-3.5 h-3.5 text-error" />}
                      </div>
                      <div className="col-span-1 hidden sm:block">
                        <span className={`inline-flex items-center px-2 py-0.5 ${status?.bg} ${status?.text} text-[10px] font-semibold rounded-full`}>
                          {status?.label}
                        </span>
                      </div>
                      <div className="col-span-1 hidden sm:flex justify-end">
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="p-12 text-center">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900 mb-1">No students match these filters</p>
                    <p className="text-xs text-gray-500">Try adjusting your search or clearing filters</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid view */}
          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(s => {
                const status = STATUS_STYLES[s.status];
                const section = sectionName(s.current_section_id);
                const house = houseName(s.house_id);
                const initials = `${s.first_name[0]}${s.last_name[0]}`.toUpperCase();
                return (
                  <Link key={s.id} href={`/dashboard/students/${s.id}`}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group relative">
                    {house && (
                      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: house.color || '#94a3b8' }} />
                    )}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-sm mb-3 mt-1">
                        {s.photo_url ? <img src={s.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> : initials}
                      </div>
                      <div className="font-medium text-sm text-gray-900 truncate w-full">{s.first_name} {s.last_name}</div>
                      <div className="text-[10px] text-gray-500 truncate w-full mt-0.5">{s.admission_number}</div>
                      {section && <div className="text-[10px] text-gray-600 mt-1 truncate w-full">{section}</div>}
                      <span className={`mt-2 inline-flex px-2 py-0.5 ${status?.bg} ${status?.text} text-[10px] font-semibold rounded-full`}>
                        {status?.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
              {filtered.length === 0 && (
                <div className="col-span-full p-12 text-center bg-white rounded-xl border border-gray-200">
                  <p className="text-sm text-gray-500">No students match these filters</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
