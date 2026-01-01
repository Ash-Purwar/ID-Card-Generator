
import React from 'react';
import { ShieldCheck, MapPin, Phone, Calendar, Award, User, BookOpen, QrCode } from 'lucide-react';

interface IDCardProps {
  name: string;
  idNo: string;
  dept: string;
  role: 'STUDENT' | 'TEACHER';
  photoUrl: string;
  className?: string;
  year?: string;
  dob?: string;
  contact?: string;
  subject?: string;
}

const DigitalIDCard: React.FC<IDCardProps> = ({ name, idNo, dept, role, photoUrl, className, year, dob, contact, subject }) => {
  const isStudent = role === 'STUDENT';
  const color = isStudent ? 'indigo' : 'emerald';

  const InfoRow = ({ icon: Icon, label, value }: { icon: any, label: string, value: string }) => (
    <div className="flex items-center gap-3">
      <div className={`w-8 h-8 rounded-xl bg-${color}-50 flex items-center justify-center text-${color}-600 flex-shrink-0 border border-${color}-100/50`}>
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-slate-400 text-[9px] uppercase font-black tracking-widest leading-none mb-1">{label}</p>
        <p className="text-slate-900 font-black text-sm truncate">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="group w-full max-w-[340px] mx-auto">
      <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl bg-white border border-slate-200 transition-all duration-500 hover:shadow-indigo-100/50">
        <div className={`h-32 bg-${color}-600 relative overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" />
          <div className="absolute top-6 right-6 text-white/20">
             <QrCode size={60} strokeWidth={1} />
          </div>
          <div className="absolute top-6 left-6">
            <p className="text-white/80 text-[10px] font-black tracking-[0.2em] uppercase">Digital Passport</p>
          </div>
        </div>
        
        <div className="px-8 pb-8 -mt-16 relative z-10 text-center">
          <div className="inline-block relative">
            <div className={`w-32 h-32 rounded-[2rem] overflow-hidden border-[6px] border-white shadow-2xl ring-4 ring-${color}-50 bg-slate-100 transition-transform duration-500 group-hover:scale-105`}>
              <img src={photoUrl || 'https://picsum.photos/400/400'} alt={name} className="w-full h-full object-cover" />
            </div>
            <div className={`absolute -bottom-2 -right-2 p-2 bg-${color}-600 text-white rounded-2xl border-4 border-white shadow-lg`}>
              <ShieldCheck size={20} />
            </div>
          </div>
          
          <h3 className="mt-5 text-2xl font-black text-slate-900 tracking-tight leading-tight">{name}</h3>
          <div className={`mt-2 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-${color}-50 text-${color}-700 border border-${color}-100`}>
            {role} • {idNo}
          </div>

          <div className="mt-8 space-y-4 text-left border-t border-slate-100 pt-8">
            <InfoRow icon={MapPin} label="Faculty/Dept" value={dept} />
            {isStudent ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <InfoRow icon={Award} label="Class" value={className || 'N/A'} />
                  <InfoRow icon={Calendar} label="Year" value={year || 'N/A'} />
                </div>
                <InfoRow icon={User} label="Birth Date" value={dob || 'N/A'} />
              </>
            ) : (
              <InfoRow icon={BookOpen} label="Expertise" value={subject || 'N/A'} />
            )}
            <InfoRow icon={Phone} label="Verified Contact" value={contact || 'N/A'} />
          </div>
        </div>
        
        <div className={`h-2 bg-${color}-600/10 w-full`} />
      </div>
    </div>
  );
};

export default DigitalIDCard;
