import { NextResponse } from 'next/server';
import { CBT_COOKIE_NAME } from '@/lib/cbt';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(CBT_COOKIE_NAME);
  return res;
}
