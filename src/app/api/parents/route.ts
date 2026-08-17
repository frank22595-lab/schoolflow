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

    const { schoolId, parent, studentLinks } = await req.json();

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Generate access code
    const { data: codeData, error: codeErr } = await adminSupabase.rpc('generate_parent_access_code', { p_school_id: schoolId });
    if (codeErr) return NextResponse.json({ error: 'Code gen failed: ' + codeErr.message }, { status: 400 });

    // Create parent
    const { data: newParent, error: pErr } = await adminSupabase
      .from('parents').insert({ ...parent, school_id: schoolId, access_code: codeData })
      .select().single();

    if (pErr) return NextResponse.json({ error: 'Create parent failed: ' + pErr.message }, { status: 400 });

    // Link students
    if (studentLinks && studentLinks.length > 0) {
      const linkRows = studentLinks.map((sl: any) => ({
        school_id: schoolId,
        student_id: sl.studentId,
        parent_id: newParent.id,
        relationship: sl.relationship,
        is_primary_contact: sl.isPrimaryContact,
        is_report_recipient: true,
      }));
      const { error: lErr } = await adminSupabase.from('student_parents').insert(linkRows);
      if (lErr) console.error('Link errors:', lErr);
    }

    return NextResponse.json({ success: true, parentId: newParent.id, accessCode: codeData });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
