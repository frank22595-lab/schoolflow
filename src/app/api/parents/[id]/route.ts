import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { parent } = await req.json();
    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();

    const { data: existing } = await adminSupabase.from('parents').select('school_id').eq('id', id).single();
    if (existing?.school_id !== profile?.school_id) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const { error } = await adminSupabase.from('parents').update(parent).eq('id', id);
    if (error) return NextResponse.json({ error: 'Update failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    const { data: existing } = await adminSupabase.from('parents').select('school_id').eq('id', id).single();
    if (existing?.school_id !== profile?.school_id) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Unlink students first, then delete parent
    await adminSupabase.from('student_parents').delete().eq('parent_id', id);
    const { error } = await adminSupabase.from('parents').delete().eq('id', id);
    if (error) return NextResponse.json({ error: 'Delete failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
