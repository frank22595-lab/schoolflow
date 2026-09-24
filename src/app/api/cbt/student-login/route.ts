import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signCbtSession, cbtCookieOptions, CBT_COOKIE_NAME } from '@/lib/cbt';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const { admission_number, pin } = await req.json();
    const admissionNumber = String(admission_number || '').trim();
    const pinValue = String(pin || '').trim();
    if (!admissionNumber || !pinValue) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    // Note: admission numbers are unique per-school, not globally — the login
    // form has no school selector, so this matches across all schools. Combined
    // with an exact PIN match this is very unlikely to collide, but it's a real
    // multi-tenancy gap worth tightening (e.g. a school code field) later.
    const { data: students, error } = await admin.from('students')
      .select('id, school_id')
      .ilike('admission_number', admissionNumber)
      .eq('cbt_pin', pinValue)
      .is('deleted_at', null)
      .limit(1);

    const student = students?.[0];
    if (error || !student) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = await signCbtSession({ student_id: student.id, school_id: student.school_id });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(CBT_COOKIE_NAME, token, cbtCookieOptions());
    return res;
  } catch {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }
}
