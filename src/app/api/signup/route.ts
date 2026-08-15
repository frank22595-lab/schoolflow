import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Admin client that bypasses RLS
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function generateShortCode(name: string): string {
  const words = name.trim().split(/\s+/).filter(w =>
    !['school', 'schools', 'academy', 'college', 'international'].includes(w.toLowerCase())
  );
  if (words.length === 0) return name.slice(0, 4).toUpperCase();
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.slice(0, 4).map(w => w[0]).join('').toUpperCase();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, schoolName, firstName, lastName, phone, state, estimatedStudents } = body;

    // 1. Create auth user
    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName, phone },
    });

    if (authError) return NextResponse.json({ error: authError.message }, { status: 400 });
    if (!authData.user) return NextResponse.json({ error: 'User creation failed' }, { status: 400 });

    const userId = authData.user.id;

    // 2. Create school (bypasses RLS via service role)
    const slug = schoolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const shortCode = generateShortCode(schoolName);

    const { data: schoolData, error: schoolError } = await adminSupabase
      .from('schools')
      .insert({
        name: schoolName,
        slug,
        short_code: shortCode,
        state,
        country: 'Nigeria',
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        settings: { estimated_students: parseInt(estimatedStudents) || null },
      })
      .select()
      .single();

    if (schoolError) {
      await adminSupabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'School creation failed: ' + schoolError.message }, { status: 400 });
    }

    // 3. Create user profile
    const { error: userError } = await adminSupabase.from('users').insert({
      id: userId,
      school_id: schoolData.id,
      email,
      phone,
      first_name: firstName,
      last_name: lastName,
      title: 'Mr',
      nationality: 'Nigerian',
      state_of_origin: state,
    });

    if (userError) {
      await adminSupabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: 'User profile failed: ' + userError.message }, { status: 400 });
    }

    // 4. Assign Principal role
    const { data: principalRole } = await adminSupabase
      .from('roles')
      .select('id')
      .eq('school_id', schoolData.id)
      .eq('code', 'principal')
      .single();

    if (principalRole) {
      await adminSupabase.from('user_roles').insert({
        user_id: userId,
        role_id: principalRole.id,
        school_id: schoolData.id,
      });
    }

    return NextResponse.json({ success: true, schoolId: schoolData.id });
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Unknown error'
    }, { status: 500 });
  }
}