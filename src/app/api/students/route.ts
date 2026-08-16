import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    // Auth check via user session
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { schoolId, sessionId, student, sectionId } = body;

    // Verify user belongs to this school
    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) {
      return NextResponse.json({ error: 'Wrong school' }, { status: 403 });
    }

    // 1. Create student
    const { data: newStudent, error: sErr } = await adminSupabase
      .from('students').insert({ ...student, school_id: schoolId, created_by: user.id })
      .select().single();

    if (sErr) return NextResponse.json({ error: 'Create student failed: ' + sErr.message }, { status: 400 });

    // 2. Create enrollment if session + section provided
    if (sessionId && sectionId) {
      const { error: eErr } = await adminSupabase.from('enrollments').insert({
        school_id: schoolId,
        student_id: newStudent.id,
        session_id: sessionId,
        section_id: sectionId,
        enrollment_type: 'new_admission',
      });
      if (eErr) {
        // Student created but enrollment failed - log but don't rollback
        console.error('Enrollment failed:', eErr);
      }
    }

    return NextResponse.json({ success: true, studentId: newStudent.id });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Server error'
    }, { status: 500 });
  }
}
