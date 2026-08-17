import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, Edit2, Phone, Mail, MessageCircle, Briefcase, MapPin,
  KeyRound, Users, MoreHorizontal, User, ArrowRight,
} from 'lucide-react';

export default async function ParentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from('users').select('school_id').eq('id', user!.id).single();

  const { data: parent } = await supabase.from('parents').select('*').eq('id', id).eq('school_id', profile!.school_id).maybeSingle();
  if (!parent) notFound();

  const { data: links } = await supabase
    .from('student_parents')
    .select('*, students(id, first_name, middle_name, last_name, admission_number, current_section_id, photo_url)')
    .eq('parent_id', parent.id);

  const initials = `${parent.first_name[0]}${parent.last_name[0]}`.toUpperCase();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
          <Link href="/dashboard" className="hover:text-indigo">Dashboard</Link>
          <span className="text-gray-300">/</span>
          <Link href="/dashboard/parents" className="hover:text-indigo">Parents</Link>
          <span className="text-gray-300">/</span>
          <span className="text-gray-900">{parent.first_name} {parent.last_name}</span>
        </div>
        <Link href="/dashboard/parents" className="sm:hidden flex items-center gap-1 text-sm text-indigo">
          <ArrowLeft className="w-4 h-4" />Back
        </Link>
      </div>

      {/* Hero */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4 lg:gap-6">
          <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white text-2xl lg:text-3xl font-bold shadow-md flex-shrink-0">
            {parent.photo_url ? <img src={parent.photo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                  {parent.title && `${parent.title} `}{parent.first_name} {parent.middle_name} {parent.last_name}
                </h1>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <a href={`tel:${parent.primary_phone}`} className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo text-xs font-medium rounded hover:bg-indigo-100">
                    <Phone className="w-3 h-3" />
                    {parent.primary_phone}
                  </a>
                  {parent.whatsapp_number && (
                    <a href={`https://wa.me/${parent.whatsapp_number.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded hover:bg-emerald-100">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp
                    </a>
                  )}
                  {parent.email && (
                    <a href={`mailto:${parent.email}`} className="inline-flex items-center gap-1 px-2 py-1 bg-sky-50 text-sky-700 text-xs font-medium rounded hover:bg-sky-100">
                      <Mail className="w-3 h-3" />
                      Email
                    </a>
                  )}
                </div>
                {parent.occupation && (
                  <p className="text-sm text-gray-600 mt-2">{parent.occupation}{parent.employer && ` · ${parent.employer}`}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Link href={`/dashboard/parents/${parent.id}/edit`} className="btn-secondary text-sm">
                  <Edit2 className="w-3.5 h-3.5 mr-1.5" />Edit
                </Link>
              </div>
            </div>

            {/* Access code strip */}
            <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg flex items-center gap-3">
              <div className="w-8 h-8 bg-indigo rounded-md flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold text-indigo-dark uppercase tracking-wide">Parent portal access code</div>
                <div className="font-mono text-xl font-bold text-gray-900 tracking-wider mt-0.5">{parent.access_code}</div>
              </div>
              <div className="text-xs text-gray-600 hidden sm:block max-w-xs text-right">
                Share this code with the parent to log into the parent portal
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Children */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 lg:p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-purple-50 rounded-md flex items-center justify-center">
              <Users className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Children ({links?.length || 0})</h3>
          </div>
        </div>
        {!links || links.length === 0 ? (
          <div className="text-center py-6 text-sm text-gray-500">No students linked yet</div>
        ) : (
          <div className="space-y-2">
            {links.map((l: any) => (
              <Link key={l.id} href={`/dashboard/students/${l.students?.id}`}
                className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-indigo-50 rounded-lg transition-colors group">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {l.students?.photo_url ? <img src={l.students.photo_url} className="w-full h-full rounded-full object-cover" alt="" /> :
                    `${l.students?.first_name?.[0] || ''}${l.students?.last_name?.[0] || ''}`}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-gray-900 truncate">
                    {l.students?.first_name} {l.students?.middle_name && l.students.middle_name[0] + '.'} {l.students?.last_name}
                  </div>
                  <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                    <span>{l.students?.admission_number}</span>
                    <span className="capitalize">· {l.relationship}</span>
                    {l.is_primary_contact && (
                      <span className="inline-flex px-1.5 py-0.5 bg-indigo text-white text-[9px] font-semibold rounded uppercase">Primary</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-indigo group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DetailCard title="Contact" icon={Phone} iconColor="text-info">
          <DetailRow label="Primary phone" value={parent.primary_phone || '—'} />
          <DetailRow label="Alternate" value={parent.alternate_phone || '—'} />
          <DetailRow label="WhatsApp" value={parent.whatsapp_number || '—'} />
          <DetailRow label="Email" value={parent.email || '—'} />
          <DetailRow label="Preferred channels" value={parent.communication_channels?.map((c: string) => c.replace('_', ' ')).join(', ') || '—'} />
        </DetailCard>

        <DetailCard title="Work & occupation" icon={Briefcase} iconColor="text-success">
          <DetailRow label="Occupation" value={parent.occupation || '—'} />
          <DetailRow label="Employer" value={parent.employer || '—'} />
          <DetailRow label="Work address" value={parent.work_address || '—'} multiline />
          <DetailRow label="Work phone" value={parent.work_phone || '—'} />
        </DetailCard>

        <DetailCard title="Address" icon={MapPin} iconColor="text-warning">
          <DetailRow label="Home address" value={parent.home_address || '—'} multiline />
          <DetailRow label="City" value={parent.city || '—'} />
          <DetailRow label="State" value={parent.state || '—'} />
        </DetailCard>

        <DetailCard title="Notes" icon={User}>
          <p className="text-sm text-gray-600">{parent.notes || 'No notes yet'}</p>
        </DetailCard>
      </div>
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
