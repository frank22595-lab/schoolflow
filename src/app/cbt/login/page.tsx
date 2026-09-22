'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, KeyRound, Loader2 } from 'lucide-react';

export default function StudentLoginPage() {
  const router = useRouter();
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!admissionNumber.trim() || !pin.trim()) {
      setError('Please enter both admission number and PIN');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/cbt/student-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admission_number: admissionNumber.trim(), pin: pin.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      // Success — server sets a cookie; navigate to exams list
      router.push('/cbt/exams');
    } catch (e: any) {
      setError('Something went wrong. Try again.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700 p-4">
      <div className="w-full max-w-md">
        {/* Logo/heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl mb-4 shadow-lg">
            <GraduationCap className="w-9 h-9 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Student Exam Portal</h1>
          <p className="text-indigo-100">Sign in to take your exam</p>
        </div>

        {/* Login card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Admission Number
              </label>
              <input
                type="text"
                value={admissionNumber}
                onChange={(e) => setAdmissionNumber(e.target.value)}
                placeholder="e.g. STU/26/0020"
                autoFocus
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                5-Digit PIN
              </label>
              <div className="relative">
                <KeyRound className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={5}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="•••••"
                  className="w-full pl-11 pr-4 py-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 tracking-widest text-center font-mono"
                  disabled={loading}
                />
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Get your PIN from your class teacher
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" /> Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-500">
            Having trouble? Ask your class teacher for help.
          </div>
        </div>

        <p className="text-center text-xs text-indigo-200 mt-6">
          SchoolFlow · Exam Portal
        </p>
      </div>
    </div>
  );
}
