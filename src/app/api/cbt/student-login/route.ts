import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { signCbtSession, cbtCookieOptions, CBT_COOKIE_NAME } from '@/lib/cbt';

// Service-role client — students never sign in via Supabase Auth, so a regular
// anon-key client would be blocked by RLS on students. This bypasses RLS.
const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  let admissionNumber = '';
  try {
    const body = await req.json();
    admissionNumber = String(body?.admission_number || '').trim();
    const pinValue = String(body?.pin || '').trim(); // cbt_pin is TEXT — compare as a string, never Number(pin)

    console.log('[cbt/student-login] input received', {
      admission_number: admissionNumber,
      pin_length: pinValue.length,
    });

    if (!admissionNumber || !pinValue) {
      console.log('[cbt/student-login] missing admission_number or pin');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('[cbt/student-login] querying students', {
      filter: 'admission_number ilike (case-insensitive) AND cbt_pin = (string) AND deleted_at IS NULL',
      admission_number: admissionNumber,
      pin_masked: '*'.repeat(pinValue.length),
    });

    const { data: students, error } = await admin.from('students')
      .select('id, school_id')
      .ilike('admission_number', admissionNumber) // case-insensitive match
      .eq('cbt_pin', pinValue) // cbt_pin is TEXT; pinValue is a string
      .is('deleted_at', null)
      .limit(1);

    console.log('[cbt/student-login] query result', {
      supabase_error: error?.message || null,
      match_count: students?.length ?? 0,
    });

    const student = students?.[0];
    if (error || !student) {
      console.log('[cbt/student-login] no matching student -> invalid credentials');
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    console.log('[cbt/student-login] student matched, signing session', {
      student_id: student.id,
      school_id: student.school_id,
    });

    const token = await signCbtSession({ student_id: student.id, school_id: student.school_id });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(CBT_COOKIE_NAME, token, cbtCookieOptions());
    console.log('[cbt/student-login] login success, cookie set');
    return res;
  } catch (err) {
    // A failure here (e.g. CBT_SESSION_SECRET missing, JWT signing error) is NOT
    // a credentials problem — don't report it as one, or it's indistinguishable
    // from a genuine wrong PIN and undebuggable from the client side.
    console.error('[cbt/student-login] unexpected error for admission_number=' + admissionNumber, err);
    return NextResponse.json({ error: 'Server error, please try again' }, { status: 500 });
  }
}
