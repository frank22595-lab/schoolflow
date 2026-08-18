import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { schoolId, invoiceId, studentId, payment } = await req.json();

    const { data: profile } = await adminSupabase.from('users').select('school_id').eq('id', user.id).single();
    if (profile?.school_id !== schoolId) return NextResponse.json({ error: 'Wrong school' }, { status: 403 });

    // Generate receipt number
    const { data: receiptNum, error: rErr } = await adminSupabase.rpc('generate_receipt_number', { p_school_id: schoolId });
    if (rErr) return NextResponse.json({ error: 'Receipt gen failed: ' + rErr.message }, { status: 400 });

    // Create payment (trigger auto-updates invoice totals)
    const { data: newPayment, error: pErr } = await adminSupabase
      .from('payments')
      .insert({
        ...payment,
        school_id: schoolId,
        invoice_id: invoiceId,
        student_id: studentId,
        receipt_number: receiptNum,
        created_by: user.id,
      })
      .select().single();

    if (pErr) return NextResponse.json({ error: 'Payment failed: ' + pErr.message }, { status: 400 });

    return NextResponse.json({ success: true, paymentId: newPayment.id, receiptNumber: receiptNum });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
