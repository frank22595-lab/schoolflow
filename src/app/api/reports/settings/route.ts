import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Matches ReportTemplateProps['settings'] — the flags the templates actually read.
const TOGGLE_KEYS = [
  'show_photo', 'show_house', 'show_position', 'show_subject_position', 'show_class_avg',
  'show_attendance', 'show_cumulative', 'show_affective', 'show_psychomotor',
  'show_teacher_comment', 'show_principal_comment', 'show_grade_scale',
];

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      schoolId, templateKey, styleKey, principalName, nextTermBegins,
      headerMotto, footerNote, nextTermFees, toggles,
    } = await req.json();

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const settingsRow: any = { school_id: schoolId };
    if (templateKey) settingsRow.template_key = templateKey;
    if (styleKey) settingsRow.template_style_key = styleKey;
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

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
