'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Clock, Calculator, Flag, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Send, Menu, X } from 'lucide-react';
import ScientificCalculator from '@/components/cbt/ScientificCalculator';

type Question = {
  id: string;
  exam_question_id: string;
  question_type: string;
  question_text: string;
  question_image_url: string | null;
  options: any[] | null;
  points_available: number;
};

type ExamData = {
  id: string;
  name: string;
  duration_minutes: number;
  allow_calculator: boolean;
  require_fullscreen: boolean;
  prevent_copy_paste: boolean;
  detect_tab_switch: boolean;
  auto_submit_on_time_up: boolean;
  randomize_options: boolean;
  instructions: string;
  passing_score: number;
};

type Session = {
  id: string;
  expires_at: string;
  current_question_index: number;
  status: string;
};

type Answer = {
  answer: any;
  flagged_for_review?: boolean;
};

export default function TakeExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.examId as string;

  const [phase, setPhase] = useState<'loading' | 'instructions' | 'taking' | 'submitting' | 'submitted'>('loading');
  const [exam, setExam] = useState<ExamData | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const clockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load exam + start session
  useEffect(() => {
    loadExam();
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, [examId]);

  // Timer
  useEffect(() => {
    if (phase !== 'taking' || !session) return;
    clockTimerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(session.expires_at).getTime() - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      if (remaining === 0 && exam?.auto_submit_on_time_up) {
        handleSubmit(true);
      }
    }, 1000);
    return () => {
      if (clockTimerRef.current) clearInterval(clockTimerRef.current);
    };
  }, [phase, session, exam]);

  // Auto-save every 10 seconds
  useEffect(() => {
    if (phase !== 'taking') return;
    saveTimerRef.current = setInterval(() => {
      saveAnswers();
    }, 10000);
    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [phase, answers, currentIdx]);

  // Anti-cheat: detect tab switch
  useEffect(() => {
    if (phase !== 'taking' || !exam?.detect_tab_switch) return;
    function onVisibilityChange() {
      if (document.hidden) {
        setTabSwitches((n) => n + 1);
        setWarnings((w) => [...w, `⚠️ Tab switch detected (${new Date().toLocaleTimeString()})`]);
        fetch(`/api/cbt/sessions/${session?.id}/violation`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'tab_switch' }),
        }).catch(() => {});
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [phase, exam, session]);

  // Anti-cheat: block copy/paste
  useEffect(() => {
    if (phase !== 'taking' || !exam?.prevent_copy_paste) return;
    function onCopyPaste(e: ClipboardEvent) {
      e.preventDefault();
      setWarnings((w) => [...w, `⚠️ Copy/paste blocked (${new Date().toLocaleTimeString()})`]);
    }
    function onContextMenu(e: MouseEvent) {
      e.preventDefault();
    }
    document.addEventListener('copy', onCopyPaste);
    document.addEventListener('paste', onCopyPaste);
    document.addEventListener('cut', onCopyPaste);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('copy', onCopyPaste);
      document.removeEventListener('paste', onCopyPaste);
      document.removeEventListener('cut', onCopyPaste);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [phase, exam]);

  // Warn before leaving page
  useEffect(() => {
    if (phase !== 'taking') return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = 'Are you sure? Your exam progress will be saved but you should not leave.';
      return e.returnValue;
    }
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [phase]);

  async function loadExam() {
    try {
      const res = await fetch(`/api/cbt/exams/${examId}/start`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to load exam');
        router.push('/cbt/exams');
        return;
      }
      setExam(data.exam);
      setSession(data.session);
      setQuestions(data.questions);
      // Restore prior answers if any
      const priorAnswers: Record<string, Answer> = {};
      (data.answers || []).forEach((a: any) => {
        priorAnswers[a.question_id] = { answer: a.answer, flagged_for_review: a.flagged_for_review };
      });
      setAnswers(priorAnswers);
      setCurrentIdx(data.session.current_question_index || 0);
      const remaining = Math.max(0, Math.floor((new Date(data.session.expires_at).getTime() - Date.now()) / 1000));
      setRemainingSeconds(remaining);
      setPhase(data.session.current_question_index > 0 || Object.keys(priorAnswers).length > 0 ? 'taking' : 'instructions');
    } catch (e) {
      alert('Error loading exam');
      router.push('/cbt/exams');
    }
  }

  async function beginExam() {
    if (exam?.require_fullscreen && document.documentElement.requestFullscreen) {
      try { await document.documentElement.requestFullscreen(); } catch (e) {}
    }
    setPhase('taking');
  }

  function updateAnswer(questionId: string, answerValue: any) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], answer: answerValue },
    }));
  }

  function toggleFlag(questionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], flagged_for_review: !prev[questionId]?.flagged_for_review },
    }));
  }

  async function saveAnswers() {
    if (!session) return;
    try {
      await fetch(`/api/cbt/sessions/${session.id}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: Object.entries(answers).map(([qid, a]) => ({
            question_id: qid,
            answer: a.answer,
            flagged_for_review: a.flagged_for_review || false,
          })),
          current_question_index: currentIdx,
        }),
      });
    } catch (e) {}
  }

  async function handleSubmit(auto = false) {
    if (!auto && !confirm('Submit exam? You cannot change your answers after submitting.')) return;
    setPhase('submitting');
    try {
      await saveAnswers();
      const res = await fetch(`/api/cbt/sessions/${session?.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ auto_submitted: auto, tab_switches: tabSwitches }),
      });
      const data = await res.json();
      setPhase('submitted');
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      // Show result briefly then redirect
      setTimeout(() => router.push('/cbt/exams'), 3000);
    } catch (e) {
      alert('Submit failed. Try again.');
      setPhase('taking');
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.keys(answers).filter((k) => answers[k]?.answer !== undefined && answers[k]?.answer !== null && answers[k]?.answer !== '').length;
  const flaggedCount = Object.values(answers).filter((a) => a?.flagged_for_review).length;
  const timeUrgent = remainingSeconds < 300; // Under 5 min

  // ===== PHASES =====

  if (phase === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading exam...</div>
      </div>
    );
  }

  if (phase === 'instructions') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{exam?.name}</h1>
          <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-6">
            <span className="inline-flex items-center gap-1"><Clock className="w-4 h-4" /> {exam?.duration_minutes} minutes</span>
            <span>{questions.length} questions</span>
            {exam?.allow_calculator && (
              <span className="inline-flex items-center gap-1 text-indigo-600"><Calculator className="w-4 h-4" /> Calculator allowed</span>
            )}
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
            <p className="text-sm text-blue-900 whitespace-pre-line">{exam?.instructions}</p>
          </div>

          {(exam?.require_fullscreen || exam?.prevent_copy_paste || exam?.detect_tab_switch) && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Exam Rules
              </h3>
              <ul className="text-sm text-yellow-900 space-y-1">
                {exam.require_fullscreen && <li>• Exam runs in full-screen mode. Exiting is tracked.</li>}
                {exam.prevent_copy_paste && <li>• Copy, paste, and right-click are disabled.</li>}
                {exam.detect_tab_switch && <li>• Switching tabs or windows is detected and reported.</li>}
                {exam.auto_submit_on_time_up && <li>• When time runs out, your exam is auto-submitted.</li>}
              </ul>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/cbt/exams')}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
            >
              Cancel
            </button>
            <button
              onClick={beginExam}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold"
            >
              Begin Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'submitting' || phase === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="text-center">
          {phase === 'submitting' ? (
            <>
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <div className="text-lg font-medium text-gray-900">Submitting your exam...</div>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-9 h-9 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Exam Submitted!</h1>
              <p className="text-gray-600 mb-2">Your answers have been recorded successfully.</p>
              <p className="text-sm text-gray-500">Redirecting to your exam list...</p>
            </>
          )}
        </div>
      </div>
    );
  }

  // ===== EXAM TAKING PHASE =====

  return (
    <div className="min-h-screen bg-gray-50 select-none">
      {/* Fixed header with timer */}
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">{exam?.name}</div>
            <div className="text-xs text-gray-500">Question {currentIdx + 1} of {questions.length}</div>
          </div>
          <div className="flex items-center gap-2">
            {exam?.allow_calculator && (
              <button
                onClick={() => setShowCalculator(!showCalculator)}
                className={`p-2 rounded-lg ${showCalculator ? 'bg-indigo-600 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                title="Toggle calculator"
              >
                <Calculator className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowGrid(!showGrid)}
              className="p-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              title="Question navigator"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono font-bold text-sm ${
              timeUrgent ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-700'
            }`}>
              <Clock className="w-4 h-4" />
              {formatTime(remainingSeconds)}
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className="h-full bg-indigo-600 transition-all"
            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto pt-24 pb-32 px-4">
        {currentQuestion && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="text-xs text-gray-500">
                <span className="font-medium text-gray-700">Question {currentIdx + 1}</span> · {currentQuestion.points_available} {currentQuestion.points_available === 1 ? 'point' : 'points'}
              </div>
              <button
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg ${
                  answers[currentQuestion.id]?.flagged_for_review
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Flag className="w-3 h-3" />
                {answers[currentQuestion.id]?.flagged_for_review ? 'Flagged' : 'Flag for review'}
              </button>
            </div>

            <div className="text-lg text-gray-900 mb-5" dangerouslySetInnerHTML={{ __html: currentQuestion.question_text }} />

            {currentQuestion.question_image_url && (
              <div className="mb-5">
                <img
                  src={currentQuestion.question_image_url}
                  alt="Question"
                  className="max-w-full rounded-lg border border-gray-200"
                />
              </div>
            )}

            <AnswerInput
              question={currentQuestion}
              value={answers[currentQuestion.id]?.answer}
              onChange={(v) => updateAnswer(currentQuestion.id, v)}
            />
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-4">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="inline-flex items-center gap-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium disabled:opacity-40 hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>
          <div className="text-sm text-gray-600">
            <strong className="text-gray-900">{answeredCount}</strong>/{questions.length} answered
            {flaggedCount > 0 && <span className="ml-2 text-yellow-600">· {flaggedCount} flagged</span>}
          </div>
          {currentIdx < questions.length - 1 ? (
            <button
              onClick={() => setCurrentIdx(currentIdx + 1)}
              className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="inline-flex items-center gap-1 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700"
            >
              <Send className="w-4 h-4" /> Submit
            </button>
          )}
        </div>
      </main>

      {/* Question navigator grid (sidebar) */}
      {showGrid && (
        <div className="fixed inset-0 bg-black/40 z-30" onClick={() => setShowGrid(false)}>
          <aside
            className="absolute right-0 top-0 bottom-0 w-80 bg-white shadow-2xl p-4 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">Question Navigator</h3>
              <button onClick={() => setShowGrid(false)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mb-3 text-xs">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-indigo-600"></span> Current</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500"></span> Answered</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Flagged</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-200"></span> Skipped</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {questions.map((q, i) => {
                const isAnswered = !!answers[q.id]?.answer;
                const isFlagged = !!answers[q.id]?.flagged_for_review;
                const isCurrent = i === currentIdx;
                return (
                  <button
                    key={q.id}
                    onClick={() => { setCurrentIdx(i); setShowGrid(false); }}
                    className={`aspect-square rounded-lg text-sm font-semibold border-2 transition-colors ${
                      isCurrent ? 'bg-indigo-600 text-white border-indigo-700' :
                      isAnswered ? 'bg-green-500 text-white border-green-600' :
                      isFlagged ? 'bg-yellow-400 text-gray-900 border-yellow-500' :
                      'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => { setShowGrid(false); setShowSubmitConfirm(true); }}
              className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm"
            >
              Submit Exam
            </button>
          </aside>
        </div>
      )}

      {/* Submit confirmation */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Submit Exam?</h3>
                <p className="text-sm text-gray-500">This cannot be undone.</p>
              </div>
            </div>

            <div className="space-y-2 mb-5 text-sm bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Answered:</span>
                <strong className="text-green-600">{answeredCount} / {questions.length}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unanswered:</span>
                <strong className={questions.length - answeredCount > 0 ? 'text-red-600' : 'text-gray-900'}>
                  {questions.length - answeredCount}
                </strong>
              </div>
              {flaggedCount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Flagged for review:</span>
                  <strong className="text-yellow-600">{flaggedCount}</strong>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Time remaining:</span>
                <strong className="text-gray-900">{formatTime(remainingSeconds)}</strong>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm"
              >
                Keep Working
              </button>
              <button
                onClick={() => { setShowSubmitConfirm(false); handleSubmit(false); }}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm"
              >
                Submit Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calculator overlay */}
      {showCalculator && exam?.allow_calculator && (
        <ScientificCalculator onClose={() => setShowCalculator(false)} />
      )}

      {/* Warning banner (temporary, self-dismisses) */}
      {warnings.length > 0 && (
        <div className="fixed bottom-4 left-4 z-30 max-w-xs">
          {warnings.slice(-1).map((w, i) => (
            <div key={i} className="bg-red-600 text-white text-xs px-3 py-2 rounded-lg shadow-lg">
              {w}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AnswerInput({ question, value, onChange }: { question: Question; value: any; onChange: (v: any) => void }) {
  if (question.question_type === 'mcq_single') {
    return (
      <div className="space-y-2">
        {(question.options || []).map((opt: any, i: number) => (
          <label
            key={opt.id || i}
            className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
              value === opt.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <input
              type="radio"
              name="answer"
              value={opt.id}
              checked={value === opt.id}
              onChange={() => onChange(opt.id)}
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">Option {String.fromCharCode(65 + i)}</div>
              <div className="text-gray-900" dangerouslySetInnerHTML={{ __html: opt.text }} />
              {opt.image_url && <img src={opt.image_url} alt="" className="mt-2 max-h-32 rounded" />}
            </div>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === 'mcq_multiple') {
    const selected: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="space-y-2">
        <p className="text-xs text-gray-500 mb-2">Select all that apply</p>
        {(question.options || []).map((opt: any, i: number) => (
          <label
            key={opt.id || i}
            className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-colors ${
              selected.includes(opt.id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white'
            }`}
          >
            <input
              type="checkbox"
              checked={selected.includes(opt.id)}
              onChange={(e) => {
                if (e.target.checked) onChange([...selected, opt.id]);
                else onChange(selected.filter((x) => x !== opt.id));
              }}
              className="mt-1 w-4 h-4"
            />
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-0.5">Option {String.fromCharCode(65 + i)}</div>
              <div className="text-gray-900" dangerouslySetInnerHTML={{ __html: opt.text }} />
              {opt.image_url && <img src={opt.image_url} alt="" className="mt-2 max-h-32 rounded" />}
            </div>
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === 'true_false') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'True', v: true },
          { label: 'False', v: false },
        ].map((opt) => (
          <label
            key={opt.label}
            className={`flex items-center justify-center gap-2 p-4 border-2 rounded-xl cursor-pointer text-lg font-semibold ${
              value === opt.v ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700'
            }`}
          >
            <input type="radio" checked={value === opt.v} onChange={() => onChange(opt.v)} className="w-4 h-4" />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }

  if (question.question_type === 'fill_blank') {
    return (
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here..."
        className="w-full p-3 border-2 border-gray-300 rounded-xl text-lg focus:border-indigo-500 focus:outline-none"
      />
    );
  }

  if (question.question_type === 'short_answer' || question.question_type === 'essay') {
    const rows = question.question_type === 'essay' ? 10 : 4;
    return (
      <div>
        <textarea
          rows={rows}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.question_type === 'essay' ? 'Write your essay here...' : 'Type your answer...'}
          className="w-full p-3 border-2 border-gray-300 rounded-xl text-sm focus:border-indigo-500 focus:outline-none"
        />
        <p className="mt-2 text-xs text-gray-500">
          {(value || '').length} characters · Manually graded by teacher
        </p>
      </div>
    );
  }

  return <div className="text-gray-500">Unsupported question type</div>;
}
