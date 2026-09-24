import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCbtSession } from '@/lib/cbt';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ sessionId: string }> }) {
  try {
    const { sessionId } = await params;
    const cbtSession = await requireCbtSession(req);
    if (!cbtSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: session } = await admin.from('exam_sessions')
      .select('id, exam_id, status, expires_at')
      .eq('id', sessionId)
      .eq('student_id', cbtSession.student_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    if (session.status !== 'in_progress') return NextResponse.json({ error: 'Session is not in progress' }, { status: 400 });
    if (session.expires_at && new Date(session.expires_at) <= new Date()) {
      return NextResponse.json({ error: 'Session has expired' }, { status: 400 });
    }

    const { answers, current_question_index } = await req.json();

    if (Array.isArray(answers) && answers.length > 0) {
      const { data: examQuestions } = await admin.from('exam_questions')
        .select('id, question_id, points')
        .eq('exam_id', session.exam_id);
      const eqByQuestion = new Map((examQuestions || []).map((eq: any) => [eq.question_id, eq]));

      const { data: existing } = await admin.from('student_answers')
        .select('id, question_id')
        .eq('session_id', sessionId);
      const existingByQuestion = new Map((existing || []).map((a: any) => [a.question_id, a.id]));

      const nowIso = new Date().toISOString();
      for (const a of answers) {
        const eq = eqByQuestion.get(a.question_id);
        if (!eq) continue; // not a question on this exam — ignore defensively
        const row = {
          session_id: sessionId,
          question_id: a.question_id,
          exam_question_id: eq.id,
          answer: a.answer ?? null,
          flagged_for_review: !!a.flagged_for_review,
          points_available: eq.points,
          answered_at: nowIso,
        };
        const existingId = existingByQuestion.get(a.question_id);
        if (existingId) {
          await admin.from('student_answers').update(row).eq('id', existingId);
        } else {
          await admin.from('student_answers').insert(row);
        }
      }
    }

    if (current_question_index !== undefined) {
      await admin.from('exam_sessions').update({ current_question_index }).eq('id', sessionId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
