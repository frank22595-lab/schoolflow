import Link from 'next/link';
import { GraduationCap, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">SchoolFlow</span>
          </div>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-600 hover:text-indigo">Log in</Link>
            <Link href="/signup" className="btn-primary text-sm">Start free trial</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-dark rounded-full text-sm font-medium mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            Built for Nigerian K-12 schools
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            Run your school like the <br />
            <span className="text-indigo">21st century</span> demands
          </h1>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Everything a Nigerian private school needs — students, fees, grades, attendance, parent communication — in one modern platform.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/signup" className="btn-primary text-base px-6 py-3">
              Start your free term
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link href="/login" className="btn-secondary text-base px-6 py-3">
              Log in
            </Link>
          </div>
          <p className="text-sm text-gray-500 mt-6">
            Free for one full term · No credit card required
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} SchoolFlow. Built for Nigerian schools.
      </footer>
    </div>
  );
}