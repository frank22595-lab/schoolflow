import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const KIND_COLUMN: Record<string, string> = {
  logo: 'logo_url',
  stamp: 'stamp_url',
  principal_signature: 'principal_signature_url',
  teacher_signature: 'teacher_signature_url',
};

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, kind, dataUrl } = await req.json();
    const column = KIND_COLUMN[kind];
    if (!schoolId || !column || !dataUrl) {
      return NextResponse.json({ error: 'schoolId, valid kind, and dataUrl required' }, { status: 400 });
    }

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const base64 = dataUrl.split(',')[1] || dataUrl;
    const buffer = Buffer.from(base64, 'base64');
    const path = `${schoolId}/${kind}.jpg`;

    const { error: uploadErr } = await admin.storage.from('school-assets').upload(path, buffer, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (uploadErr) return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 400 });

    const { data: publicUrlData } = admin.storage.from('school-assets').getPublicUrl(path);
    const assetUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: upsertErr } = await admin.from('report_card_settings')
      .upsert({ school_id: schoolId, [column]: assetUrl }, { onConflict: 'school_id' });
    if (upsertErr) return NextResponse.json({ error: 'Save failed: ' + upsertErr.message }, { status: 400 });

    return NextResponse.json({ success: true, url: assetUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
