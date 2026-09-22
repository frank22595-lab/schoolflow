'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, Search, Clock, Users, FileText, Play, Pause, CheckCircle, Archive, Edit, Trash2, Copy, Eye, Calendar } from 'lucide-react';

type Exam = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  total_points: number;
  passing_score: number;
  status: 'draft' | 'scheduled' | 'live' | 'ended' | 'archived';
  allow_calculator: boolean;
  attempts_allowed: number;
  created_at: string;
  subject?: { name: string };
  class_level?: { name: string };
  term?: { name: string };
  question_count?: number;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: FileText },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Calendar },
  live: { label: 'Live Now', color: 'bg-green-100 text-green-700 border-green-200', icon: Play },
  ended: { label: 'Ended', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: CheckCircle },
  archived: { label: 'Archived', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: Archive },
};

export default function ExamsListPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  useEffect(() => {
    loadExams();
  }, []);

  async function loadExams() {
    setLoading(true);
    try {
      const res = await fetch('/api/exams');
      const data = await res.json();
      setExams(data.exams || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete exam "${name}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/exams/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setExams((prev) => prev.filter((e) => e.id !== id));
      } else {
        alert('Failed to delete');
      }
    } catch (e) {
      alert('Error');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/exams/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        loadExams();
      }
    } catch (e) {}
  }

  async function handlePublish(id: string) {
    if (!confirm('Publish this exam? Students will be able to see it once the start time arrives.')) return;
    try {
      const res = await fetch(`/api/exams/${id}/publish`, { method: 'POST' });
      if (res.ok) loadExams();
    } catch (e) {}
  }

  const filtered = useMemo(() => {
    return exams.filter((e) => {
      if (search && !e.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [exams, search, filterStatus]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage exams for your students</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/exams/questions"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
          >
            <FileText className="w-4 h-4" /> Question Bank
          </Link>
          <Link
            href="/dashboard/exams/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> New Exam
          </Link>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total" value={exams.length} color="text-gray-900" />
        <StatCard label="Live Now" value={exams.filter(e => e.status === 'live').length} color="text-green-600" />
        <StatCard label="Scheduled" value={exams.filter(e => e.status === 'scheduled').length} color="text-blue-600" />
        <StatCard label="Drafts" value={exams.filter(e => e.status === 'draft').length} color="text-gray-500" />
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search exams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">All Status</option>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Exams list */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading exams...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            {exams.length === 0 ? 'No exams created yet' : 'No exams match your filters'}
          </p>
          {exams.length === 0 && (
            <Link
              href="/dashboard/exams/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Create your first exam
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((exam) => {
            const StatusIcon = STATUS_CONFIG[exam.status]?.icon || FileText;
            return (
              <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded border font-medium ${STATUS_CONFIG[exam.status]?.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {STATUS_CONFIG[exam.status]?.label}
                      </span>
                      {exam.subject?.name && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                          {exam.subject.name}
                        </span>
                      )}
                      {exam.class_level?.name && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                          {exam.class_level.name}
                        </span>
                      )}
                    </div>

                    <h3 className="font-semibold text-gray-900 text-lg mb-1">{exam.name}</h3>
                    {exam.description && (
                      <p className="text-sm text-gray-500 line-clamp-1 mb-2">{exam.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {exam.duration_minutes} min
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        {exam.question_count ?? 0} questions
                      </span>
                      <span>{exam.total_points} pts total</span>
                      <span>Pass: {exam.passing_score}%</span>
                      {exam.allow_calculator && <span className="text-indigo-600">Calculator on</span>}
                      {exam.start_at && (
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(exam.start_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} · {new Date(exam.start_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:justify-end shrink-0">
                    {exam.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(exam.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-600 text-white hover:bg-green-700"
                      >
                        <Play className="w-3 h-3" /> Publish
                      </button>
                    )}
                    <Link
                      href={`/dashboard/exams/${exam.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Eye className="w-3 h-3" /> Details
                    </Link>
                    <Link
                      href={`/dashboard/exams/${exam.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Edit className="w-3 h-3" /> Edit
                    </Link>
                    <button
                      onClick={() => handleDuplicate(exam.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id, exam.name)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">{label}</div>
      <div className={`text-2xl font-bold ${color} mt-1`}>{value}</div>
    </div>
  );
}
