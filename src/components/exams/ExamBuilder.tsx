'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Settings, ListChecks, Plus, X, GripVertical, Shuffle, Calculator, Timer, Eye, Play, Filter } from 'lucide-react';

type Question = {
  id: string;
  question_type: string;
  difficulty: string;
  topic: string | null;
  question_text: string;
  points: number;
  bank?: { subject: { name: string; id: string }; class_level: { name: string; id: string } };
};

type ExamData = {
  name: string;
  description: string;
  instructions: string;
  subject_id: string;
  class_level_id: string;
  term_id: string;
  duration_minutes: number;
  start_at: string;
  end_at: string;
  passing_score: number;
  randomize_questions: boolean;
  randomize_options: boolean;
  show_results_immediately: boolean;
  allow_calculator: boolean;
  attempts_allowed: number;
  require_fullscreen: boolean;
  prevent_copy_paste: boolean;
  detect_tab_switch: boolean;
  auto_submit_on_time_up: boolean;
  auto_post_to_grades: boolean;
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq_single: 'MCQ Single',
  mcq_multiple: 'MCQ Multi',
  true_false: 'T/F',
  fill_blank: 'Fill Blank',
  short_answer: 'Short',
  essay: 'Essay',
};

export default function ExamBuilder({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useParams();
  const examId = mode === 'edit' ? (params?.id as string) : null;

  const [tab, setTab] = useState<'settings' | 'questions'>('settings');
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classLevels, setClassLevels] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Array<Question & { assigned_points: number }>>([]);
  const [saving, setSaving] = useState(false);
  const [showQuestionPicker, setShowQuestionPicker] = useState(false);

  // Filters for question picker
  const [qFilterType, setQFilterType] = useState('');
  const [qFilterDifficulty, setQFilterDifficulty] = useState('');
  const [qFilterTopic, setQFilterTopic] = useState('');
  const [qSearch, setQSearch] = useState('');

  const [exam, setExam] = useState<ExamData>({
    name: '',
    description: '',
    instructions: 'Read all instructions carefully. Answer all questions. Once you submit, you cannot go back.',
    subject_id: '',
    class_level_id: '',
    term_id: '',
    duration_minutes: 60,
    start_at: '',
    end_at: '',
    passing_score: 50,
    randomize_questions: true,
    randomize_options: true,
    show_results_immediately: false,
    allow_calculator: false,
    attempts_allowed: 1,
    require_fullscreen: true,
    prevent_copy_paste: true,
    detect_tab_switch: true,
    auto_submit_on_time_up: true,
    auto_post_to_grades: true,
  });

  useEffect(() => {
    loadRefs();
    if (mode === 'edit' && examId) loadExam(examId);
  }, [mode, examId]);

  useEffect(() => {
    if (exam.subject_id && exam.class_level_id) {
      loadAvailableQuestions();
    }
  }, [exam.subject_id, exam.class_level_id]);

  async function loadRefs() {
    try {
      const [s, c, t] = await Promise.all([
        fetch('/api/subjects').then((r) => r.json()),
        fetch('/api/class-levels').then((r) => r.json()),
        fetch('/api/terms').then((r) => r.json()),
      ]);
      setSubjects(s.subjects || []);
      setClassLevels(c.class_levels || []);
      setTerms(t.terms || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadExam(id: string) {
    try {
      const res = await fetch(`/api/exams/${id}`);
      const data = await res.json();
      if (data.exam) {
        setExam({
          name: data.exam.name,
          description: data.exam.description || '',
          instructions: data.exam.instructions || '',
          subject_id: data.exam.subject_id,
          class_level_id: data.exam.class_level_id,
          term_id: data.exam.term_id || '',
          duration_minutes: data.exam.duration_minutes,
          start_at: data.exam.start_at ? data.exam.start_at.slice(0, 16) : '',
          end_at: data.exam.end_at ? data.exam.end_at.slice(0, 16) : '',
          passing_score: data.exam.passing_score,
          randomize_questions: data.exam.randomize_questions,
          randomize_options: data.exam.randomize_options,
          show_results_immediately: data.exam.show_results_immediately,
          allow_calculator: data.exam.allow_calculator,
          attempts_allowed: data.exam.attempts_allowed,
          require_fullscreen: data.exam.require_fullscreen,
          prevent_copy_paste: data.exam.prevent_copy_paste,
          detect_tab_switch: data.exam.detect_tab_switch,
          auto_submit_on_time_up: data.exam.auto_submit_on_time_up,
          auto_post_to_grades: data.exam.auto_post_to_grades,
        });
        if (data.exam.exam_questions) {
          setSelectedQuestions(
            data.exam.exam_questions.map((eq: any) => ({
              ...eq.question,
              assigned_points: eq.points,
            }))
          );
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function loadAvailableQuestions() {
    try {
      const res = await fetch(`/api/exams/questions?subject_id=${exam.subject_id}&class_level_id=${exam.class_level_id}`);
      const data = await res.json();
      setAvailableQuestions(data.questions || []);
    } catch (e) {
      console.error(e);
    }
  }

  function update<K extends keyof ExamData>(key: K, value: ExamData[K]) {
    setExam((prev) => ({ ...prev, [key]: value }));
  }

  function addQuestion(q: Question) {
    if (selectedQuestions.find((sq) => sq.id === q.id)) return;
    setSelectedQuestions([...selectedQuestions, { ...q, assigned_points: q.points || 1 }]);
  }

  function removeQuestion(id: string) {
    setSelectedQuestions(selectedQuestions.filter((q) => q.id !== id));
  }

  function updateQuestionPoints(id: string, points: number) {
    setSelectedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, assigned_points: points } : q))
    );
  }

  function moveQuestion(id: string, direction: 'up' | 'down') {
    const idx = selectedQuestions.findIndex((q) => q.id === id);
    if (idx === -1) return;
    const newIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= selectedQuestions.length) return;
    const newArr = [...selectedQuestions];
    [newArr[idx], newArr[newIdx]] = [newArr[newIdx], newArr[idx]];
    setSelectedQuestions(newArr);
  }

  function autoPickQuestions() {
    const pool = availableQuestions.filter((q) => !selectedQuestions.find((sq) => sq.id === q.id));
    let filtered = pool;
    if (qFilterDifficulty) filtered = filtered.filter((q) => q.difficulty === qFilterDifficulty);
    if (qFilterType) filtered = filtered.filter((q) => q.question_type === qFilterType);
    if (qFilterTopic) filtered = filtered.filter((q) => q.topic === qFilterTopic);

    const count = Math.min(10, filtered.length);
    const picked = [...filtered].sort(() => Math.random() - 0.5).slice(0, count);
    setSelectedQuestions([
      ...selectedQuestions,
      ...picked.map((q) => ({ ...q, assigned_points: q.points || 1 })),
    ]);
  }

  const totalPoints = useMemo(
    () => selectedQuestions.reduce((s, q) => s + Number(q.assigned_points || 0), 0),
    [selectedQuestions]
  );

  const uniqueTopics = useMemo(() => {
    const t = new Set<string>();
    availableQuestions.forEach((q) => q.topic && t.add(q.topic));
    return Array.from(t).sort();
  }, [availableQuestions]);

  const filteredAvailable = useMemo(() => {
    return availableQuestions.filter((q) => {
      if (selectedQuestions.find((sq) => sq.id === q.id)) return false;
      if (qSearch && !q.question_text.toLowerCase().includes(qSearch.toLowerCase())) return false;
      if (qFilterType && q.question_type !== qFilterType) return false;
      if (qFilterDifficulty && q.difficulty !== qFilterDifficulty) return false;
      if (qFilterTopic && q.topic !== qFilterTopic) return false;
      return true;
    });
  }, [availableQuestions, selectedQuestions, qSearch, qFilterType, qFilterDifficulty, qFilterTopic]);

  async function handleSave(publish = false) {
    if (!exam.name.trim()) return alert('Exam name is required');
    if (!exam.subject_id || !exam.class_level_id) return alert('Select subject and class');
    if (selectedQuestions.length === 0) return alert('Add at least one question');

    setSaving(true);
    try {
      const payload = {
        ...exam,
        start_at: exam.start_at || null,
        end_at: exam.end_at || null,
        term_id: exam.term_id || null,
        status: publish ? 'scheduled' : 'draft',
        questions: selectedQuestions.map((q, i) => ({
          question_id: q.id,
          display_order: i,
          points: q.assigned_points,
        })),
      };

      const url = mode === 'edit' ? `/api/exams/${examId}` : '/api/exams';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/dashboard/exams');
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Save failed: ' + (err.error || res.statusText));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6">
      <Link
        href="/dashboard/exams"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Exams
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === 'edit' ? 'Edit Exam' : 'Create New Exam'}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Compose an exam from your question bank</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200">
        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'settings' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings className="w-4 h-4 inline mr-1" /> Settings
        </button>
        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
            tab === 'questions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <ListChecks className="w-4 h-4 inline mr-1" />
          Questions ({selectedQuestions.length})
          {totalPoints > 0 && <span className="text-xs text-gray-500 ml-1">· {totalPoints} pts</span>}
        </button>
      </div>

      {tab === 'settings' && (
        <div className="space-y-5">
          {/* Basic info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Basic Info</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Exam Name *</label>
                <input
                  type="text"
                  value={exam.name}
                  onChange={(e) => update('name', e.target.value)}
                  placeholder="e.g. First Term Mathematics Exam"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  value={exam.description}
                  onChange={(e) => update('description', e.target.value)}
                  placeholder="Short description shown to teachers"
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
                  <select
                    value={exam.subject_id}
                    onChange={(e) => update('subject_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {subjects.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Class *</label>
                  <select
                    value={exam.class_level_id}
                    onChange={(e) => update('class_level_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {classLevels.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Term</label>
                  <select
                    value={exam.term_id}
                    onChange={(e) => update('term_id', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Select</option>
                    {terms.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Instructions for Students</label>
                <textarea
                  value={exam.instructions}
                  onChange={(e) => update('instructions', e.target.value)}
                  rows={3}
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Timing */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Timer className="w-4 h-4" /> Timing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (min) *</label>
                <input
                  type="number"
                  min={1}
                  value={exam.duration_minutes}
                  onChange={(e) => update('duration_minutes', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Available From</label>
                <input
                  type="datetime-local"
                  value={exam.start_at}
                  onChange={(e) => update('start_at', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Available Until</label>
                <input
                  type="datetime-local"
                  value={exam.end_at}
                  onChange={(e) => update('end_at', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Scoring */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Scoring</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Passing Score (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={exam.passing_score}
                  onChange={(e) => update('passing_score', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attempts Allowed</label>
                <input
                  type="number"
                  min={1}
                  value={exam.attempts_allowed}
                  onChange={(e) => update('attempts_allowed', Number(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 pb-2">
                  <input
                    type="checkbox"
                    checked={exam.auto_post_to_grades}
                    onChange={(e) => update('auto_post_to_grades', e.target.checked)}
                  />
                  Auto-post scores to Grades
                </label>
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Options</h3>
            <div className="space-y-2">
              <Toggle
                icon={<Shuffle className="w-4 h-4" />}
                label="Randomize question order per student"
                checked={exam.randomize_questions}
                onChange={(v) => update('randomize_questions', v)}
              />
              <Toggle
                icon={<Shuffle className="w-4 h-4" />}
                label="Randomize answer options per student"
                checked={exam.randomize_options}
                onChange={(v) => update('randomize_options', v)}
              />
              <Toggle
                icon={<Calculator className="w-4 h-4" />}
                label="Allow scientific calculator (Math/Physics)"
                checked={exam.allow_calculator}
                onChange={(v) => update('allow_calculator', v)}
              />
              <Toggle
                icon={<Eye className="w-4 h-4" />}
                label="Show results immediately after submission"
                checked={exam.show_results_immediately}
                onChange={(v) => update('show_results_immediately', v)}
              />
            </div>
          </div>

          {/* Anti-cheat */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Anti-Cheating</h3>
            <div className="space-y-2">
              <Toggle
                label="Require full-screen mode"
                checked={exam.require_fullscreen}
                onChange={(v) => update('require_fullscreen', v)}
              />
              <Toggle
                label="Prevent copy/paste"
                checked={exam.prevent_copy_paste}
                onChange={(v) => update('prevent_copy_paste', v)}
              />
              <Toggle
                label="Detect tab switching"
                checked={exam.detect_tab_switch}
                onChange={(v) => update('detect_tab_switch', v)}
              />
              <Toggle
                label="Auto-submit when time is up"
                checked={exam.auto_submit_on_time_up}
                onChange={(v) => update('auto_submit_on_time_up', v)}
              />
            </div>
          </div>
        </div>
      )}

      {tab === 'questions' && (
        <div>
          {!exam.subject_id || !exam.class_level_id ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              Please select a Subject and Class in the Settings tab first to see available questions.
            </div>
          ) : (
            <>
              {/* Question picker toolbar */}
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
                <div className="flex flex-wrap gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search available questions..."
                    value={qSearch}
                    onChange={(e) => setQSearch(e.target.value)}
                    className="flex-1 min-w-0 px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
                  />
                  <select
                    value={qFilterType}
                    onChange={(e) => setQFilterType(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Any type</option>
                    {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                  <select
                    value={qFilterDifficulty}
                    onChange={(e) => setQFilterDifficulty(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Any difficulty</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                  <select
                    value={qFilterTopic}
                    onChange={(e) => setQFilterTopic(e.target.value)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm bg-white"
                  >
                    <option value="">Any topic</option>
                    {uniqueTopics.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <button
                    onClick={autoPickQuestions}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Shuffle className="w-3 h-3" /> Auto-pick 10
                  </button>
                </div>
                <div className="text-xs text-gray-500">
                  {filteredAvailable.length} available · {selectedQuestions.length} added
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {/* Available */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Available Questions</h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredAvailable.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        {availableQuestions.length === 0 ? 'No questions in bank yet' : 'No questions match filter'}
                      </div>
                    ) : (
                      filteredAvailable.map((q) => (
                        <button
                          key={q.id}
                          onClick={() => addQuestion(q)}
                          className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50"
                        >
                          <div className="flex items-center gap-1 mb-1 text-xs">
                            <span className="text-indigo-700 font-medium">{QUESTION_TYPE_LABELS[q.question_type]}</span>
                            <span className="text-gray-400">·</span>
                            <span className="capitalize text-gray-600">{q.difficulty}</span>
                            {q.topic && <>
                              <span className="text-gray-400">·</span>
                              <span className="text-purple-600">{q.topic}</span>
                            </>}
                          </div>
                          <div className="text-sm text-gray-900 line-clamp-2" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Selected */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    In This Exam · {totalPoints} points total
                  </h3>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {selectedQuestions.length === 0 ? (
                      <div className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
                        No questions added yet. Click questions on the left to add them.
                      </div>
                    ) : (
                      selectedQuestions.map((q, idx) => (
                        <div key={q.id} className="p-3 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-start gap-2">
                            <div className="flex flex-col gap-0.5">
                              <button
                                onClick={() => moveQuestion(q.id, 'up')}
                                disabled={idx === 0}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              >▲</button>
                              <span className="text-xs text-gray-400 text-center">{idx + 1}</span>
                              <button
                                onClick={() => moveQuestion(q.id, 'down')}
                                disabled={idx === selectedQuestions.length - 1}
                                className="text-gray-400 hover:text-gray-700 disabled:opacity-30"
                              >▼</button>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1 mb-1 text-xs">
                                <span className="text-indigo-700 font-medium">{QUESTION_TYPE_LABELS[q.question_type]}</span>
                                <span className="text-gray-400">·</span>
                                <span className="capitalize text-gray-600">{q.difficulty}</span>
                              </div>
                              <div className="text-sm text-gray-900 line-clamp-2 mb-2" dangerouslySetInnerHTML={{ __html: q.question_text }} />
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-gray-600">Points:</label>
                                <input
                                  type="number"
                                  min={0.5}
                                  step={0.5}
                                  value={q.assigned_points}
                                  onChange={(e) => updateQuestionPoints(q.id, Number(e.target.value))}
                                  className="w-16 p-1 border border-gray-300 rounded text-xs"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeQuestion(q.id)}
                              className="p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bottom action bar */}
      <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sticky bottom-4 bg-white border border-gray-200 rounded-xl p-4 shadow-md">
        <div className="text-sm text-gray-600">
          <strong className="text-gray-900">{selectedQuestions.length}</strong> questions ·
          <strong className="text-gray-900 mx-1">{totalPoints}</strong> points ·
          <strong className="text-gray-900 mx-1">{exam.duration_minutes}</strong> min
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm disabled:opacity-50"
          >
            <Play className="w-4 h-4" /> {saving ? 'Publishing...' : 'Save & Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toggle({ icon, label, checked, onChange }: { icon?: React.ReactNode; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
      <span className="text-sm text-gray-700 flex items-center gap-2">
        {icon}
        {label}
      </span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-indigo-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </label>
  );
}
