import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const TOGGLE_KEYS = [
  'show_class_position', 'show_subject_position', 'show_cumulative_average', 'show_class_average',
  'show_highest_lowest', 'show_gpa', 'show_attendance', 'show_affective', 'show_psychomotor',
  'show_teacher_comment', 'show_principal_comment', 'show_next_term_dates', 'show_fees_notice',
  'show_signatures', 'show_stamp_area', 'show_logo', 'show_motto',
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      schoolId, templateKey, principalName, nextTermBegins,
      headerMotto, footerNote, nextTermFees, toggles, colors,
    } = await req.json();

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const settingsRow: any = { school_id: schoolId };
    if (templateKey) settingsRow.template_key = templateKey;
    settingsRow.principal_name = principalName || null;
    settingsRow.next_term_begins = nextTermBegins || null;
    settingsRow.header_motto = headerMotto || null;
    settingsRow.footer_note = footerNote || null;
    settingsRow.next_term_fees = nextTermFees === '' || nextTermFees === undefined ? null : nextTermFees;

    if (toggles) {
      for (const key of TOGGLE_KEYS) {
        if (key in toggles) settingsRow[key] = !!toggles[key];
      }
    }

    const { error: settingsErr } = await admin.from('report_card_settings').upsert(settingsRow, { onConflict: 'school_id' });
    if (settingsErr) return NextResponse.json({ error: 'Save settings failed: ' + settingsErr.message }, { status: 400 });

    if (Array.isArray(colors) && colors.length > 0) {
      const rows = colors.map((c: any) => ({
        school_id: schoolId,
        class_level_id: c.classLevelId,
        primary_color: c.primaryColor || '#4F46E5',
        accent_color: c.accentColor || null,
      }));
      const { error: colorErr } = await admin.from('class_level_report_style').upsert(rows, { onConflict: 'school_id,class_level_id' });
      if (colorErr) return NextResponse.json({ error: 'Save colors failed: ' + colorErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
