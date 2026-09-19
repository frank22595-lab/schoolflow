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

    const { schoolId, studentId, dataUrl } = await req.json();
    if (!schoolId || !studentId || !dataUrl) {
      return NextResponse.json({ error: 'schoolId, studentId and dataUrl required' }, { status: 400 });
    }

    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    const { data: student } = await admin.from('students').select('school_id').eq('id', studentId).single();
    if (student?.school_id !== schoolId) return NextResponse.json({ error: 'Student not in this school' }, { status: 403 });

    const base64 = dataUrl.split(',')[1] || dataUrl;
    const buffer = Buffer.from(base64, 'base64');
    const path = `${schoolId}/${studentId}.jpg`;

    const { error: uploadErr } = await admin.storage.from('student-photos').upload(path, buffer, {
      contentType: 'image/jpeg', upsert: true,
    });
    if (uploadErr) return NextResponse.json({ error: 'Upload failed: ' + uploadErr.message }, { status: 400 });

    const { data: publicUrlData } = admin.storage.from('student-photos').getPublicUrl(path);
    const photoUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`;

    const { error: updateErr } = await admin.from('students').update({ photo_url: photoUrl }).eq('id', studentId);
    if (updateErr) return NextResponse.json({ error: 'Save failed: ' + updateErr.message }, { status: 400 });

    return NextResponse.json({ success: true, url: photoUrl });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
