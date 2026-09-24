// Shared helpers for the student-facing CBT portal (src/app/cbt, src/app/api/cbt).
// Students authenticate with admission_number + cbt_pin, NOT Supabase Auth — this
// issues its own signed JWT in a cbt_session cookie instead.

import { SignJWT, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';

export const CBT_COOKIE_NAME = 'cbt_session';
const SESSION_TTL_SECONDS = 12 * 60 * 60; // 12 hours

function getSecret(): Uint8Array {
  const secret = process.env.CBT_SESSION_SECRET;
  if (!secret) throw new Error('CBT_SESSION_SECRET is not configured');
  return new TextEncoder().encode(secret);
}

export interface CbtSessionPayload {
  student_id: string;
  school_id: string;
}

export async function signCbtSession(payload: CbtSessionPayload): Promise<string> {
  return new SignJWT({ student_id: payload.student_id, school_id: payload.school_id })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyCbtSession(token: string): Promise<CbtSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (typeof payload.student_id !== 'string' || typeof payload.school_id !== 'string') return null;
    return { student_id: payload.student_id, school_id: payload.school_id };
  } catch {
    return null;
  }
}

export function cbtCookieOptions(maxAgeSeconds: number = SESSION_TTL_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

// Reads + verifies the cbt_session cookie off an incoming request. Route
// handlers call this first and return 401 themselves when it's null.
export async function requireCbtSession(req: NextRequest): Promise<CbtSessionPayload | null> {
  const token = req.cookies.get(CBT_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyCbtSession(token);
}

// ---- Shared query helpers ----

// A student's current section_id lives directly on enrollments (status='active'),
// which then chains section -> class -> class_level. No single FK-embedded query
// is used here since PostgREST relationship inference isn't guaranteed for every
// hop, so each step is a plain lookup.
export async function resolveStudentPlacement(admin: SupabaseClient, studentId: string): Promise<{
  section_id: string;
  class_level_id: string;
  class_name: string;
} | null> {
  const { data: enrollment } = await admin.from('enrollments')
    .select('section_id')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .order('enrollment_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!enrollment?.section_id) return null;

  const { data: section } = await admin.from('sections')
    .select('id, name, full_name, class_id')
    .eq('id', enrollment.section_id)
    .maybeSingle();
  if (!section?.class_id) return null;

  const { data: classRow } = await admin.from('classes')
    .select('id, class_level_id')
    .eq('id', section.class_id)
    .maybeSingle();
  if (!classRow?.class_level_id) return null;

  const { data: classLevel } = await admin.from('class_levels')
    .select('id, name')
    .eq('id', classRow.class_level_id)
    .maybeSingle();

  return {
    section_id: section.id,
    class_level_id: classRow.class_level_id,
    class_name: section.full_name || classLevel?.name || section.name,
  };
}

export function shuffle<T>(input: T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Grades every exam_question for a session (creating blank student_answers rows
// for anything the student never saved an answer to), updates auto_score/
// percentage/passed on the session, and sets status to 'graded' when nothing
// needs a teacher, or 'submitted'/'auto_submitted' otherwise. Used by both the
// submit route and by /start's cleanup of a stale (expired but still
// in_progress) session from a prior attempt.
export async function gradeAndFinalizeSession(
  admin: SupabaseClient,
  session: { id: string; exam_id: string; started_at: string | null },
  opts: { autoSubmitted: boolean; tabSwitches?: number }
): Promise<{ autoScore: number; percentage: number; needsGrading: boolean }> {
  const { data: exam } = await admin.from('exams')
    .select('total_points, passing_score')
    .eq('id', session.exam_id)
    .maybeSingle();
  const totalPoints = Number(exam?.total_points) || 0;
  const passingScore = Number(exam?.passing_score) || 0;

  const { data: examQuestions } = await admin.from('exam_questions')
    .select('id, question_id, points, question:questions(question_type, options, correct_answer, acceptable_answers)')
    .eq('exam_id', session.exam_id);

  const { data: existingAnswers } = await admin.from('student_answers')
    .select('id, question_id, answer')
    .eq('session_id', session.id);
  const existingByQuestion = new Map((existingAnswers || []).map((a: any) => [a.question_id, a]));

  let autoScore = 0;
  let needsGrading = false;

  for (const eq of examQuestions || []) {
    const q: any = (eq as any).question;
    const existing: any = existingByQuestion.get(eq.question_id);
    const studentAnswer = existing?.answer ?? null;
    const pointsAvailable = Number(eq.points) || 0;

    let isCorrect: boolean | null = null;
    let pointsEarned = 0;
    let isManuallyGraded = true;

    if (q?.question_type === 'mcq_single') {
      const correctOpt = (q.options || []).find((o: any) => o?.is_correct);
      isCorrect = !!correctOpt && studentAnswer === correctOpt.id;
      pointsEarned = isCorrect ? pointsAvailable : 0;
    } else if (q?.question_type === 'mcq_multiple') {
      const correctIds = (q.options || []).filter((o: any) => o?.is_correct).map((o: any) => o.id).sort();
      const studentIds = Array.isArray(studentAnswer) ? [...studentAnswer].sort() : [];
      isCorrect = correctIds.length > 0 && correctIds.length === studentIds.length
        && correctIds.every((id: string, i: number) => id === studentIds[i]);
      pointsEarned = isCorrect ? pointsAvailable : 0;
    } else if (q?.question_type === 'true_false') {
      const correct = q.correct_answer?.correct;
      isCorrect = typeof correct === 'boolean' && studentAnswer === correct;
      pointsEarned = isCorrect ? pointsAvailable : 0;
    } else if (q?.question_type === 'fill_blank') {
      const accepted: string[] = Array.isArray(q.acceptable_answers) ? q.acceptable_answers : [];
      const normalized = typeof studentAnswer === 'string' ? studentAnswer.trim().toLowerCase() : '';
      isCorrect = normalized.length > 0 && accepted.some((a) => String(a).trim().toLowerCase() === normalized);
      pointsEarned = isCorrect ? pointsAvailable : 0;
    } else {
      // short_answer / essay — manually graded
      isCorrect = null;
      pointsEarned = 0;
      isManuallyGraded = false;
      needsGrading = true;
    }

    autoScore += pointsEarned;

    const row = {
      session_id: session.id,
      question_id: eq.question_id,
      exam_question_id: eq.id,
      answer: studentAnswer,
      is_correct: isCorrect,
      points_earned: pointsEarned,
      points_available: pointsAvailable,
      is_manually_graded: isManuallyGraded,
    };

    if (existing) {
      await admin.from('student_answers').update(row).eq('id', existing.id);
    } else {
      await admin.from('student_answers').insert(row);
    }
  }

  const percentage = totalPoints > 0 ? Math.round((autoScore / totalPoints) * 10000) / 100 : 0;
  const passed = percentage >= passingScore;
  const status = needsGrading ? (opts.autoSubmitted ? 'auto_submitted' : 'submitted') : 'graded';
  const timeSpentSeconds = session.started_at
    ? Math.max(0, Math.round((Date.now() - new Date(session.started_at).getTime()) / 1000))
    : null;

  const update: Record<string, any> = {
    status,
    submitted_at: new Date().toISOString(),
    auto_score: autoScore,
    total_score: autoScore,
    percentage,
    passed,
  };
  if (timeSpentSeconds !== null) update.time_spent_seconds = timeSpentSeconds;
  if (opts.tabSwitches !== undefined) update.tab_switches = opts.tabSwitches;

  await admin.from('exam_sessions').update(update).eq('id', session.id);

  return { autoScore, percentage, needsGrading };
}
