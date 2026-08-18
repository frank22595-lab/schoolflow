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
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, sessionId, student, sectionId, parents } = await req.json();

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // 1. Create student
    const { data: newStudent, error: sErr } = await adminSupabase
      .from('students').insert({ ...student, school_id: schoolId, created_by: user.id })
      .select().single();
    if (sErr) return NextResponse.json({ error: 'Create student failed: ' + sErr.message }, { status: 400 });

    // 2. Create enrollment
    if (sessionId && sectionId) {
      await adminSupabase.from('enrollments').insert({
        school_id: schoolId, student_id: newStudent.id, session_id: sessionId,
        section_id: sectionId, status: 'active', enrolled_date: student.admission_date,
      });
    }

    // 3. Process parents
    if (parents && parents.length > 0) {
      for (const p of parents) {
        let parentId = p.existingParentId;

        // Create new parent if needed
        if (p.mode === 'new' && p.newParent) {
          const { data: codeData } = await adminSupabase.rpc('generate_parent_access_code', { p_school_id: schoolId });
          const { data: newP, error: pErr } = await adminSupabase.from('parents').insert({
            ...p.newParent, school_id: schoolId, access_code: codeData,
          }).select().single();
          if (pErr) { console.error('Parent create err:', pErr); continue; }
          parentId = newP.id;
        }

        // Link parent to student
        if (parentId) {
          await adminSupabase.from('student_parents').insert({
            school_id: schoolId,
            student_id: newStudent.id,
            parent_id: parentId,
            relationship: p.relationship,
            is_primary_contact: p.isPrimaryContact,
            is_report_recipient: true,
          });
        }
      }
    }

    return NextResponse.json({ success: true, studentId: newStudent.id });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}