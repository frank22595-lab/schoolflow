'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Upload, Search, Filter, Edit, Copy, Trash2, Eye, FileText, X } from 'lucide-react';

type Question = {
  id: string;
  bank_id: string;
  question_type: string;
  difficulty: string;
  topic: string | null;
  question_text: string;
  question_image_url: string | null;
  options: any;
  correct_answer: any;
  acceptable_answers: any;
  explanation: string | null;
  points: number;
  is_active: boolean;
  created_at: string;
  bank?: {
    id: string;
    name: string;
    subject: { name: string };
    class_level: { name: string };
  };
};

type Subject = { id: string; name: string };
type ClassLevel = { id: string; name: string };

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq_single: 'MCQ (Single)',
  mcq_multiple: 'MCQ (Multi)',
  true_false: 'True/False',
  fill_blank: 'Fill Blank',
  short_answer: 'Short Answer',
  essay: 'Essay',
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  mcq_single: 'bg-blue-100 text-blue-700 border-blue-200',
  mcq_multiple: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  true_false: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  fill_blank: 'bg-teal-100 text-teal-700 border-teal-200',
  short_answer: 'bg-amber-100 text-amber-700 border-amber-200',
  essay: 'bg-purple-100 text-purple-700 border-purple-200',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  hard: 'bg-red-100 text-red-700 border-red-200',
};

