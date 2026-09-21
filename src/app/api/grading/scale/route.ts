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

    const { schoolId, scaleId, bands, assessments } = await req.json();
    const { data: profile } = await admin.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Handle bands
    if (scaleId && bands) {
      // Delete old bands + insert new
      await admin.from('grade_bands').delete().eq('grade_scale_id', scaleId);
      const bandRows = bands.map((b: any, i: number) => ({
        grade_scale_id: scaleId,
        grade: b.grade,
        min_score: b.min_score,
        max_score: b.max_score,
        remark: b.remark || null,
        gpa: b.gpa || null,
        color: b.color || 'gray',
        sequence: i + 1,
      }));
      const { error } = await admin.from('grade_bands').insert(bandRows);
      if (error) return NextResponse.json({ error: 'Save bands failed: ' + error.message }, { status: 400 });
    }

    // Handle assessments
    if (assessments) {
      const activeTotal = assessments
        .filter((a: any) => a.is_active !== false)
        .reduce((sum: number, a: any) => sum + (parseFloat(a.max_score) || 0), 0);
      const roundedTotal = Math.round(activeTotal * 100) / 100;
      if (roundedTotal !== 100) {
        return NextResponse.json({ error: `Current total: ${roundedTotal}/100. Must equal 100.` }, { status: 400 });
      }

      await admin.from('assessment_types').delete().eq('school_id', schoolId);
      const rows = assessments.map((a: any, i: number) => ({
        school_id: schoolId,
        name: a.name,
        short_code: a.short_code,
        max_score: a.max_score,
        weight: a.weight ?? a.max_score,
        sequence: i + 1,
        is_exam: a.is_exam || false,
        is_active: a.is_active !== false,
      }));
      const { error } = await admin.from('assessment_types').insert(rows);
      if (error) return NextResponse.json({ error: 'Save assessments failed: ' + error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
