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

    const { schoolId, sessionId, termId, classLevelIds } = await req.json();

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const { data, error } = await adminSupabase.rpc('generate_invoices_for_term', {
      p_school_id: schoolId,
      p_session_id: sessionId,
      p_term_id: termId,
      p_class_level_ids: classLevelIds,
      p_created_by: user.id,
    });

    if (error) return NextResponse.json({ error: 'Generation failed: ' + error.message }, { status: 400 });

    const result = data?.[0] || { created_count: 0, skipped_count: 0 };
    return NextResponse.json({
      success: true,
      created: result.created_count,
      skipped: result.skipped_count,
    });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
