'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { GraduationCap, Loader2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    schoolName: '',
    proprietorFirstName: '',
    proprietorLastName: '',
    email: '',
    phone: '',
    password: '',
    state: '',
    estimatedStudents: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Call server-side signup route (bypasses RLS)
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          schoolName: form.schoolName,
          firstName: form.proprietorFirstName,
          lastName: form.proprietorLastName,
          phone: form.phone,
          state: form.state,
          estimatedStudents: form.estimatedStudents,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Signup failed');

      // Now sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (signInError) throw signInError;

      router.push('/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SchoolFlow</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Start your free trial</h1>
            <p className="text-gray-600">One full term, no card required.</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">School name</label>
                <input type="text" required className="input"
                  placeholder="e.g. Chrisland School Lekki"
                  value={form.schoolName}
                  onChange={(e) => setForm({ ...form, schoolName: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">First name</label>
                  <input type="text" required className="input"
                    value={form.proprietorFirstName}
                    onChange={(e) => setForm({ ...form, proprietorFirstName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Last name</label>
                  <input type="text" required className="input"
                    value={form.proprietorLastName}
                    onChange={(e) => setForm({ ...form, proprietorLastName: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Email</label>
                <input type="email" required className="input"
                  placeholder="you@yourschool.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">WhatsApp number</label>
                <input type="tel" required className="input"
                  placeholder="+234 800 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Password</label>
                <input type="password" required minLength={8} className="input"
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">State</label>
                  <select required className="input"
                    value={form.state}
                    onChange={(e) => setForm({ ...form, state: e.target.value })}>
                    <option value="">Select state</option>
                    {['Lagos', 'Abuja', 'Rivers', 'Oyo', 'Kano', 'Kaduna', 'Enugu', 'Delta', 'Anambra', 'Ogun'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Est. students</label>
                  <input type="number" className="input"
                    placeholder="e.g. 500"
                    value={form.estimatedStudents}
                    onChange={(e) => setForm({ ...form, estimatedStudents: e.target.value })} />
                </div>
              </div>
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-error">
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating your school...</>
                ) : (
                  <>Start free trial<ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center">
                By continuing, you agree to our Terms and Privacy Policy.
              </p>
            </form>
          </div>
          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo font-medium hover:underline">Log in</Link>
          </p>
        </div>
      </main>
    </div>
  );
}