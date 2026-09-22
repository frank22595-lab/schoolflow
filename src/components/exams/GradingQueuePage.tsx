'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { FileText, Users, Clock, CheckCircle, ClipboardList, ArrowRight } from 'lucide-react';

type ExamQueueItem = {
  exam_id: string;
  exam_name: string;
  subject_name: string;
  class_name: string;
  pending_count: number;
  graded_count: number;
  total_count: number;
  latest_submission: string;
};

export default function GradingQueuePage() {
  const [items, setItems] = useState<ExamQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  useEffect(() => {
    loadQueue();
  }, []);

  async function loadQueue() {
    setLoading(true);
    try {
      const res = await fetch('/api/exams/grading/queue');
      const data = await res.json();
      setItems(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    if (filter === 'pending') return items.filter((i) => i.pending_count > 0);
    return items;
  }, [items, filter]);

  const totalPending = items.reduce((s, i) => s + i.pending_count, 0);
  const totalGraded = items.reduce((s, i) => s + i.graded_count, 0);
  const totalExams = items.length;

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grading Queue</h1>
          <p className="text-sm text-gray-500 mt-1">Manually grade essay & short-answer questions</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/exams"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
          >
            <ClipboardList className="w-4 h-4" /> All Exams
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Pending</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{totalPending}</div>
          <div className="text-xs text-gray-500 mt-1">answers to grade</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Graded</div>
          <div className="text-2xl font-bold text-green-600 mt-1">{totalGraded}</div>
          <div className="text-xs text-gray-500 mt-1">answers scored</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-500 uppercase tracking-wide font-medium">Exams</div>
          <div className="text-2xl font-bold text-gray-900 mt-1">{totalExams}</div>
          <div className="text-xs text-gray-500 mt-1">with essays</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
            filter === 'pending' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Pending ({items.filter(i => i.pending_count > 0).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg ${
            filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          All Exams ({items.length})
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading grading queue...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
          <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
          <p className="text-gray-500 mb-2">
            {filter === 'pending' ? 'All caught up! No essays waiting to be graded.' : 'No exams with essay questions yet'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((item) => {
            const progressPct = item.total_count > 0
              ? Math.round((item.graded_count / item.total_count) * 100)
              : 100;
            return (
              <Link
                key={item.exam_id}
                href={`/dashboard/exams/${item.exam_id}/grade`}
                className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-indigo-300 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                        {item.subject_name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-gray-50 border border-gray-200 text-gray-700 font-medium">
                        {item.class_name}
                      </span>
                      {item.pending_count > 0 ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">
                          {item.pending_count} pending
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700 font-medium">
                          Complete
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 text-lg">{item.exam_name}</h3>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 max-w-xs h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${progressPct === 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 font-medium">
                        {item.graded_count}/{item.total_count} graded
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400 shrink-0" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
