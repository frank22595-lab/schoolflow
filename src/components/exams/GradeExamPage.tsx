'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, ChevronLeft, ChevronRight, CheckCircle, Award, Send, FileText, User, Clock, TrendingUp } from 'lucide-react';

type Answer = {
  answer_id: string;
  session_id: string;
  question_id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  question_type: string;
  question_text: string;
  answer: { text: string };
  points_available: number;
  points_earned: number;
  is_manually_graded: boolean;
  teacher_feedback: string | null;
};

type ExamInfo = {
  id: string;
  name: string;
  subject_name: string;
  class_name: string;
  total_points: number;
  passing_score: number;
  auto_post_to_grades: boolean;
};

type Session = {
  id: string;
  student_id: string;
  student_name: string;
  admission_number: string;
  auto_score: number;
  manual_score: number;
  total_score: number;
  status: string;
  submitted_at: string;
  posted_to_grades_at: string | null;
};

export default function GradeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string;

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<'grade' | 'results'>('grade');

  // Local edit state for current answer
  const [pointsInput, setPointsInput] = useState<string>('');
  const [feedbackInput, setFeedbackInput] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [examId]);

  useEffect(() => {
    const current = answers[currentIdx];
    if (current) {
      setPointsInput(String(current.points_earned || ''));
      setFeedbackInput(current.teacher_feedback || '');
    }
  }, [currentIdx, answers]);

  async function loadData() {
    setLoading(true);
    try {
      const [examRes, ansRes, sessRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/exams/${examId}/pending-answers`),
        fetch(`/api/exams/${examId}/sessions`),
      ]);
      const examData = await examRes.json();
      const ansData = await ansRes.json();
      const sessData = await sessRes.json();
      setExam({
        id: examData.exam.id,
        name: examData.exam.name,
        subject_name: examData.exam.subject?.name || '',
        class_name: examData.exam.class_level?.name || '',
        total_points: examData.exam.total_points,
        passing_score: examData.exam.passing_score,
        auto_post_to_grades: examData.exam.auto_post_to_grades,
      });
      setAnswers(ansData.answers || []);
      setSessions(sessData.sessions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function saveCurrentGrade(moveToNext = true) {
    const current = answers[currentIdx];
    if (!current) return;
    const points = Number(pointsInput);
    if (isNaN(points) || points < 0 || points > current.points_available) {
      alert(`Points must be between 0 and ${current.points_available}`);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/exams/answers/${current.answer_id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points_earned: points,
          teacher_feedback: feedbackInput.trim() || null,
        }),
      });
      if (!res.ok) {
        alert('Save failed');
        setSaving(false);
        return;
      }
      // Update local state
      setAnswers((prev) =>
        prev.map((a, i) =>
          i === currentIdx
            ? { ...a, points_earned: points, teacher_feedback: feedbackInput.trim() || null, is_manually_graded: true }
            : a
        )
      );
      if (moveToNext && currentIdx < answers.length - 1) {
        setCurrentIdx(currentIdx + 1);
      }
    } catch (e) {
      alert('Error');
    } finally {
      setSaving(false);
    }
  }

  async function postAllToGrades() {
    if (!confirm('Post all completed exam scores to the Grades module? This will populate the Exam column in report cards.')) return;
    try {
      const res = await fetch(`/api/exams/${examId}/post-to-grades`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        alert(`Posted ${data.posted} scores to Grades module.`);
        loadData();
      } else {
        alert('Failed: ' + (data.error || 'unknown'));
      }
    } catch (e) {
      alert('Error');
    }
  }

  async function releaseResultsToStudents() {
    if (!confirm('Release results to students? They will be able to see their scores.')) return;
    try {
      const res = await fetch(`/api/exams/${examId}/release-results`, { method: 'POST' });
      if (res.ok) {
        alert('Results released.');
        loadData();
      }
    } catch (e) {
      alert('Error');
    }
  }

  const current = answers[currentIdx];
  const pendingCount = answers.filter((a) => !a.is_manually_graded).length;
  const totalToGrade = answers.length;
  const totalGraded = totalToGrade - pendingCount;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Link
        href="/dashboard/exams/grading"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Grading Queue
      </Link>

      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading...</div>
      ) : !exam ? (
        <div className="text-center py-16 text-gray-500">Exam not found</div>
      ) : (
        <>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                  {exam.subject_name}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-medium">
                  {exam.class_name}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{exam.name}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Grading essays and short answers · {totalGraded}/{totalToGrade} graded
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setTab('grade')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === 'grade' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Grade Answers ({pendingCount} pending)
            </button>
            <button
              onClick={() => setTab('results')}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
                tab === 'results' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Results ({sessions.length} students)
            </button>
          </div>

          {tab === 'grade' && (
            <>
              {answers.length === 0 ? (
                <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
                  <CheckCircle className="w-12 h-12 mx-auto text-green-300 mb-3" />
                  <p className="text-gray-500">
                    No essay questions to grade for this exam.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Progress bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 transition-all"
                        style={{ width: `${((currentIdx + 1) / answers.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">
                      {currentIdx + 1} / {answers.length}
                    </span>
                  </div>

                  {current && (
                    <>
                      {/* Student info */}
                      <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">
                          {current.student_name[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900">{current.student_name}</div>
                          <div className="text-xs text-gray-500">{current.admission_number}</div>
                        </div>
                        {current.is_manually_graded && (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-700 rounded font-medium">
                            <CheckCircle className="w-3 h-3" /> Already graded
                          </span>
                        )}
                      </div>

                      {/* Question */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="text-xs text-gray-500 mb-2 font-medium">QUESTION</div>
                        <div
                          className="text-gray-900 text-base"
                          dangerouslySetInnerHTML={{ __html: current.question_text }}
                        />
                        <div className="mt-3 text-xs text-gray-600">
                          Maximum: <strong className="text-gray-900">{current.points_available} points</strong>
                        </div>
                      </div>

                      {/* Student's answer */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="text-xs text-gray-500 mb-2 font-medium">STUDENT'S ANSWER</div>
                        <div className="whitespace-pre-wrap text-gray-900 text-base leading-relaxed p-4 bg-gray-50 border border-gray-200 rounded-lg min-h-[100px]">
                          {current.answer?.text || <em className="text-gray-400">No answer provided</em>}
                        </div>
                      </div>

                      {/* Grading input */}
                      <div className="bg-white border border-gray-200 rounded-xl p-5">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                              Points Awarded (max {current.points_available})
                            </label>
                            <input
                              type="number"
                              min={0}
                              max={current.points_available}
                              step={0.5}
                              value={pointsInput}
                              onChange={(e) => setPointsInput(e.target.value)}
                              className="w-full p-3 border-2 border-gray-300 rounded-lg text-xl font-bold text-center focus:border-indigo-500 focus:outline-none"
                              autoFocus
                            />
                            <div className="mt-2 flex gap-1 flex-wrap">
                              {[0, current.points_available * 0.5, current.points_available * 0.75, current.points_available].map((p) => (
                                <button
                                  key={p}
                                  onClick={() => setPointsInput(String(p))}
                                  className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  {p}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-2">
                              Feedback for Student (optional)
                            </label>
                            <textarea
                              value={feedbackInput}
                              onChange={(e) => setFeedbackInput(e.target.value)}
                              rows={4}
                              placeholder="Give the student feedback on their answer..."
                              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                          disabled={currentIdx === 0}
                          className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
                        >
                          <ChevronLeft className="w-4 h-4" /> Previous
                        </button>

                        <div className="flex gap-2">
                          <button
                            onClick={() => saveCurrentGrade(false)}
                            disabled={saving}
                            className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 disabled:opacity-50"
                          >
                            {saving ? 'Saving...' : 'Save'}
                          </button>
                          {currentIdx < answers.length - 1 && (
                            <button
                              onClick={() => saveCurrentGrade(true)}
                              disabled={saving}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" /> Save & Next
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'results' && (
            <div className="space-y-4">
              {/* Action bar */}
              <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-indigo-900 flex items-center gap-2">
                      <Send className="w-4 h-4" /> Publish Results
                    </h3>
                    <p className="text-sm text-indigo-800 mt-1">
                      Send scores to Grades module + release to students
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={releaseResultsToStudents}
                      className="px-4 py-2 border border-indigo-300 text-indigo-700 bg-white rounded-lg text-sm font-medium hover:bg-indigo-50"
                    >
                      Release to Students
                    </button>
                    <button
                      onClick={postAllToGrades}
                      className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
                    >
                      <TrendingUp className="w-4 h-4" /> Post to Grades
                    </button>
                  </div>
                </div>
              </div>

              {/* Session results table */}
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Student Results</h3>
                </div>
                {sessions.length === 0 ? (
                  <div className="p-8 text-center text-gray-500 text-sm">
                    No students have submitted this exam yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left p-3 text-xs font-semibold text-gray-700">Student</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Auto Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Manual Score</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Total</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Percentage</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Status</th>
                          <th className="text-center p-3 text-xs font-semibold text-gray-700">Posted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sessions.map((s) => {
                          const percentage = exam.total_points > 0
                            ? Math.round((s.total_score / exam.total_points) * 100)
                            : 0;
                          const passed = percentage >= exam.passing_score;
                          return (
                            <tr key={s.id} className="border-b border-gray-100 last:border-0">
                              <td className="p-3">
                                <div className="font-medium text-gray-900">{s.student_name}</div>
                                <div className="text-xs text-gray-500">{s.admission_number}</div>
                              </td>
                              <td className="p-3 text-center">{s.auto_score}</td>
                              <td className="p-3 text-center">{s.manual_score || 0}</td>
                              <td className="p-3 text-center font-semibold">
                                {s.total_score} / {exam.total_points}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded font-medium text-xs ${
                                  passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {percentage}%
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-xs capitalize">{s.status.replace('_', ' ')}</span>
                              </td>
                              <td className="p-3 text-center">
                                {s.posted_to_grades_at ? (
                                  <CheckCircle className="w-4 h-4 text-green-500 mx-auto" />
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
