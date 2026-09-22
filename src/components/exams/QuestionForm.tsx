'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, X, Plus, Trash2, Save, Bold, Italic, Superscript, Subscript, Sigma } from 'lucide-react';

type QuestionType = 'mcq_single' | 'mcq_multiple' | 'true_false' | 'fill_blank' | 'short_answer' | 'essay';

type Option = {
  id: string;
  text: string;
  image_url: string | null;
  is_correct: boolean;
};

type Bank = {
  id: string;
  name: string;
  subject_id: string;
  class_level_id: string;
  subject?: { name: string };
  class_level?: { name: string };
};

type Subject = { id: string; name: string };
type ClassLevel = { id: string; name: string };

const QUESTION_TYPES: Array<{ value: QuestionType; label: string; description: string }> = [
  { value: 'mcq_single', label: 'Multiple Choice (Single Answer)', description: 'Student picks ONE correct option (WAEC/JAMB standard)' },
  { value: 'mcq_multiple', label: 'Multiple Choice (Multiple Answers)', description: 'Student picks ALL correct options' },
  { value: 'true_false', label: 'True / False', description: 'Simple binary answer' },
  { value: 'fill_blank', label: 'Fill in the Blank', description: 'Short typed answer, auto-checked against accepted answers' },
  { value: 'short_answer', label: 'Short Answer', description: 'One or two sentences, graded manually' },
  { value: 'essay', label: 'Essay / Theory', description: 'Long-form answer, graded manually' },
];

// Common math symbols and equations for teachers to insert quickly
const MATH_SYMBOLS = [
  { label: 'π', value: 'π' },
  { label: '√', value: '√' },
  { label: '²', value: '²' },
  { label: '³', value: '³' },
  { label: '°', value: '°' },
  { label: '±', value: '±' },
  { label: '×', value: '×' },
  { label: '÷', value: '÷' },
  { label: '≤', value: '≤' },
  { label: '≥', value: '≥' },
  { label: '≠', value: '≠' },
  { label: '≈', value: '≈' },
  { label: '∞', value: '∞' },
  { label: '∑', value: '∑' },
  { label: '∫', value: '∫' },
  { label: 'α', value: 'α' },
  { label: 'β', value: 'β' },
  { label: 'θ', value: 'θ' },
  { label: 'Δ', value: 'Δ' },
  { label: 'μ', value: 'μ' },
];

