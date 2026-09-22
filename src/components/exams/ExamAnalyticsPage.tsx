'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, TrendingUp, TrendingDown, Users, Award, Clock, AlertTriangle, Download, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

type ExamSummary = {
  exam_id: string;
  exam_name: string;
  subject_name: string;
  class_name: string;
  total_points: number;
  passing_score: number;
  graded_sessions: number;
  pending_sessions: number;
  total_sessions: number;
  avg_score: number;
  avg_percentage: number;
  highest_score: number;
  lowest_score: number;
  passed_count: number;
  failed_count: number;
  avg_time_seconds: number;
};

type QuestionStat = {
  question_id: string;
  question_text: string;
  question_type: string;
  difficulty: string;
  points_available: number;
  times_answered: number;
  times_correct: number;
  times_wrong: number;
  times_skipped: number;
  correct_pct: number;
  avg_points_earned: number;
  avg_time_seconds: number;
};

type StudentResult = {
  session_id: string;
  student_name: string;
  admission_number: string;
  total_score: number;
  percentage: number;
  passed: boolean;
  submitted_at: string;
  time_spent_seconds: number;
  tab_switches: number;
};

export default function ExamAnalyticsPage() {
  const params = useParams();
  const examId = params?.id as string;
  const [summary, setSummary] = useState<ExamSummary | null>(null);
  const [questions, setQuestions] = useState<QuestionStat[]>([]);
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'overview' | 'questions' | 'students'>('overview');

  useEffect(() => {
    loadData();
  }, [examId]);

  async function loadData() {
    setLoading(true);
    try {
      const res = await fetch(`/api/exams/${examId}/analytics`);
      const data = await res.json();
      setSummary(data.summary);
      setQuestions(data.questions || []);
      setStudents(data.students || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function exportToExcel() {
    try {
      const res = await fetch(`/api/exams/${examId}/analytics/export`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${summary?.exam_name || 'exam'}_results.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Export failed');
    }
  }

  const passRate = summary && summary.graded_sessions > 0
    ? Math.round((summary.passed_count / summary.graded_sessions) * 100)
    : 0;

  const hardestQuestions = useMemo(() => {
    return [...questions]
      .filter(q => q.times_answered > 0)
      .sort((a, b) => a.correct_pct - b.correct_pct)
      .slice(0, 5);
  }, [questions]);

  const easiestQuestions = useMemo(() => {
    return [...questions]
      .filter(q => q.times_answered > 0)
      .sort((a, b) => b.correct_pct - a.correct_pct)
      .slice(0, 5);
  }, [questions]);

  const gradeBuckets = useMemo(() => {
    const buckets = { '0-39': 0, '40-49': 0, '50-59': 0, '60-69': 0, '70-79': 0, '80-89': 0, '90-100': 0 };
    students.forEach(s => {
      const p = s.percentage;
      if (p < 40) buckets['0-39']++;
      else if (p < 50) buckets['40-49']++;
      else if (p < 60) buckets['50-59']++;
      else if (p < 70) buckets['60-69']++;
      else if (p < 80) buckets['70-79']++;
      else if (p < 90) buckets['80-89']++;
      else buckets['90-100']++;
    });
    return buckets;
  }, [students]);

  const maxBucket = Math.max(...Object.values(gradeBuckets), 1);

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/dashboard/exams"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Exams
        </Link>
        <button
          onClick={exportToExcel}
          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
        >
          <Download className="w-4 h-4" /> Export to Excel
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading analytics...</div>
      ) : !summary ? (
        <div className="text-center py-16 text-gray-500">No data available</div>
      ) : (
        <>
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                {summary.subject_name}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                {summary.class_name}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{summary.exam_name}</h1>
            <p className="text-sm text-gray-500 mt-1">Analytics & Performance Insights</p>
          </div>

          {/* Top stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={<Users className="w-5 h-5 text-indigo-600" />}
              label="Students Attempted"
              value={String(summary.total_sessions)}
              subtitle={`${summary.graded_sessions} graded, ${summary.pending_sessions} pending`}
            />
            <StatCard
              icon={<Award className="w-5 h-5 text-green-600" />}
              label="Pass Rate"
              value={`${passRate}%`}
              subtitle={`${summary.passed_count} passed, ${summary.failed_count} failed`}
              highlight={passRate >= 70 ? 'good' : passRate >= 50 ? 'medium' : 'bad'}
            />
            <StatCard
              icon={<BarChart3 className="w-5 h-5 text-purple-600" />}
              label="Average Score"
              value={`${summary.avg_percentage || 0}%`}
              subtitle={`${summary.avg_score || 0} / ${summary.total_points} points`}
            />
            <StatCard
              icon={<Clock className="w-5 h-5 text-orange-600" />}
              label="Avg Time"
              value={`${Math.round((summary.avg_time_seconds || 0) / 60)}m`}
              subtitle={`Highest: ${summary.highest_score}, Lowest: ${summary.lowest_score}`}
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            {(['overview', 'questions', 'students'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px capitalize ${
                  tab === t ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Grade distribution */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3">Grade Distribution</h3>
                <div className="space-y-2">
                  {Object.entries(gradeBuckets).reverse().map(([bucket, count]) => (
                    <div key={bucket} className="flex items-center gap-2">
                      <div className="w-16 text-xs text-gray-600 font-medium">{bucket}%</div>
                      <div className="flex-1 h-6 bg-gray-100 rounded relative overflow-hidden">
                        <div
                          className={`h-full ${
                            parseInt(bucket) >= 70 ? 'bg-green-500' :
                            parseInt(bucket) >= 50 ? 'bg-blue-500' :
                            'bg-red-400'
                          }`}
                          style={{ width: `${(count / maxBucket) * 100}%` }}
                        />
                        <div className="absolute inset-0 flex items-center px-2 text-xs font-medium text-gray-700">
                          {count} student{count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hardest questions */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" /> Hardest Questions
                </h3>
                {hardestQuestions.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {hardestQuestions.map((q, i) => (
                      <div key={q.question_id} className="text-sm border-l-4 border-red-400 pl-2 py-1">
                        <div className="line-clamp-1 text-gray-900" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        <div className="text-xs text-red-600 mt-0.5 font-medium">
                          {q.correct_pct}% got it right · {q.times_wrong} wrong / {q.times_answered} attempts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Easiest questions */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" /> Easiest Questions
                </h3>
                {easiestQuestions.length === 0 ? (
                  <p className="text-sm text-gray-500">No data yet</p>
                ) : (
                  <div className="space-y-2">
                    {easiestQuestions.map((q) => (
                      <div key={q.question_id} className="text-sm border-l-4 border-green-400 pl-2 py-1">
                        <div className="line-clamp-1 text-gray-900" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        <div className="text-xs text-green-600 mt-0.5 font-medium">
                          {q.correct_pct}% got it right · {q.times_correct} correct / {q.times_answered} attempts
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Integrity flags */}
              <div className="bg-white border border-gray-200 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" /> Integrity Flags
                </h3>
                {students.filter(s => s.tab_switches > 0).length === 0 ? (
                  <p className="text-sm text-gray-500">No violations detected. All students behaved during the exam.</p>
                ) : (
                  <div className="space-y-2">
                    {students
                      .filter(s => s.tab_switches > 0)
                      .sort((a, b) => b.tab_switches - a.tab_switches)
                      .slice(0, 5)
                      .map((s) => (
                        <div key={s.session_id} className="flex items-center justify-between text-sm border-l-4 border-amber-400 pl-2 py-1">
                          <div>
                            <div className="font-medium text-gray-900">{s.student_name}</div>
                            <div className="text-xs text-gray-500">{s.admission_number}</div>
                          </div>
                          <div className="text-xs text-amber-700 font-medium">
                            {s.tab_switches} tab switch{s.tab_switches !== 1 ? 'es' : ''}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'questions' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-700">Question</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Type</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Correct %</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Correct/Wrong/Skipped</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Avg Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.map((q) => (
                      <tr key={q.question_id} className="border-b border-gray-100 last:border-0">
                        <td className="p-3 max-w-md">
                          <div className="line-clamp-2 text-gray-900" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        </td>
                        <td className="p-3 text-center">
                          <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">
                            {q.question_type.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
                            q.correct_pct >= 70 ? 'bg-green-100 text-green-700' :
                            q.correct_pct >= 40 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.correct_pct || 0}%
                          </span>
                        </td>
                        <td className="p-3 text-center text-xs">
                          <span className="text-green-600 font-medium">{q.times_correct}</span> / <span className="text-red-600 font-medium">{q.times_wrong}</span> / <span className="text-gray-500 font-medium">{q.times_skipped}</span>
                        </td>
                        <td className="p-3 text-center text-xs text-gray-600">
                          {q.avg_time_seconds ? `${Math.round(q.avg_time_seconds)}s` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'students' && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left p-3 text-xs font-semibold text-gray-700">Student</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Score</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">%</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Pass/Fail</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Time</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Violations</th>
                      <th className="text-center p-3 text-xs font-semibold text-gray-700">Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...students]
                      .sort((a, b) => b.percentage - a.percentage)
                      .map((s) => (
                        <tr key={s.session_id} className="border-b border-gray-100 last:border-0">
                          <td className="p-3">
                            <div className="font-medium text-gray-900">{s.student_name}</div>
                            <div className="text-xs text-gray-500">{s.admission_number}</div>
                          </td>
                          <td className="p-3 text-center font-medium">
                            {s.total_score} / {summary.total_points}
                          </td>
                          <td className="p-3 text-center font-semibold">{Math.round(s.percentage)}%</td>
                          <td className="p-3 text-center">
                            {s.passed ? (
                              <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-500 mx-auto" />
                            )}
                          </td>
                          <td className="p-3 text-center text-xs text-gray-600">
                            {Math.round(s.time_spent_seconds / 60)}m
                          </td>
                          <td className="p-3 text-center">
                            {s.tab_switches > 0 ? (
                              <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                                <AlertTriangle className="w-3 h-3" /> {s.tab_switches}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3 text-center text-xs text-gray-600">
                            {new Date(s.submitted_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, subtitle, highlight }: any) {
  const highlightColor = highlight === 'good' ? 'bg-green-50 border-green-200' :
                        highlight === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        highlight === 'bad' ? 'bg-red-50 border-red-200' :
                        'bg-white border-gray-200';
  return (
    <div className={`border rounded-xl p-4 ${highlightColor}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <div className="text-xs uppercase tracking-wide font-medium text-gray-600">{label}</div>
      </div>
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>
    </div>
  );
}
