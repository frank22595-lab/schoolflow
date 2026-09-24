import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCbtSession, resolveStudentPlacement } from '@/lib/cbt';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const cbtSession = await requireCbtSession(req);
  if (!cbtSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placement = await resolveStudentPlacement(admin, cbtSession.student_id);
  if (!placement) return NextResponse.json({ exams: [] });

  const nowIso = new Date().toISOString();

  const { data: exams, error } = await admin.from('exams')
    .select('*, subject:subjects(name), exam_questions(count)')
    .eq('school_id', cbtSession.school_id)
    .eq('class_level_id', placement.class_level_id)
    .in('status', ['scheduled', 'live'])
    .or(`end_at.is.null,end_at.gt.${nowIso}`)
    .order('start_at', { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const examIds = (exams || []).map((e: any) => e.id);
  const { data: sessions } = examIds.length > 0
    ? await admin.from('exam_sessions')
        .select('*')
        .eq('student_id', cbtSession.student_id)
        .in('exam_id', examIds)
        .order('attempt_number', { ascending: false })
    : { data: [] as any[] };

  const sessionsByExam = new Map<string, any[]>();
  for (const s of sessions || []) {
    const list = sessionsByExam.get(s.exam_id) || [];
    list.push(s);
    sessionsByExam.set(s.exam_id, list);
  }

  const result = (exams || []).map((e: any) => {
    const examSessions = sessionsByExam.get(e.id) || [];
    const latest = examSessions[0]; // already ordered by attempt_number desc
    const attempts_used = examSessions.length;

    let session_status: 'not_started' | 'in_progress' | 'submitted' | 'graded' = 'not_started';
    let session_score: number | undefined;
    if (latest) {
      if (latest.status === 'in_progress') session_status = 'in_progress';
      else if (latest.status === 'graded') session_status = 'graded';
      else session_status = 'submitted'; // covers 'submitted' and 'auto_submitted'

      if (latest.released_to_student_at) session_score = Number(latest.total_score);
    }

    return {
      id: e.id,
      name: e.name,
      description: e.description,
      duration_minutes: e.duration_minutes,
      start_at: e.start_at,
      end_at: e.end_at,
      total_points: Number(e.total_points),
      passing_score: Number(e.passing_score),
      allow_calculator: e.allow_calculator,
      attempts_allowed: e.attempts_allowed,
      question_count: e.exam_questions?.[0]?.count ?? 0,
      subject: e.subject,
      session_status,
      session_score,
      attempts_used,
    };
  });

  return NextResponse.json({ exams: result });
}