export default function QuestionForm({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const router = useRouter();
  const params = useParams();
  const questionId = mode === 'edit' ? (params?.id as string) : null;

  const [banks, setBanks] = useState<Bank[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);

  // Form state
  const [questionType, setQuestionType] = useState<QuestionType>('mcq_single');
  const [subjectId, setSubjectId] = useState('');
  const [classLevelId, setClassLevelId] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [topic, setTopic] = useState('');
  const [points, setPoints] = useState(1);
  const [questionText, setQuestionText] = useState('');
  const [questionImageUrl, setQuestionImageUrl] = useState<string | null>(null);
  const [explanation, setExplanation] = useState('');

  // Type-specific state
  const [options, setOptions] = useState<Option[]>([
    { id: 'a', text: '', image_url: null, is_correct: false },
    { id: 'b', text: '', image_url: null, is_correct: false },
    { id: 'c', text: '', image_url: null, is_correct: false },
    { id: 'd', text: '', image_url: null, is_correct: false },
  ]);
  const [trueFalseAnswer, setTrueFalseAnswer] = useState<boolean>(true);
  const [acceptableAnswers, setAcceptableAnswers] = useState<string>('');
  const [caseSensitive, setCaseSensitive] = useState(false);

  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    loadRefData();
    if (mode === 'edit' && questionId) loadQuestion(questionId);
  }, [mode, questionId]);

  async function loadRefData() {
    try {
      const [bRes, sRes, cRes] = await Promise.all([
        fetch('/api/exams/question-banks').then((r) => r.json()),
        fetch('/api/subjects').then((r) => r.json()),
        fetch('/api/class-levels').then((r) => r.json()),
      ]);
      setBanks(bRes.banks || []);
      setSubjects(sRes.subjects || []);
      setClassLevels(cRes.class_levels || []);
    } catch (e) {
      console.error(e);
    }
  }

  async function loadQuestion(id: string) {
    try {
      const res = await fetch(`/api/exams/questions/${id}`);
      const data = await res.json();
      const q = data.question;
      if (!q) return;

      setQuestionType(q.question_type);
      setDifficulty(q.difficulty);
      setTopic(q.topic || '');
      setPoints(q.points);
      setQuestionText(q.question_text);
      setQuestionImageUrl(q.question_image_url);
      setExplanation(q.explanation || '');
      setSubjectId(q.bank?.subject_id || '');
      setClassLevelId(q.bank?.class_level_id || '');

      if (q.options && Array.isArray(q.options)) setOptions(q.options);
      if (q.correct_answer?.correct !== undefined) setTrueFalseAnswer(q.correct_answer.correct);
      if (q.acceptable_answers?.acceptable_answers) {
        setAcceptableAnswers(q.acceptable_answers.acceptable_answers.join(', '));
        setCaseSensitive(!!q.acceptable_answers.case_sensitive);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function insertSymbol(sym: string) {
    setQuestionText((prev) => prev + sym);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>, target: 'question' | number) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/exams/upload-image', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        if (target === 'question') {
          setQuestionImageUrl(data.url);
        } else {
          setOptions((prev) => prev.map((o, i) => (i === target ? { ...o, image_url: data.url } : o)));
        }
      }
    } catch (e) {
      alert('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  }

  function addOption() {
    if (options.length >= 6) return;
    const nextId = String.fromCharCode(97 + options.length);
    setOptions([...options, { id: nextId, text: '', image_url: null, is_correct: false }]);
  }

  function removeOption(idx: number) {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== idx));
  }

  function updateOption(idx: number, field: keyof Option, value: any) {
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i !== idx) {
          // For single answer MCQ, uncheck others when this one is checked
          if (field === 'is_correct' && value === true && questionType === 'mcq_single') {
            return { ...o, is_correct: false };
          }
          return o;
        }
        return { ...o, [field]: value };
      })
    );
  }

  async function handleSave() {
    // Validation
    if (!subjectId || !classLevelId) {
      alert('Please select subject and class');
      return;
    }
    if (!questionText.trim()) {
      alert('Please enter the question');
      return;
    }
    if (questionType === 'mcq_single' || questionType === 'mcq_multiple') {
      const filled = options.filter((o) => o.text.trim());
      if (filled.length < 2) return alert('At least 2 options required');
      const correct = options.filter((o) => o.is_correct);
      if (correct.length === 0) return alert('Mark at least one correct option');
      if (questionType === 'mcq_single' && correct.length > 1) return alert('Only ONE option should be correct for single-answer MCQ');
    }
    if (questionType === 'fill_blank' && !acceptableAnswers.trim()) {
      return alert('Enter at least one acceptable answer');
    }

    setSaving(true);
    try {
      // Find or create question bank for this subject+class combo
      const bank = banks.find((b) => b.subject_id === subjectId && b.class_level_id === classLevelId);
      let bankId = bank?.id;
      if (!bankId) {
        // Auto-create a bank if none exists
        const bRes = await fetch('/api/exams/question-banks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject_id: subjectId,
            class_level_id: classLevelId,
            name: 'Default',
          }),
        });
        const bData = await bRes.json();
        bankId = bData.bank?.id;
      }
      if (!bankId) throw new Error('Could not create question bank');

      const payload: any = {
        bank_id: bankId,
        question_type: questionType,
        difficulty,
        topic: topic.trim() || null,
        question_text: questionText,
        question_image_url: questionImageUrl,
        explanation: explanation.trim() || null,
        points,
        options: null,
        correct_answer: null,
        acceptable_answers: null,
      };

      if (questionType === 'mcq_single' || questionType === 'mcq_multiple') {
        payload.options = options.filter((o) => o.text.trim());
      } else if (questionType === 'true_false') {
        payload.correct_answer = { correct: trueFalseAnswer };
      } else if (questionType === 'fill_blank') {
        payload.acceptable_answers = {
          acceptable_answers: acceptableAnswers.split(',').map((s) => s.trim()).filter(Boolean),
          case_sensitive: caseSensitive,
        };
      }

      const url = mode === 'edit' ? `/api/exams/questions/${questionId}` : '/api/exams/questions';
      const method = mode === 'edit' ? 'PATCH' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/dashboard/exams/questions');
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <Link
        href="/dashboard/exams/questions"
        className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Question Bank
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">
        {mode === 'edit' ? 'Edit Question' : 'Add New Question'}
      </h1>
      <p className="text-sm text-gray-500 mb-6">Create a question for exams and tests</p>

      <div className="space-y-5">
        {/* Question Type */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question Type</label>
          <select
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as QuestionType)}
            className="w-full p-2.5 border border-gray-300 rounded-lg bg-white text-sm"
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">
            {QUESTION_TYPES.find((t) => t.value === questionType)?.description}
          </p>
        </div>

        {/* Subject / Class / Meta */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Subject *</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="">Select subject</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="col-span-2 md:col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Class *</label>
            <select
              value={classLevelId}
              onChange={(e) => setClassLevelId(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="">Select class</option>
              {classLevels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Difficulty</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white text-sm"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Points</label>
            <input
              type="number"
              min={1}
              value={points}
              onChange={(e) => setPoints(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="col-span-2 md:col-span-2">
            <label className="block text-xs font-semibold text-gray-700 mb-1">Topic (optional)</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Algebra, Photosynthesis"
              className="w-full p-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Question text */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">Question *</label>

          {/* Math symbols toolbar */}
          <div className="mb-2 flex flex-wrap gap-1 p-2 bg-gray-50 border border-gray-200 rounded-lg">
            <span className="text-xs text-gray-500 mr-2 flex items-center">
              <Sigma className="w-3 h-3 mr-1" /> Insert:
            </span>
            {MATH_SYMBOLS.map((s) => (
              <button
                key={s.label}
                type="button"
                onClick={() => insertSymbol(s.value)}
                className="w-7 h-7 flex items-center justify-center text-sm bg-white border border-gray-200 rounded hover:bg-indigo-50 hover:border-indigo-300"
              >
                {s.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => insertSymbol('<sup>2</sup>')}
              className="px-2 h-7 flex items-center text-xs bg-white border border-gray-200 rounded hover:bg-indigo-50"
            >
              x²
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('<sub>n</sub>')}
              className="px-2 h-7 flex items-center text-xs bg-white border border-gray-200 rounded hover:bg-indigo-50"
            >
              x_n
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('<b></b>')}
              className="px-2 h-7 flex items-center bg-white border border-gray-200 rounded hover:bg-indigo-50"
            >
              <Bold className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => insertSymbol('<i></i>')}
              className="px-2 h-7 flex items-center bg-white border border-gray-200 rounded hover:bg-indigo-50"
            >
              <Italic className="w-3 h-3" />
            </button>
          </div>

          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            rows={4}
            placeholder="Type your question here. Use symbols above for math. Example: What is √16 + π² ?"
            className="w-full p-3 border border-gray-300 rounded-lg text-sm font-mono"
          />

          <p className="mt-1 text-xs text-gray-500">
            Tip: For complex equations, upload an image instead. HTML tags (b, i, sup, sub) are supported.
          </p>

          {/* Question image */}
          <div className="mt-3">
            {questionImageUrl ? (
              <div className="relative inline-block">
                <img src={questionImageUrl} alt="Question" className="max-h-40 rounded border border-gray-200" />
                <button
                  type="button"
                  onClick={() => setQuestionImageUrl(null)}
                  className="absolute top-1 right-1 bg-white/90 p-1 rounded-full hover:bg-red-50"
                >
                  <X className="w-3 h-3 text-red-600" />
                </button>
              </div>
            ) : (
              <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>{uploadingImage ? 'Uploading...' : 'Add image (diagram, equation, map)'}</span>
                <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'question')} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* Type-specific answer section */}
        {(questionType === 'mcq_single' || questionType === 'mcq_multiple') && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-gray-700">
                Options {questionType === 'mcq_single' ? '(mark ONE correct)' : '(mark ALL correct)'}
              </label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add option
                </button>
              )}
            </div>

            <div className="space-y-2">
              {options.map((opt, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-2 p-3 border rounded-lg ${
                    opt.is_correct ? 'border-green-400 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <input
                    type={questionType === 'mcq_single' ? 'radio' : 'checkbox'}
                    name="correct"
                    checked={opt.is_correct}
                    onChange={(e) => updateOption(idx, 'is_correct', e.target.checked)}
                    className="mt-2"
                  />
                  <div className="flex-1">
                    <div className="text-xs font-medium text-gray-500 mb-1">
                      Option {String.fromCharCode(65 + idx)}
                    </div>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => updateOption(idx, 'text', e.target.value)}
                      placeholder={`Text for option ${String.fromCharCode(65 + idx)}`}
                      className="w-full p-2 border border-gray-300 rounded text-sm"
                    />
                    {opt.image_url ? (
                      <div className="mt-2 relative inline-block">
                        <img src={opt.image_url} alt={`Option ${idx + 1}`} className="max-h-20 rounded border" />
                        <button
                          type="button"
                          onClick={() => updateOption(idx, 'image_url', null)}
                          className="absolute top-1 right-1 bg-white/90 p-0.5 rounded-full"
                        >
                          <X className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    ) : (
                      <label className="mt-1 inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 cursor-pointer">
                        <Upload className="w-3 h-3" />
                        <span>Add image</span>
                        <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, idx)} className="hidden" />
                      </label>
                    )}
                  </div>
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(idx)}
                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {questionType === 'true_false' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Correct Answer</label>
            <div className="space-y-2">
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                trueFalseAnswer ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}>
                <input type="radio" checked={trueFalseAnswer} onChange={() => setTrueFalseAnswer(true)} />
                <span className="font-medium">True</span>
              </label>
              <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${
                !trueFalseAnswer ? 'border-green-400 bg-green-50' : 'border-gray-200'
              }`}>
                <input type="radio" checked={!trueFalseAnswer} onChange={() => setTrueFalseAnswer(false)} />
                <span className="font-medium">False</span>
              </label>
            </div>
          </div>
        )}

        {questionType === 'fill_blank' && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Acceptable Answers</label>
            <p className="text-xs text-gray-500 mb-2">
              Enter all acceptable answers separated by commas. Student's answer must match one of these.
            </p>
            <textarea
              value={acceptableAnswers}
              onChange={(e) => setAcceptableAnswers(e.target.value)}
              rows={2}
              placeholder="e.g. Lagos, lagos, LAGOS, Lagos State"
              className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
            />
            <label className="mt-2 inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={caseSensitive}
                onChange={(e) => setCaseSensitive(e.target.checked)}
              />
              Case-sensitive matching
            </label>
          </div>
        )}

        {(questionType === 'short_answer' || questionType === 'essay') && (
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900">
              <strong>Manual grading:</strong> This question type will be graded by a teacher after the student submits.
              Students will see a {questionType === 'essay' ? 'large' : 'small'} text area to write their answer.
            </div>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Explanation <span className="font-normal text-gray-500">(optional, shown after submit)</span>
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            rows={2}
            placeholder="Explain why the correct answer is right. Helps students learn."
            className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
          />
        </div>

        {/* Save */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/dashboard/exams/questions"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
          >
            Cancel
          </Link>
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : mode === 'edit' ? 'Update Question' : 'Save Question'}
          </button>
        </div>
      </div>
    </div>
  );
}
