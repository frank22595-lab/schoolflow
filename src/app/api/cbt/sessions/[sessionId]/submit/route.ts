import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCbtSession, gradeAndFinalizeSession } from '@/lib/cbt';

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
      .select('id, exam_id, student_id, started_at, status, total_score, percentage')
      .eq('id', sessionId)
      .eq('student_id', cbtSession.student_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if (session.status !== 'in_progress') {
      // Already finalized — respond idempotently instead of erroring on a
      // double-submit (e.g. network retry).
      return NextResponse.json({
        ok: true,
        score: session.total_score,
        percentage: session.percentage,
        needs_grading: session.status === 'submitted' || session.status === 'auto_submitted',
      });
    }

    const { auto_submitted, tab_switches } = await req.json();

    const result = await gradeAndFinalizeSession(admin, session, {
      autoSubmitted: !!auto_submitted,
      tabSwitches: typeof tab_switches === 'number' ? tab_switches : undefined,
    });

    return NextResponse.json({
      ok: true,
      score: result.autoScore,
      percentage: result.percentage,
      needs_grading: result.needsGrading,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
