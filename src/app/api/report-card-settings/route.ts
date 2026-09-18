import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkSchool(userId: string, schoolId: string) {
  const { data: profile } = await admin.from('users').select('school_id').eq('id', userId).single();
  return profile?.school_id === schoolId;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, settings, affective, psychomotor, comments } = await req.json();
    if (!(await checkSchool(user.id, schoolId))) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Upsert settings
    if (settings) {
      const cleanSettings = { ...settings, school_id: schoolId };
      delete cleanSettings.id;
      delete cleanSettings.created_at;
      delete cleanSettings.updated_at;
      if (cleanSettings.next_term_begins === '') cleanSettings.next_term_begins = null;
      if (cleanSettings.next_term_fees === '' || cleanSettings.next_term_fees === undefined) cleanSettings.next_term_fees = null;

      await admin.from('report_card_settings').upsert(cleanSettings, { onConflict: 'school_id' });
    }

    // Replace affective
    if (Array.isArray(affective)) {
      await admin.from('affective_traits').delete().eq('school_id', schoolId);
      if (affective.length > 0) {
        const rows = affective.filter((a: any) => a.name?.trim()).map((a: any, i: number) => ({
          school_id: schoolId,
          name: a.name.trim(),
          sequence: i + 1,
          is_active: a.is_active !== false,
        }));
        if (rows.length > 0) await admin.from('affective_traits').insert(rows);
      }
    }

    // Replace psychomotor
    if (Array.isArray(psychomotor)) {
      await admin.from('psychomotor_skills').delete().eq('school_id', schoolId);
      if (psychomotor.length > 0) {
        const rows = psychomotor.filter((a: any) => a.name?.trim()).map((a: any, i: number) => ({
          school_id: schoolId,
          name: a.name.trim(),
          sequence: i + 1,
          is_active: a.is_active !== false,
        }));
        if (rows.length > 0) await admin.from('psychomotor_skills').insert(rows);
      }
    }

    // Replace comments
    if (Array.isArray(comments)) {
      await admin.from('comment_presets').delete().eq('school_id', schoolId);
      if (comments.length > 0) {
        const rows = comments.filter((c: any) => c.text?.trim()).map((c: any, i: number) => ({
          school_id: schoolId,
          comment_type: c.comment_type,
          score_min: c.score_min ?? null,
          score_max: c.score_max ?? null,
          text: c.text.trim(),
          sequence: i + 1,
          is_active: c.is_active !== false,
        }));
        if (rows.length > 0) await admin.from('comment_presets').insert(rows);
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

    const { schoolId, seed } = await req.json();
    if (!(await checkSchool(user.id, schoolId))) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    if (seed) {
      const { error } = await admin.rpc('seed_default_behavior_traits', { p_school_id: schoolId });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
