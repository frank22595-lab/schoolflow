import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Edit2, Mail, Phone, MapPin, Calendar, Briefcase,
  User, AlertTriangle, Award, GraduationCap, Shield, Wrench, Users, MoreHorizontal,
} from 'lucide-react';

const TYPE_ICONS: Record<string, any> = {
  teaching: GraduationCap, non_teaching: Users, admin: Shield, management: Award, support: Wrench,
};

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: staff } = await supabase.from('staff').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();
  if (!staff) notFound();

  const initials = `${staff.first_name[0]}${staff.last_name[0]}`.toUpperCase();
  const TypeIcon = TYPE_ICONS[staff.staff_type] || Users;
  const yearsOnJob = staff.employment_date ?
    Math.floor((Date.now() - new Date(staff.employment_date).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/staff" className="hover:text-indigo">Staff</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{staff.first_name} {staff.last_name}</span>
        </div>
        <Link href="/dashboard/staff" className="sm:hidden flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
      </div>

      {/* Hero card */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6">
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-md flex-shrink-0">
            {staff.photo_url ? <img src={staff.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {staff.title && `${staff.title} `}{staff.first_name} {staff.middle_name} {staff.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-mono font-semibold rounded">
                    {staff.staff_number}
                  </span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${
                    staff.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    staff.status === 'on_leave' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {staff.status.replace('_', ' ').charAt(0).toUpperCase() + staff.status.replace('_', ' ').slice(1)}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo text-xs font-semibold rounded-full">
                    <TypeIcon className="w-3 h-3" />
                    {staff.staff_type.replace('_', ' ')}
                  </span>
                </div>
                {staff.designation && (
                  <p className="text-sm text-gray-600 mt-2">{staff.designation}{staff.department && ` · ${staff.department}`}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/dashboard/staff/${staff.id}/edit`} className="btn-secondary text-sm">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />Edit
                </Link>
                <button className="btn-secondary p-2"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
              <QuickFact icon={Briefcase} label="Employment" value={staff.employment_type?.replace('_', ' ') || '—'} />
              <QuickFact icon={Calendar} label="Joined" value={staff.employment_date ? new Date(staff.employment_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
              <QuickFact icon={Award} label="Experience" value={staff.years_of_experience ? `${staff.years_of_experience} yrs` : (yearsOnJob !== null ? `${yearsOnJob} yrs here` : '—')} />
              <QuickFact icon={MapPin} label="State" value={staff.state_of_origin || '—'} />
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailCard title="Contact" icon={Phone} iconColor="text-info">
          <DetailRow label="Primary phone" value={staff.primary_phone || '—'} />
          <DetailRow label="Alternate phone" value={staff.alternate_phone || '—'} />
          <DetailRow label="WhatsApp" value={staff.whatsapp_number || '—'} />
          <DetailRow label="Email" value={staff.email || '—'} />
        </DetailCard>

        <DetailCard title="Employment details" icon={Briefcase} iconColor="text-success">
          <DetailRow label="Staff type" value={staff.staff_type.replace('_', ' ')} />
          <DetailRow label="Employment type" value={staff.employment_type?.replace('_', ' ') || '—'} />
          <DetailRow label="Designation" value={staff.designation || '—'} />
          <DetailRow label="Department" value={staff.department || '—'} />
          <DetailRow label="Qualifications" value={staff.qualifications || '—'} multiline />
          <DetailRow label="Specialization" value={staff.specialization || '—'} />
          <DetailRow label="Experience" value={staff.years_of_experience ? `${staff.years_of_experience} years` : '—'} />
        </DetailCard>

        <DetailCard title="Personal" icon={User}>
          <DetailRow label="Full name" value={`${staff.title || ''} ${staff.first_name} ${staff.middle_name || ''} ${staff.last_name}`.trim()} />
          <DetailRow label="Gender" value={staff.gender ? (staff.gender.charAt(0).toUpperCase() + staff.gender.slice(1)) : '—'} />
          <DetailRow label="Date of birth" value={staff.date_of_birth ? new Date(staff.date_of_birth).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} />
          <DetailRow label="Marital status" value={staff.marital_status || '—'} />
          <DetailRow label="Nationality" value={staff.nationality || '—'} />
          <DetailRow label="Religion" value={staff.religion || '—'} />
          <DetailRow label="State of origin" value={staff.state_of_origin || '—'} />
          <DetailRow label="LGA" value={staff.lga || '—'} />
        </DetailCard>

        <DetailCard title="Address & emergency" icon={MapPin} iconColor="text-warning">
          <DetailRow label="Home address" value={staff.home_address || '—'} multiline />
          <DetailRow label="City" value={staff.city || '—'} />
          <DetailRow label="State" value={staff.state || '—'} />
          <div className="pt-3 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-error" />
              <span className="text-xs font-semibold text-gray-700 uppercase">Emergency contact</span>
            </div>
            <DetailRow label="Contact name" value={staff.emergency_contact_name || '—'} />
            <DetailRow label="Relationship" value={staff.emergency_contact_relationship || '—'} />
            <DetailRow label="Phone" value={staff.emergency_contact_phone || '—'} />
          </div>
        </DetailCard>
      </div>
    </div>
  );
}

function QuickFact({ icon: Icon, label, value }: any) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
        <Icon className="w-3.5 h-3.5 text-gray-400" />{label}
      </div>
      <div className="text-sm font-medium text-gray-900 capitalize truncate">{value}</div>
    </div>
  );
}

function DetailCard({ title, icon: Icon, iconColor = 'text-indigo', children }: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 lg:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${
          iconColor === 'text-info' ? 'bg-sky-50' :
          iconColor === 'text-success' ? 'bg-emerald-50' :
          iconColor === 'text-warning' ? 'bg-amber-50' : 'bg-indigo-50'
        }`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>
        <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      </div>
      <dl className="space-y-2">{children}</dl>
    </div>
  );
}

function DetailRow({ label, value, multiline }: any) {
  return (
    <div className={multiline ? '' : 'flex justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0'}>
      <dt className="text-xs text-gray-500 flex-shrink-0">{label}</dt>
      <dd className={`text-sm text-gray-900 capitalize ${!multiline ? 'text-right truncate' : 'mt-1 normal-case'}`}>{value}</dd>
    </div>
  );
}