export default function QuestionBankPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [qRes, sRes, cRes] = await Promise.all([
        fetch('/api/exams/questions').then((r) => r.json()),
        fetch('/api/subjects').then((r) => r.json()),
        fetch('/api/class-levels').then((r) => r.json()),
      ]);
      setQuestions(qRes.questions || []);
      setSubjects(sRes.subjects || []);
      setClassLevels(cRes.class_levels || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this question? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/exams/questions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setQuestions((prev) => prev.filter((q) => q.id !== id));
      } else {
        alert('Failed to delete question');
      }
    } catch (e) {
      alert('Error deleting question');
    }
  }

  async function handleDuplicate(id: string) {
    try {
      const res = await fetch(`/api/exams/questions/${id}/duplicate`, { method: 'POST' });
      if (res.ok) {
        loadData();
      } else {
        alert('Failed to duplicate');
      }
    } catch (e) {
      alert('Error duplicating question');
    }
  }

  const filtered = useMemo(() => {
    return questions.filter((q) => {
      if (search && !q.question_text.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterSubject && q.bank?.subject?.name !== filterSubject) return false;
      if (filterClass && q.bank?.class_level?.name !== filterClass) return false;
      if (filterType && q.question_type !== filterType) return false;
      if (filterDifficulty && q.difficulty !== filterDifficulty) return false;
      return true;
    });
  }, [questions, search, filterSubject, filterClass, filterType, filterDifficulty]);

  const anyFilterOn = search || filterSubject || filterClass || filterType || filterDifficulty;

  function clearFilters() {
    setSearch('');
    setFilterSubject('');
    setFilterClass('');
    setFilterType('');
    setFilterDifficulty('');
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all questions for your school's exams</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/exams/questions/upload"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium text-sm"
          >
            <Upload className="w-4 h-4" /> Bulk Upload
          </Link>
          <Link
            href="/dashboard/exams/questions/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm"
          >
            <Plus className="w-4 h-4" /> Add Question
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search questions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </select>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Classes</option>
              {classLevels.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Types</option>
              {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="">All Difficulty</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            {anyFilterOn && (
              <button
                onClick={clearFilters}
                className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-3 text-sm text-gray-600">
        Showing <strong className="text-gray-900">{filtered.length}</strong> of {questions.length} questions
      </div>

      {/* Question list */}
      {loading ? (
        <div className="text-center py-16 text-gray-500">Loading questions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-xl">
          <FileText className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">
            {questions.length === 0 ? 'No questions yet' : 'No questions match your filters'}
          </p>
          {questions.length === 0 && (
            <Link
              href="/dashboard/exams/questions/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 font-medium text-sm"
            >
              <Plus className="w-4 h-4" /> Add your first question
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <div
              key={q.id}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
            >
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className={`text-xs px-2 py-0.5 rounded border font-medium ${QUESTION_TYPE_COLORS[q.question_type] || 'bg-gray-100 text-gray-700'}`}>
                  {QUESTION_TYPE_LABELS[q.question_type] || q.question_type}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${DIFFICULTY_COLORS[q.difficulty]}`}>
                  {q.difficulty}
                </span>
                {q.bank?.subject?.name && (
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                    {q.bank.subject.name}
                  </span>
                )}
                {q.bank?.class_level?.name && (
                  <span className="text-xs px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                    {q.bank.class_level.name}
                  </span>
                )}
                {q.topic && (
                  <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-medium">
                    {q.topic}
                  </span>
                )}
                <span className="text-xs text-gray-500 ml-auto">
                  {q.points} {q.points === 1 ? 'point' : 'points'}
                </span>
              </div>

              <div
                className="text-gray-900 mb-3 line-clamp-2"
                dangerouslySetInnerHTML={{ __html: q.question_text }}
              />

              {q.question_image_url && (
                <div className="mb-3">
                  <img
                    src={q.question_image_url}
                    alt="Question"
                    className="max-h-24 rounded border border-gray-200"
                  />
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setPreviewQuestion(q)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Eye className="w-3 h-3" /> Preview
                </button>
                <Link
                  href={`/dashboard/exams/questions/${q.id}/edit`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Edit className="w-3 h-3" /> Edit
                </Link>
                <button
                  onClick={() => handleDuplicate(q.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </button>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-red-200 text-red-600 hover:bg-red-50 ml-auto"
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Preview modal */}
      {previewQuestion && (
        <QuestionPreviewModal
          question={previewQuestion}
          onClose={() => setPreviewQuestion(null)}
        />
      )}
    </div>
  );
}

function QuestionPreviewModal({ question, onClose }: { question: Question; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white">
          <div>
            <h2 className="font-bold text-gray-900">Student Preview</h2>
            <p className="text-xs text-gray-500 mt-0.5">How students will see this question</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <span>{QUESTION_TYPE_LABELS[question.question_type]}</span>
            <span>·</span>
            <span>{question.points} {question.points === 1 ? 'point' : 'points'}</span>
          </div>

          <div
            className="text-gray-900 mb-4 text-base"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />

          {question.question_image_url && (
            <div className="mb-4">
              <img
                src={question.question_image_url}
                alt="Question"
                className="max-w-full rounded border border-gray-200"
              />
            </div>
          )}

          {/* Answer preview per type */}
          {(question.question_type === 'mcq_single' || question.question_type === 'mcq_multiple') && Array.isArray(question.options) && (
            <div className="space-y-2">
              {question.options.map((opt: any, i: number) => (
                <label
                  key={i}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer ${
                    opt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type={question.question_type === 'mcq_multiple' ? 'checkbox' : 'radio'}
                    name="preview"
                    checked={opt.is_correct}
                    readOnly
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm text-gray-500 mb-0.5">
                      Option {String.fromCharCode(65 + i)}
                    </div>
                    <div className="text-gray-900" dangerouslySetInnerHTML={{ __html: opt.text }} />
                    {opt.image_url && (
                      <img src={opt.image_url} alt={`Option ${i + 1}`} className="mt-2 max-h-24 rounded" />
                    )}
                  </div>
                  {opt.is_correct && (
                    <span className="text-green-600 text-xs font-semibold">✓ Correct</span>
                  )}
                </label>
              ))}
            </div>
          )}

          {question.question_type === 'true_false' && (
            <div className="space-y-2">
              {['True', 'False'].map((v, i) => {
                const isCorrect = question.correct_answer?.correct === (i === 0);
                return (
                  <label
                    key={v}
                    className={`flex items-center gap-3 p-3 border rounded-lg ${
                      isCorrect ? 'border-green-400 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <input type="radio" checked={isCorrect} readOnly />
                    <span className="font-medium">{v}</span>
                    {isCorrect && <span className="text-green-600 text-xs ml-auto">✓ Correct</span>}
                  </label>
                );
              })}
            </div>
          )}

          {question.question_type === 'fill_blank' && (
            <div>
              <input
                type="text"
                placeholder="Student types answer here..."
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-500"
              />
              {question.acceptable_answers?.acceptable_answers && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="font-semibold text-green-700 mb-1">Acceptable answers:</div>
                  <div className="text-green-800">
                    {question.acceptable_answers.acceptable_answers.join(', ')}
                  </div>
                </div>
              )}
            </div>
          )}

          {(question.question_type === 'short_answer' || question.question_type === 'essay') && (
            <div>
              <textarea
                rows={question.question_type === 'essay' ? 8 : 3}
                placeholder="Student writes answer here..."
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-500"
              />
              <div className="mt-2 text-xs text-gray-500 italic">
                Manually graded by teacher after submission
              </div>
            </div>
          )}

          {question.explanation && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-semibold text-blue-700 mb-1">EXPLANATION (shown after submit)</div>
              <div className="text-sm text-blue-900" dangerouslySetInnerHTML={{ __html: question.explanation }} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
