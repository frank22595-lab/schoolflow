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

    const { schoolId } = await req.json();
    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const { data, error } = await admin.rpc('setup_grading_defaults', { p_school_id: schoolId });
    if (error) return NextResponse.json({ error: 'Setup failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true, ...data });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
