import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function getSchool(userId: string, schoolId: string) {
  const { data: profile } = await admin.from('users').select('school_id').eq('id', userId).single();
  return profile?.school_id === schoolId;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, subjects } = await req.json();
    if (!(await getSchool(user.id, schoolId))) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    if (!Array.isArray(subjects)) return NextResponse.json({ error: 'subjects required' }, { status: 400 });

    // Fetch existing to know what to delete
    const { data: existing } = await admin.from('subjects').select('id').eq('school_id', schoolId);
    const existingIds = new Set((existing || []).map((s: any) => s.id));
    const submittedIds = new Set(subjects.filter((s: any) => s.id).map((s: any) => s.id));

    // Delete ones no longer submitted
    const toDelete = [...existingIds].filter(id => !submittedIds.has(id));
    if (toDelete.length > 0) {
      await admin.from('subjects').delete().in('id', toDelete);
    }

    // Upsert
    for (const s of subjects) {
      if (!s.name?.trim()) continue;
      const row: any = {
        school_id: schoolId,
        name: s.name.trim(),
        code: s.code?.trim() || null,
        category: s.category || 'core',
        is_active: s.is_active !== false,
        sequence: s.sequence || 0,
      };
      if (s.id && !s._new) {
        await admin.from('subjects').update(row).eq('id', s.id);
      } else {
        await admin.from('subjects').insert(row);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, assignments } = await req.json();
    if (!(await getSchool(user.id, schoolId))) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Replace all class_subjects for this school
    await admin.from('class_subjects').delete().eq('school_id', schoolId);

    const rows: any[] = [];
    for (const a of assignments) {
      for (const subjectId of a.subjectIds) {
        rows.push({
          school_id: schoolId,
          class_level_id: a.classLevelId,
          subject_id: subjectId,
          is_compulsory: true,
        });
      }
    }
    if (rows.length > 0) {
      const { error } = await admin.from('class_subjects').insert(rows);
      if (error) return NextResponse.json({ error: 'Save assignments failed: ' + error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, assigned: rows.length });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
