import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditStudentForm from '@/components/EditStudentForm';

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();
  const schoolId = profile!.school_id;

  const { data: student } = await supabase.from('students').select('*').eq('id', id).eq('school_id', schoolId).maybeSingle();
  if (!student) notFound();

  const [{ data: houses }, { data: sections }, { data: classes }, { data: classLevels }, { data: currentSession }, { data: currentEnrollment }] = await Promise.all([
    supabase.from('houses').select('*').eq('school_id', schoolId).order('name'),
    supabase.from('sections').select('*, classes(class_level_id)').eq('school_id', schoolId).order('name'),
    supabase.from('classes').select('*').eq('school_id', schoolId),
    supabase.from('class_levels').select('*').eq('school_id', schoolId).order('sequence'),
    supabase.from('sessions').select('*').eq('school_id', schoolId).eq('is_current', true).maybeSingle(),
    supabase.from('enrollments').select('*, sections(*, classes(class_level_id, class_levels(name)))')
      .eq('student_id', id).eq('status', 'active').maybeSingle(),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/students" className="hover:text-indigo">Students</Link>
          <span className="text-gray-300">/</span>
          <Link href={`/dashboard/students/${student.id}`} className="hover:text-indigo">{student.first_name} {student.last_name}</Link>
          <span className="text-gray-300">/</span>
          <span>Edit</span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Edit student</h1>
        <p className="text-gray-500 mt-1 text-sm">{student.admission_number} · {student.first_name} {student.last_name}</p>
      </div>

      <EditStudentForm
        student={student}
        houses={houses || []}
        sections={sections || []}
        classes={classes || []}
        classLevels={classLevels || []}
        currentSession={currentSession}
        currentEnrollment={currentEnrollment}
      />
    </div>
  );
}
