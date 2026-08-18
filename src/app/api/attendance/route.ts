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

    const { schoolId, sessionId, termId, sectionId, date, period } = await req.json();

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const { data, error } = await adminSupabase.rpc('get_or_create_attendance_session', {
      p_school_id: schoolId,
      p_session_id: sessionId,
      p_term_id: termId,
      p_section_id: sectionId,
      p_date: date,
      p_period: period || 'morning',
      p_created_by: user.id,
    });

    if (error) return NextResponse.json({ error: 'Failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true, sessionId: data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
