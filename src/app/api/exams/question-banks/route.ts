import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });

    const { data: banks, error } = await admin.from('question_banks')
      .select('*, subject:subjects(id, name), class_level:class_levels(id, name)')
      .eq('school_id', profile.school_id)
      .order('created_at');
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ banks: banks || [] });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (!profile?.school_id) return NextResponse.json({ error: 'No school' }, { status: 403 });
    const schoolId = profile.school_id;

    const { subject_id, class_level_id, name, description } = await req.json();
    if (!subject_id || !class_level_id) {
      return NextResponse.json({ error: 'subject_id and class_level_id are required' }, { status: 400 });
    }

    const [{ data: subject }, { data: classLevel }] = await Promise.all([
      admin.from('subjects').select('id').eq('id', subject_id).eq('school_id', schoolId).maybeSingle(),
      admin.from('class_levels').select('id').eq('id', class_level_id).eq('school_id', schoolId).maybeSingle(),
    ]);
    if (!subject) return NextResponse.json({ error: 'Subject not found in this school' }, { status: 400 });
    if (!classLevel) return NextResponse.json({ error: 'Class level not found in this school' }, { status: 400 });

    const { data: bank, error } = await admin.from('question_banks')
      .insert({
        school_id: schoolId,
        subject_id,
        class_level_id,
        name: name?.trim() || 'Default',
        description: description || null,
      })
      .select('*, subject:subjects(id, name), class_level:class_levels(id, name)')
      .single();
    if (error) return NextResponse.json({ error: 'Create bank failed: ' + error.message }, { status: 400 });

    return NextResponse.json({ bank });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
