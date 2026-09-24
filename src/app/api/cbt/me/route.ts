import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireCbtSession, resolveStudentPlacement } from '@/lib/cbt';

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function GET(req: NextRequest) {
  const cbtSession = await requireCbtSession(req);
  if (!cbtSession) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: student } = await admin.from('students')
    .select('first_name, last_name, admission_number')
    .eq('id', cbtSession.student_id)
    .eq('school_id', cbtSession.school_id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!student) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const placement = await resolveStudentPlacement(admin, cbtSession.student_id);

  return NextResponse.json({
    student: {
      first_name: student.first_name,
      last_name: student.last_name,
      admission_number: student.admission_number,
      class_name: placement?.class_name || '',
    },
  });
}
