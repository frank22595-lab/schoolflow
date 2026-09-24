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
      .select('id, tab_switches, fullscreen_exits')
      .eq('id', sessionId)
      .eq('student_id', cbtSession.student_id)
      .maybeSingle();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { type } = await req.json();
    const column = type === 'fullscreen_exit' ? 'fullscreen_exits' : 'tab_switches';
    const current = Number((session as any)[column]) || 0;

    await admin.from('exam_sessions').update({ [column]: current + 1 }).eq('id', sessionId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
