import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, GraduationCap,
  Heart, User, AlertCircle, Home as HouseIcon, Users, Award,
  IdCard, Wallet, ClipboardCheck, BookOpen, MoreHorizontal,
} from 'lucide-react';

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: student } = await supabase
    .from('students').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();

  if (!student) notFound();

  const [
    { data: sections },
    { data: classes },
    { data: classLevels },
    { data: house },
    { data: enrollments },
  ] = await Promise.all([
    supabase.from('sections').select('*').eq('id', student.current_section_id || '').maybeSingle(),
    supabase.from('classes').select('*').eq('school_id', profile!.school_id),
    supabase.from('class_levels').select('*').eq('school_id', profile!.school_id),
    student.house_id ? supabase.from('houses').select('*').eq('id', student.house_id).maybeSingle() : Promise.resolve({ data: null }),
    supabase.from('enrollments').select('*, sessions(name)').eq('student_id', student.id).order('enrollment_date', { ascending: false }),
  ]);

  const section = sections;
  const cls = section ? classes?.find(c => c.id === section.class_id) : null;
  const level = cls ? classLevels?.find(l => l.id === cls.class_level_id) : null;
  const sectionLabel = section && level ? `${level.name} ${section.name}` : null;
  const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase();

  const age = student.date_of_birth
    ? Math.floor((Date.now() - new Date(student.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null;

  const genotypeAlert = student.genotype === 'SS';
  const asAlert = student.genotype === 'AS' || student.genotype === 'SC';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/students" className="hover:text-indigo">Students</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{student.first_name} {student.last_name}</span>
        </div>
        <Link href="/dashboard/students" className="sm:hidden flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 lg:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-md">
                {student.photo_url ? (
                  <img src={student.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" />
                ) : initials}
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                    {student.first_name} {student.middle_name} {student.last_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono font-semibold rounded">
                      {student.admission_number}
                    </span>
                    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                      student.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                      student.status === 'graduated' ? 'bg-indigo-50 text-indigo-700' :
                      student.status === 'suspended' ? 'bg-amber-50 text-amber-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                    </span>
                    {student.gender && (
                      <span className="text-xs text-gray-600">
                        {student.gender === 'male' ? '♂ Male' : '♀ Female'}
                      </span>
                    )}
                    {age !== null && <span className="text-xs text-gray-600">Age {age}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Link href={`/dashboard/students/${student.id}/edit`}
                    className="btn-secondary text-sm">
                    <Edit2 className="w-3.5 h-3.5 mr-1.5" />
                    Edit
                  </Link>
                  <button className="btn-secondary p-2">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Quick facts row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                <QuickFact icon={GraduationCap} label="Class" value={sectionLabel || 'Not assigned'} accent="text-indigo" />
                <QuickFact icon={HouseIcon} label="House" value={house?.name || '—'} color={house?.color} />
                <QuickFact icon={Calendar} label="Admitted" value={new Date(student.admission_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} />
                <QuickFact icon={MapPin} label="State" value={student.state_of_origin || '—'} />
              </div>
            </div>
          </div>
        </div>

        {/* Medical alerts strip */}
        {(genotypeAlert || asAlert || student.medical_alert_flag) && (
          <div className={`border-t px-5 lg:px-6 py-3 flex items-center gap-2 ${
            genotypeAlert ? 'bg-red-50 border-red-100' : 'bg-amber-50 border-amber-100'
          }`}>
            <AlertCircle className={`w-4 h-4 flex-shrink-0 ${genotypeAlert ? 'text-error' : 'text-warning'}`} />
            <div className="text-xs">
              {genotypeAlert && <span className="font-semibold text-red-900">Sickle cell (SS) — critical medical attention required. </span>}
              {asAlert && <span className="font-semibold text-amber-900">Genotype {student.genotype} — trait carrier. </span>}
              {student.medical_alert_flag && <span className="text-amber-900">Medical alert flagged — check records. </span>}
              {student.special_needs && <span className="text-gray-700">{student.special_needs}</span>}
            </div>
          </div>
        )}
      </div>

      {/* Quick action tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Wallet, label: 'Fees', desc: 'View invoices', href: `/dashboard/students/${student.id}/fees`, color: 'from-emerald-500 to-emerald-600' },
          { icon: ClipboardCheck, label: 'Attendance', desc: 'History', href: `/dashboard/students/${student.id}/attendance`, color: 'from-sky-500 to-sky-600' },
          { icon: BookOpen, label: 'Grades', desc: 'Results', href: `/dashboard/students/${student.id}/grades`, color: 'from-amber-500 to-amber-600' },
          { icon: IdCard, label: 'ID Card', desc: 'Generate', href: `/dashboard/students/${student.id}/id-card`, color: 'from-indigo-500 to-indigo-600' },
        ].map((a, i) => (
          <Link key={i} href={a.href}
            className="group relative bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-all overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${a.color} opacity-0 group-hover:opacity-100 transition-opacity`} />
            <a.icon className="w-5 h-5 text-gray-700 mb-2" />
            <div className="font-semibold text-sm text-gray-900">{a.label}</div>
            <div className="text-xs text-gray-500">{a.desc}</div>
          </Link>
        ))}
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal */}
        <DetailCard title="Personal information" icon={User}>
          <DetailRow label="Full name" value={`${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim()} />
          <DetailRow label="Gender" value={student.gender ? (student.gender.charAt(0).toUpperCase() + student.gender.slice(1)) : '—'} />
          <DetailRow label="Date of birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
          <DetailRow label="Place of birth" value={student.place_of_birth || '—'} />
          <DetailRow label="Nationality" value={student.nationality || '—'} />
          <DetailRow label="Religion" value={student.religion || '—'} />
          <DetailRow label="State of origin" value={student.state_of_origin || '—'} />
          <DetailRow label="LGA" value={student.lga || '—'} />
        </DetailCard>

        {/* Health */}
        <DetailCard title="Health information" icon={Heart} iconColor="text-error">
          <DetailRow label="Blood group" value={student.blood_group || '—'} mono />
          <DetailRow label="Genotype" value={student.genotype || '—'} mono
            highlight={genotypeAlert ? 'red' : asAlert ? 'amber' : undefined} />
          <DetailRow label="Special needs" value={student.special_needs || '—'} multiline />
          <DetailRow label="Medical alert" value={student.medical_alert_flag ? '⚠️ Flagged for attention' : '—'} />
        </DetailCard>

        {/* Address */}
        <DetailCard title="Address" icon={MapPin} iconColor="text-info">
          <DetailRow label="Home address" value={student.home_address || '—'} multiline />
          <DetailRow label="City" value={student.city || '—'} />
          <DetailRow label="State" value={student.state || '—'} />
          <DetailRow label="Country" value={student.country || '—'} />
        </DetailCard>

        {/* Academic */}
        <DetailCard title="Academic" icon={GraduationCap} iconColor="text-success">
          <DetailRow label="Current class" value={sectionLabel || '—'} />
          <DetailRow label="House" value={house?.name || '—'} />
          <DetailRow label="Transport" value={student.transport_mode ? student.transport_mode.replace('_', ' ') : '—'} />
          <DetailRow label="Boarder" value={student.is_boarder ? 'Yes' : 'No'} />
          <DetailRow label="Previous school" value={student.previous_school_name || '—'} />
          <DetailRow label="Previous class" value={student.previous_school_class || '—'} />
        </DetailCard>
      </div>

      {/* Enrollment history */}
      {enrollments && enrollments.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4">Enrollment history</h3>
          <div className="space-y-2">
            {enrollments.map((e: any) => (
              <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-indigo-50 rounded-md flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-indigo" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{e.sessions?.name || 'Unknown session'}</div>
                  <div className="text-xs text-gray-500">
                    {e.enrollment_type.replace('_', ' ')} · {new Date(e.enrollment_date).toLocaleDateString('en-GB')}
                  </div>
                </div>
                <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                  e.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                }`}>{e.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function QuickFact({ icon: Icon, label, value, color, accent }: any) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Icon className={`w-3.5 h-3.5 ${accent || 'text-gray-400'}`} />
        {label}
      </div>
      <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
        {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
        <span className="truncate">{value}</span>
      </div>
    </div>
  );
}

function DetailCard({ title, icon: Icon, iconColor = 'text-indigo', children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
          iconColor === 'text-error' ? 'bg-red-50' :
          iconColor === 'text-info' ? 'bg-sky-50' :
          iconColor === 'text-success' ? 'bg-emerald-50' : 'bg-indigo-50'
        }`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight, multiline }: any) {
  const highlightClass = highlight === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                         highlight === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200' : '';
  return (
    <div className={multiline ? '' : 'flex justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0'}>
      <dt className="text-xs text-gray-500 flex-shrink-0">{label}</dt>
      <dd className={`text-sm text-gray-900 ${mono ? 'font-mono' : ''} ${!multiline ? 'text-right truncate' : 'mt-1'} ${
        highlightClass ? `inline-block px-2 py-0.5 rounded border font-semibold ${highlightClass}` : ''
      }`}>
        {value}
      </dd>
    </div>
  );
}
