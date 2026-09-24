'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Calendar, Play, CheckCircle, LogOut, GraduationCap, Calculator, FileText, AlertCircle } from 'lucide-react';

type Exam = {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  start_at: string | null;
  end_at: string | null;
  total_points: number;
  passing_score: number;
  allow_calculator: boolean;
  attempts_allowed: number;
  question_count: number;
  subject?: { name: string };
  session_status?: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  session_score?: number;
  attempts_used?: number;
};

type Student = {
  first_name: string;
  last_name: string;
  admission_number: string;
  class_name: string;
};

export default function StudentExamsListPage() {
  const router = useRouter();
  const [student, setStudent] = useState<Student | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'available' | 'completed'>('available');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [meRes, examsRes] = await Promise.all([
        fetch('/api/cbt/me'),
        fetch('/api/cbt/exams'),
      ]);
      if (!meRes.ok) {
        router.push('/cbt/login');
        return;
      }
      const meData = await meRes.json();
      const examsData = await examsRes.json();
      setStudent(meData.student);
      setExams(examsData.exams || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/cbt/logout', { method: 'POST' });
    router.push('/cbt/login');
  }

  function startExam(examId: string) {
    router.push(`/cbt/exams/${examId}`);
  }

  const availableExams = exams.filter((e) => e.session_status !== 'submitted' && e.session_status !== 'graded');
  const completedExams = exams.filter((e) => e.session_status === 'submitted' || e.session_status === 'graded');
  const displayExams = tab === 'available' ? availableExams : completedExams;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900 text-sm">
                {student ? `${student.first_name} ${student.last_name}` : 'Loading...'}
              </div>
              <div className="text-xs text-gray-500">
                {student ? `${student.admission_number} · ${student.class_name}` : ''}
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Exams</h1>
        <p className="text-sm text-gray-500 mb-6">Choose an exam to begin</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 border-b border-gray-200">
          <button
            onClick={() => setTab('available')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === 'available' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Available ({availableExams.length})
          </button>
          <button
            onClick={() => setTab('completed')}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === 'completed' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Completed ({completedExams.length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-500">Loading exams...</div>
        ) : displayExams.length === 0 ? (
          <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
            <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">
              {tab === 'available' ? 'No exams available right now' : 'No completed exams yet'}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {displayExams.map((exam) => {
              const isCompleted = exam.session_status === 'submitted' || exam.session_status === 'graded';
              const inProgress = exam.session_status === 'in_progress';
              const notAvailableYet = exam.start_at && new Date(exam.start_at) > new Date();
              const expired = exam.end_at && new Date(exam.end_at) < new Date() && !isCompleted;
              const attemptsExhausted = (exam.attempts_used || 0) >= exam.attempts_allowed;

              return (
                <div key={exam.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1">
                      {exam.subject?.name && (
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-medium">
                          {exam.subject.name}
                        </span>
                      )}
                      <h3 className="font-semibold text-gray-900 text-lg mt-1">{exam.name}</h3>
                      {exam.description && (
                        <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
                      )}

                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-600">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {exam.duration_minutes} min
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {exam.question_count} questions
                        </span>
                        <span>{exam.total_points} points</span>
                        {exam.allow_calculator && (
                          <span className="inline-flex items-center gap-1 text-indigo-600">
                            <Calculator className="w-3 h-3" /> Calculator allowed
                          </span>
                        )}
                        {exam.attempts_allowed > 1 && (
                          <span>Attempts: {exam.attempts_used || 0}/{exam.attempts_allowed}</span>
                        )}
                        {exam.start_at && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(exam.start_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      {isCompleted && exam.session_score !== undefined && (
                        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <span className="text-green-800 font-medium">
                            Score: {exam.session_score}/{exam.total_points}
                            {exam.session_score >= (exam.total_points * exam.passing_score / 100) ? ' · Passed' : ' · Below pass'}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {inProgress ? (
                        <button
                          onClick={() => startExam(exam.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-medium text-sm"
                        >
                          <Play className="w-4 h-4" /> Resume
                        </button>
                      ) : isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500">
                          <CheckCircle className="w-4 h-4 text-green-600" /> Completed
                        </span>
                      ) : notAvailableYet ? (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Starts</div>
                          <div className="text-sm font-medium text-gray-700">
                            {new Date(exam.start_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(exam.start_at!).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      ) : expired ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-red-500">
                          <AlertCircle className="w-4 h-4" /> Expired
                        </span>
                      ) : attemptsExhausted ? (
                        <span className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-500">
                          No attempts left
                        </span>
                      ) : (
                        <button
                          onClick={() => startExam(exam.id)}
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-sm"
                        >
                          <Play className="w-4 h-4" /> Start Exam
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
