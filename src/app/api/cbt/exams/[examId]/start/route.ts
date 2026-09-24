import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCbtSession, resolveStudentPlacement, shuffle, gradeAndFinalizeSession } from '@/lib/cbt';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ examId: string }> }) {
  try {
    const { examId } = await params;
    const cbtSession = await requireCbtSession(req);
    if (!cbtSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: exam } = await admin.from('exams')
      .select('*')
      .eq('id', examId)
      .eq('school_id', cbtSession.school_id)
      .maybeSingle();
    if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });

    const now = new Date();
    if (!['scheduled', 'live'].includes(exam.status)) {
      return NextResponse.json({ error: 'This exam is not available' }, { status: 400 });
    }
    if (exam.start_at && new Date(exam.start_at) > now) {
      return NextResponse.json({ error: 'This exam has not started yet' }, { status: 400 });
    }
    if (exam.end_at && new Date(exam.end_at) <= now) {
      return NextResponse.json({ error: 'This exam has ended' }, { status: 400 });
    }

    const placement = await resolveStudentPlacement(admin, cbtSession.student_id);
    if (!placement || placement.class_level_id !== exam.class_level_id) {
      return NextResponse.json({ error: 'This exam is not available for your class' }, { status: 403 });
    }

    const { data: existingSessions } = await admin.from('exam_sessions')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', cbtSession.student_id)
      .order('attempt_number', { ascending: false });
    const sessions = existingSessions || [];

    const resumable = sessions.find((s) => s.status === 'in_progress' && s.expires_at && new Date(s.expires_at) > now);

    let session = resumable;

    if (!session) {
      // Clean up a stale in_progress session (student closed the tab before the
      // client-side timer could auto-submit) so it doesn't sit ungraded forever.
      const stale = sessions.find((s) => s.status === 'in_progress');
      if (stale) {
        await gradeAndFinalizeSession(admin, stale, { autoSubmitted: true });
      }

      if (sessions.length >= exam.attempts_allowed) {
        return NextResponse.json({ error: 'No attempts remaining for this exam' }, { status: 403 });
      }

      const { data: orderRows } = await admin.from('exam_questions')
        .select('question_id, order_index')
        .eq('exam_id', examId)
        .order('order_index');
      let orderedIds = (orderRows || []).map((r: any) => r.question_id);
      if (exam.randomize_questions) orderedIds = shuffle(orderedIds);

      const expiresAt = new Date(now.getTime() + exam.duration_minutes * 60000).toISOString();
      const { data: newSession, error: sessErr } = await admin.from('exam_sessions')
        .insert({
          school_id: cbtSession.school_id,
          exam_id: examId,
          student_id: cbtSession.student_id,
          attempt_number: sessions.length + 1,
          started_at: now.toISOString(),
          expires_at: expiresAt,
          status: 'in_progress',
          question_order: orderedIds,
          current_question_index: 0,
        })
        .select('*')
        .single();
      if (sessErr || !newSession) {
        return NextResponse.json({ error: 'Could not start exam: ' + (sessErr?.message || 'unknown error') }, { status: 500 });
      }
      session = newSession;
    }

    const { data: examQuestions } = await admin.from('exam_questions')
      .select('id, question_id, points, order_index, question:questions(id, question_type, question_text, question_image_url, options)')
      .eq('exam_id', examId);

    const byQuestionId = new Map((examQuestions || []).map((eq: any) => [eq.question_id, eq]));
    const orderIds: string[] = Array.isArray(session.question_order) && session.question_order.length > 0
      ? session.question_order
      : (examQuestions || []).slice().sort((a: any, b: any) => a.order_index - b.order_index).map((eq: any) => eq.question_id);

    const sanitizedQuestions = orderIds
      .map((qid) => byQuestionId.get(qid))
      .filter(Boolean)
      .map((eq: any) => ({
        id: eq.question.id,
        exam_question_id: eq.id,
        question_type: eq.question.question_type,
        question_text: eq.question.question_text,
        question_image_url: eq.question.question_image_url,
        // correct_answer / acceptable_answers / options[].is_correct are never sent to the student.
        options: Array.isArray(eq.question.options)
          ? eq.question.options.map((o: any) => ({ id: o.id, text: o.text, image_url: o.image_url ?? null }))
          : null,
        points_available: eq.points,
      }));

    const { data: priorAnswers } = await admin.from('student_answers')
      .select('question_id, answer, flagged_for_review')
      .eq('session_id', session.id);

    return NextResponse.json({
      exam: {
        id: exam.id,
        name: exam.name,
        duration_minutes: exam.duration_minutes,
        allow_calculator: exam.allow_calculator,
        require_fullscreen: exam.require_fullscreen,
        prevent_copy_paste: exam.prevent_copy_paste,
        detect_tab_switch: exam.detect_tab_switch,
        auto_submit_on_time_up: exam.auto_submit_on_time_up,
        randomize_options: exam.randomize_options,
        instructions: exam.instructions,
        passing_score: exam.passing_score,
      },
      session: {
        id: session.id,
        expires_at: session.expires_at,
        current_question_index: session.current_question_index,
        status: session.status,
      },
      questions: sanitizedQuestions,
      answers: priorAnswers || [],
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
