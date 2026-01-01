
import React from 'react';
import { LogOut, IdCard, ShieldCheck, User as UserIcon } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
  title: string;
  role: string;
  userName?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout, title, role, userName }) => {
  const isTeacher = role === 'TEACHER';
  const isParent = role === 'PARENT';
  const color = isTeacher ? 'blue' : isParent ? 'amber' : 'indigo';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={`bg-${color}-600 p-2 md:p-2.5 rounded-xl md:rounded-2xl text-white shadow-lg shadow-${color}-200`}>
                <IdCard size={22} className="md:w-[26px] md:h-[26px]" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col">
                <h1 className="text-sm md:text-xl font-black text-slate-900 leading-tight tracking-tight">CampusCore</h1>
                <p className={`text-[8px] md:text-[10px] text-${color}-600 font-black uppercase tracking-widest`}>{role}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-6">
              {userName && (
                <div className="text-right flex items-center gap-2 md:block">
                  <div className="hidden md:block">
                    <p className="text-sm font-black text-slate-900 truncate max-w-[120px] md:max-w-xs">{userName}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase truncate">{title}</p>
                  </div>
                  <div className="md:hidden bg-slate-100 p-1.5 rounded-lg text-slate-500">
                    <UserIcon size={16} />
                  </div>
                </div>
              )}
              <div className="h-6 md:h-8 w-px bg-slate-200 mx-1 md:mx-0" />
              <button 
                onClick={onLogout}
                className="p-2 md:p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl md:rounded-2xl transition-all active:scale-90"
                title="Logout"
              >
                <LogOut size={20} className="md:w-[22px] md:h-[22px]" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-10">
        {children}
      </main>
      <footer className="bg-white border-t border-slate-100 py-6 md:py-8 mt-auto mb-20 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck size={16} className="md:w-[18px] md:h-[18px]" />
            <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest">Encrypted Campus Network</p>
          </div>
          <p className="text-[10px] md:text-xs text-slate-300 font-medium tracking-tight">© 2025 Smart Digital ID Ecosystem</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
