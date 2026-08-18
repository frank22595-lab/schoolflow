import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: studentId } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { newSectionId, sessionId, reason } = await req.json();
    if (!newSectionId || !sessionId) {
      return NextResponse.json({ error: 'newSectionId and sessionId required' }, { status: 400 });
    }

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    const schoolId = profile?.school_id;

    const { data: student } = await adminSupabase.from('students').select('school_id').eq('id', studentId).single();
    if (student?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Check the new section is in the same school
    const { data: newSection } = await adminSupabase.from('sections').select('school_id').eq('id', newSectionId).single();
    if (newSection?.school_id !== schoolId) return NextResponse.json({ error: 'Section not in school' }, { status: 403 });

    const today = new Date().toISOString().slice(0, 10);

    // End all current active enrollments for this student in this session
    const { error: endErr } = await adminSupabase.from('enrollments')
      .update({ status: 'transferred', end_date: today, transfer_reason: reason || null })
      .eq('student_id', studentId)
      .eq('session_id', sessionId)
      .eq('status', 'active');

    if (endErr) return NextResponse.json({ error: 'End enrollment failed: ' + endErr.message }, { status: 400 });

    // Create new enrollment
    const { error: newErr } = await adminSupabase.from('enrollments').insert({
      school_id: schoolId,
      student_id: studentId,
      session_id: sessionId,
      section_id: newSectionId,
      status: 'active',
      enrolled_date: today,
    });

    if (newErr) return NextResponse.json({ error: 'Create enrollment failed: ' + newErr.message }, { status: 400 });

    // Update student's current_section_id (trigger should do this but let's be explicit)
    await adminSupabase.from('students')
      .update({ current_section_id: newSectionId })
      .eq('id', studentId);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
