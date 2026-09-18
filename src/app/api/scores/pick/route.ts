import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, sessionId, termId, sectionId, subjectId } = await req.json();
    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    if (!termId || !sectionId || !subjectId) {
      return NextResponse.json({ error: 'termId, sectionId and subjectId required' }, { status: 400 });
    }

    // Get session if not provided
    let sessId = sessionId;
    if (!sessId) {
      const { data: term } = await admin.from('terms').select('session_id').eq('id', termId).single();
      sessId = term?.session_id;
    }

    // Get or create score_session
    const { data: existing } = await admin.from('score_sessions').select('id')
      .eq('section_id', sectionId).eq('subject_id', subjectId).eq('term_id', termId)
      .maybeSingle();

    let scoreSessionId: string;
    if (existing) {
      scoreSessionId = existing.id;
    } else {
      const { data: created, error } = await admin.from('score_sessions').insert({
        school_id: schoolId,
        session_id: sessId,
        term_id: termId,
        section_id: sectionId,
        subject_id: subjectId,
        created_by: user.id,
      }).select('id').single();
      if (error) return NextResponse.json({ error: 'Create session failed: ' + error.message }, { status: 400 });
      scoreSessionId = created.id;
    }

    // Pre-create student_scores rows for all enrolled students
    const { data: enrolled } = await admin.from('enrollments')
      .select('student_id, students(deleted_at)')
      .eq('section_id', sectionId).eq('session_id', sessId).eq('status', 'active');

    const activeStudentIds = (enrolled || [])
      .filter((e: any) => !e.students?.deleted_at)
      .map((e: any) => e.student_id);

    if (activeStudentIds.length > 0) {
      const rows = activeStudentIds.map(studentId => ({
        school_id: schoolId,
        score_session_id: scoreSessionId,
        student_id: studentId,
        scores: {},
        total_score: 0,
      }));
      // Insert only rows that don't exist yet
      await admin.from('student_scores').upsert(rows, { onConflict: 'score_session_id,student_id', ignoreDuplicates: true });
    }

    return NextResponse.json({ success: true, scoreSessionId });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
