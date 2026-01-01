
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UserRole, StudentProfile, TeacherProfile, ParentProfile, LectureSession, AttendanceRecord, Notice, AcademicSheet } from './types';
import { CAMPUS_LOCATION } from './constants';
import { calculateDistance } from './utils/geoUtils';
import Layout from './components/Layout';
import DigitalIDCard from './components/DigitalIDCard';
import GeofenceIndicator from './components/GeofenceIndicator';
import * as XLSX from 'xlsx';
import { 
  Users, 
  BookOpen, 
  ClipboardList, 
  BarChart, 
  AlertTriangle, 
  IdCard, 
  ShieldCheck, 
  Bell,
  ArrowRight,
  TrendingUp,
  Camera,
  FileText,
  Upload,
  FileSpreadsheet,
  Download,
  Home,
  User,
  PlusCircle,
  Send,
  Trash2,
  X,
  Eye,
  Info,
  FileSearch,
  Check,
  UserCheck,
  Printer,
  Maximize2,
  Clock,
  UserPlus,
  RefreshCw,
  Search,
  History,
  CheckCircle2,
  CircleDashed,
  Lock,
  Mail,
  KeyRound,
  ChevronLeft,
  FileDown,
  Paperclip
} from 'lucide-react';

type AppTab = 'current' | 'notifications' | 'profile';
type AuthMode = 'CHOOSER' | 'LOGIN' | 'REGISTER';

const safeString = (val: any, fallback: string = ""): string => {
  if (val === null || val === undefined) return fallback;
  return String(val).trim() === "" ? fallback : String(val);
};

const App: React.FC = () => {
  // Persistence Mock DB
  const [enrolledStudents, setEnrolledStudents] = useState<StudentProfile[]>([]);
  const [enrolledTeachers, setEnrolledTeachers] = useState<TeacherProfile[]>([]);
  const [enrolledParents, setEnrolledParents] = useState<ParentProfile[]>([]);
  const [activeSessions, setActiveSessions] = useState<LectureSession[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [academicSheets, setAcademicSheets] = useState<AcademicSheet[]>([]);
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<{ role: UserRole; id: string } | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('CHOOSER');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  
  // UI State
  const [activeTab, setActiveTab] = useState<AppTab>('current');
  const [selectedSheet, setSelectedSheet] = useState<AcademicSheet | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [targetStudentId, setTargetStudentId] = useState('');
  const [distanceToCampus, setDistanceToCampus] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  // Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Persistence Engine
  useEffect(() => {
    const load = (key: string, fb: any) => {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fb;
    };
    setEnrolledStudents(load('db_students', []));
    setEnrolledTeachers(load('db_teachers', []));
    setEnrolledParents(load('db_parents', []));
    setActiveSessions(load('db_sessions', []));
    setAttendance(load('db_attendance', []));
    setNotices(load('db_notices', []));
    setAcademicSheets(load('db_sheets', []));
  }, []);

  useEffect(() => {
    const save = (key: string, val: any) => localStorage.setItem(key, JSON.stringify(val));
    save('db_students', enrolledStudents);
    save('db_teachers', enrolledTeachers);
    save('db_parents', enrolledParents);
    save('db_sessions', activeSessions);
    save('db_attendance', attendance);
    save('db_notices', notices);
    save('db_sheets', academicSheets);
  }, [enrolledStudents, enrolledTeachers, enrolledParents, activeSessions, attendance, notices, academicSheets]);

  // Profiles derived from logged in user
  const studentProfile = useMemo(() => {
    if (currentUser?.role === UserRole.STUDENT) {
      return enrolledStudents.find(s => s.enrollmentNo === currentUser.id) || null;
    }
    return null;
  }, [currentUser, enrolledStudents]);

  const teacherProfile = useMemo(() => {
    if (currentUser?.role === UserRole.TEACHER) {
      return enrolledTeachers.find(t => t.teacherId === currentUser.id) || null;
    }
    return null;
  }, [currentUser, enrolledTeachers]);

  const parentProfile = useMemo(() => {
    if (currentUser?.role === UserRole.PARENT) {
      return enrolledParents.find(p => p.wardId === currentUser.id) || null;
    }
    return null;
  }, [currentUser, enrolledParents]);

  // Geofencing Service
  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setLocationError("Geolocation not supported.");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const dist = calculateDistance(pos.coords.latitude, pos.coords.longitude, CAMPUS_LOCATION.lat, CAMPUS_LOCATION.lng);
        setDistanceToCampus(dist);
        setLocationError(null);
      },
      (err) => {
        setLocationError("Location access denied.");
        setDistanceToCampus(null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Automated Check-in logic
  useEffect(() => {
    if (currentUser?.role === UserRole.STUDENT && studentProfile && typeof distanceToCampus === 'number') {
      const activeSession = activeSessions.find(s => s.isActive);
      if (activeSession && distanceToCampus <= CAMPUS_LOCATION.radius) {
        const enrollNo = studentProfile.enrollmentNo;
        if (!attendance.some(a => a.studentId === enrollNo && a.sessionId === activeSession.id)) {
          setAttendance(prev => [...prev, {
            id: `att_${Date.now()}`,
            studentId: enrollNo,
            sessionId: activeSession.id,
            timestamp: Date.now(),
            status: 'PRESENT'
          }]);
        }
      }
    }
  }, [distanceToCampus, activeSessions, currentUser, studentProfile, attendance]);

  const handleLogout = () => {
    setCurrentUser(null);
    setAuthMode('CHOOSER');
    setSelectedRole(null);
    setActiveTab('current');
    setSelectedSheet(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const id = safeString(data.get('id'));
    const password = safeString(data.get('password'));

    if (selectedRole === UserRole.STUDENT) {
      const user = enrolledStudents.find(s => s.enrollmentNo === id && s.password === password);
      if (user) setCurrentUser({ role: UserRole.STUDENT, id });
      else alert("Invalid Student credentials.");
    } else if (selectedRole === UserRole.TEACHER) {
      const user = enrolledTeachers.find(t => t.teacherId === id && t.password === password);
      if (user) setCurrentUser({ role: UserRole.TEACHER, id });
      else alert("Invalid Faculty credentials.");
    } else if (selectedRole === UserRole.PARENT) {
      const user = enrolledParents.find(p => p.wardId === id && p.password === password);
      if (user) setCurrentUser({ role: UserRole.PARENT, id });
      else alert("Invalid Parent credentials.");
    }
  };

  const handleRegister = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const id = safeString(data.get('id'));
    const password = safeString(data.get('password'));

    if (selectedRole === UserRole.STUDENT) {
      if (enrolledStudents.some(s => s.enrollmentNo === id)) return alert("ID already registered.");
      const newProfile: StudentProfile = {
        name: safeString(data.get('name')),
        enrollmentNo: id,
        password,
        department: safeString(data.get('dept')),
        className: safeString(data.get('class')),
        year: safeString(data.get('year')),
        dob: safeString(data.get('dob')),
        contact: safeString(data.get('contact')),
        photoUrl: selectedPhoto || `https://picsum.photos/seed/${id}/400/400`,
        isEnrolled: true
      };
      setEnrolledStudents(prev => [...prev, newProfile]);
      setCurrentUser({ role: UserRole.STUDENT, id });
    } else if (selectedRole === UserRole.TEACHER) {
      if (enrolledTeachers.some(t => t.teacherId === id)) return alert("Faculty ID already registered.");
      const newProfile: TeacherProfile = {
        name: safeString(data.get('name')),
        teacherId: id,
        password,
        department: safeString(data.get('dept')),
        subject: safeString(data.get('subject')),
        contact: safeString(data.get('contact')),
        photoUrl: selectedPhoto || `https://picsum.photos/seed/${id}/400/400`,
        isEnrolled: true
      };
      setEnrolledTeachers(prev => [...prev, newProfile]);
      setCurrentUser({ role: UserRole.TEACHER, id });
    } else if (selectedRole === UserRole.PARENT) {
      if (!enrolledStudents.some(s => s.enrollmentNo === id)) return alert("Student ID not found. Parents must link to a registered student.");
      if (enrolledParents.some(p => p.wardId === id)) return alert("This Student ID is already linked to a parent account.");
      const newProfile: ParentProfile = {
        wardId: id,
        parentName: safeString(data.get('name')),
        password,
        contact: safeString(data.get('contact'))
      };
      setEnrolledParents(prev => [...prev, newProfile]);
      setCurrentUser({ role: UserRole.PARENT, id });
    }
  };

  const handleSheetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && teacherProfile) {
      if (!targetStudentId.trim()) return alert("Enter target Student ID.");
      const reader = new FileReader();
      reader.onload = (event) => {
        const newSheet: AcademicSheet = {
          id: `sheet_${Date.now()}`,
          fileName: file.name,
          fileType: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'IMAGE' : 'EXCEL',
          uploadDate: new Date().toLocaleDateString(),
          uploadedBy: teacherProfile.name,
          targetStudentId: targetStudentId.trim(),
          description: safeString(file.name) + " - Marksheet evaluation uploaded by Faculty.",
          fileData: event.target?.result as string
        };
        setAcademicSheets(prev => [newSheet, ...prev]);
        setTargetStudentId('');
        alert("Published!");
      };
      reader.readAsDataURL(file);
    }
  };

  const deleteNotice = (id: string) => {
    setConfirmConfig({
      show: true,
      title: "Retract Notice",
      message: "Remove this announcement from the campus board?",
      onConfirm: () => {
        setNotices(prev => prev.filter(n => n.id !== id));
        setConfirmConfig(null);
      }
    });
  };

  const exportAsWord = (sheet: AcademicSheet) => {
    const studentInfo = enrolledStudents.find(s => s.enrollmentNo === sheet.targetStudentId);
    const studentName = studentInfo?.name || 'Student';
    const content = `Official Record: ${sheet.fileName}\nStudent: ${studentName}\nID: ${sheet.targetStudentId}\nFaculty: ${sheet.uploadedBy}\nDate: ${sheet.uploadDate}\n\nNotes: ${sheet.description}`;
    const blob = new Blob([content], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sheet.fileName}.doc`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadOriginalAttachment = (sheet: AcademicSheet) => {
    if (!sheet.fileData) return alert("No attachment found for this record.");
    const link = document.createElement('a');
    link.href = sheet.fileData;
    link.download = sheet.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- SUB-COMPONENTS ---

  const AuthGateway = () => (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 border border-slate-200">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-600 rounded-3xl text-white mb-6 shadow-xl shadow-indigo-100">
            <IdCard size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">CampusCore</h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Unified Identity & Governance</p>
        </div>

        {authMode === 'CHOOSER' ? (
          <div className="space-y-4">
            {[
              { role: UserRole.STUDENT, label: 'Student Portal', icon: BookOpen, color: 'indigo' },
              { role: UserRole.TEACHER, label: 'Faculty Control', icon: Users, color: 'blue' },
              { role: UserRole.PARENT, label: 'Guardian Access', icon: ShieldCheck, color: 'amber' }
            ].map(item => (
              <button 
                key={item.role}
                onClick={() => { setSelectedRole(item.role); setAuthMode('LOGIN'); }}
                className="w-full group flex items-center justify-between p-5 rounded-3xl bg-slate-50 border border-slate-100 hover:border-indigo-500 hover:bg-white transition-all active:scale-95"
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 bg-white rounded-2xl text-${item.color}-600 group-hover:bg-${item.color}-600 group-hover:text-white transition-all shadow-sm border`}>
                    <item.icon size={24} />
                  </div>
                  <span className="font-black text-slate-900">{item.label}</span>
                </div>
                <ArrowRight size={18} className="text-slate-200 group-hover:text-slate-900" />
              </button>
            ))}
            <div className="pt-4 text-center">
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Select your role to continue</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-8">
              <button onClick={() => setAuthMode('CHOOSER')} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 transition-colors">
                <ChevronLeft size={20} />
              </button>
              <h2 className="text-xl font-black text-slate-900">{authMode === 'LOGIN' ? 'Secure Login' : 'Create Account'}</h2>
            </div>

            <form onSubmit={authMode === 'LOGIN' ? handleLogin : handleRegister} className="space-y-4">
              {authMode === 'REGISTER' && (
                <div className="space-y-4 mb-4">
                  <div className="flex flex-col items-center gap-3 p-4 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border-2 border-white shadow-md">
                       {selectedPhoto ? <img src={selectedPhoto} className="w-full h-full object-cover" /> : <Camera className="w-full h-full p-4 text-slate-200" />}
                    </div>
                    <label className="cursor-pointer text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                      Upload Photo
                      <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                  <input name="name" placeholder="Full Official Name" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black outline-none focus:ring-2 focus:ring-indigo-500" />
                  {selectedRole === UserRole.STUDENT && (
                    <div className="grid grid-cols-2 gap-3">
                      <input name="dept" placeholder="Faculty" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                      <input name="class" placeholder="Class/Sec" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                      <input name="year" placeholder="Year" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                      <input name="dob" type="date" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                    </div>
                  )}
                  {selectedRole === UserRole.TEACHER && (
                    <div className="grid grid-cols-2 gap-3">
                      <input name="dept" placeholder="Department" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                      <input name="subject" placeholder="Major Subject" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                    </div>
                  )}
                  <input name="contact" placeholder="Verified Contact (Email/Phone)" required className="w-full p-4 rounded-2xl bg-slate-50 border font-bold text-black" />
                </div>
              )}

              <div className="relative">
                <input name="id" placeholder={selectedRole === UserRole.TEACHER ? "Faculty ID" : "Enrollment No"} required className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border font-black text-black outline-none focus:ring-2 focus:ring-indigo-500" />
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>
              <div className="relative">
                <input name="password" type="password" placeholder="Access Key" required className="w-full p-4 pl-12 rounded-2xl bg-slate-50 border font-black text-black outline-none focus:ring-2 focus:ring-indigo-500" />
                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              </div>

              <button className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all mt-4">
                {authMode === 'LOGIN' ? 'AUTHENTICATE' : 'ESTABLISH IDENTITY'}
              </button>
            </form>

            <button 
              onClick={() => setAuthMode(authMode === 'LOGIN' ? 'REGISTER' : 'LOGIN')}
              className="w-full text-center py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
            >
              {authMode === 'LOGIN' ? "Don't have an ID? Register" : "Already have an ID? Login"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const SheetViewer = () => {
    if (!selectedSheet) return null;
    const isTeacher = currentUser?.role === UserRole.TEACHER;
    const isParent = currentUser?.role === UserRole.PARENT;
    const isStudent = currentUser?.role === UserRole.STUDENT;

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 bg-slate-900/90 backdrop-blur-xl animate-in fade-in duration-300 print:bg-white print:p-0">
        <div className="bg-white w-full h-full max-w-7xl rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col border border-white/20 print:rounded-none print:border-none">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white print:hidden">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900">{selectedSheet.fileName}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Verified Digital Entry • {selectedSheet.uploadDate}</p>
              </div>
            </div>
            <button onClick={() => setSelectedSheet(null)} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400">
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 overflow-auto bg-slate-50 p-6 md:p-12 print:bg-white print:p-0 flex items-center justify-center">
             <div className="w-full h-full max-w-4xl bg-white shadow-2xl rounded-3xl p-10 md:p-16 border border-slate-200/50 print:shadow-none print:border-none flex flex-col items-center justify-center text-center">
                <div className="mb-12">
                   <div className="inline-block p-6 bg-indigo-50 rounded-full mb-8">
                      <FileSpreadsheet size={64} className="text-indigo-600" />
                   </div>
                   <h2 className="text-3xl font-black text-slate-900 mb-4">{selectedSheet.fileName}</h2>
                   <p className="text-slate-500 font-medium leading-relaxed max-w-md mx-auto">{selectedSheet.description}</p>
                </div>
                
                <div className="w-full max-w-sm bg-white p-8 rounded-3xl border border-slate-200 text-left shadow-sm">
                   <p className="text-[11px] font-black text-black uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">Document Log</p>
                   <div className="space-y-4">
                      <div className="flex justify-between items-center"><span className="text-black text-xs font-bold">Issuer:</span><span className="text-black font-black text-xs">Prof. {selectedSheet.uploadedBy}</span></div>
                      <div className="flex justify-between items-center"><span className="text-black text-xs font-bold">Target ID:</span><span className="text-black font-black text-xs">{selectedSheet.targetStudentId}</span></div>
                      <div className="flex justify-between items-center"><span className="text-black text-xs font-bold">Auth Date:</span><span className="text-black font-black text-xs">{selectedSheet.uploadDate}</span></div>
                   </div>
                </div>

                <div className="mt-8 flex items-center gap-2 text-indigo-600">
                  <Paperclip size={16} />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em]">{selectedSheet.fileType} Attachment Ready</span>
                </div>
             </div>
          </div>
          <div className="p-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-center items-center gap-3 print:hidden">
             {(isParent || isStudent) ? (
               <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                 <div className="hidden sm:block h-8 w-px bg-slate-200 mx-2" />
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 sm:mb-0">Secure Retrieval:</span>
                 <button onClick={() => downloadOriginalAttachment(selectedSheet)} className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                   <FileDown size={16} /> DOWNLOAD ORIGINAL
                 </button>
                 <button onClick={() => exportAsWord(selectedSheet)} className="w-full sm:w-auto px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2">
                   <FileText size={16} /> EXPORT WORD
                 </button>
               </div>
             ) : (
               <button onClick={() => window.print()} className="w-full sm:w-auto px-10 py-4 bg-slate-100 text-slate-900 rounded-2xl font-black text-xs shadow-lg hover:bg-slate-200 active:scale-95 transition-all flex items-center gap-2 border">
                 <Printer size={16} /> PRINT RECORD
               </button>
             )}
             <button onClick={() => setSelectedSheet(null)} className="w-full sm:w-auto px-10 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs border transition-all">CLOSE</button>
          </div>
        </div>
      </div>
    );
  };

  const ConfirmationModal = () => {
    if (!confirmConfig) return null;
    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
        <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-8 text-center shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-200">
           <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <AlertTriangle size={32} />
           </div>
           <h3 className="text-xl font-black text-slate-900 mb-2">{confirmConfig.title}</h3>
           <p className="text-slate-400 text-sm font-medium mb-8 leading-relaxed">{confirmConfig.message}</p>
           <div className="flex flex-col gap-2">
              <button onClick={confirmConfig.onConfirm} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-rose-100">CONFIRM ACTION</button>
              <button onClick={() => setConfirmConfig(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">CANCEL</button>
           </div>
        </div>
      </div>
    );
  };

  const BottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 h-20 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] flex z-50 print:hidden">
      <button onClick={() => setActiveTab('current')} className={`flex flex-col items-center justify-center gap-1.5 flex-1 transition-all ${activeTab === 'current' ? 'text-indigo-600' : 'text-slate-300'}`}>
        <Home size={24} strokeWidth={2.5} />
        <span className="text-[9px] font-black uppercase tracking-widest">Dash</span>
      </button>
      <button onClick={() => setActiveTab('notifications')} className={`flex flex-col items-center justify-center gap-1.5 flex-1 transition-all ${activeTab === 'notifications' ? 'text-indigo-600' : 'text-slate-300'}`}>
        <Bell size={24} strokeWidth={2.5} />
        <span className="text-[9px] font-black uppercase tracking-widest">Notice</span>
      </button>
      <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center justify-center gap-1.5 flex-1 transition-all ${activeTab === 'profile' ? 'text-indigo-600' : 'text-slate-300'}`}>
        <User size={24} strokeWidth={2.5} />
        <span className="text-[9px] font-black uppercase tracking-widest">Profile</span>
      </button>
    </div>
  );

  if (!currentUser) return <AuthGateway />;

  if (currentUser.role === UserRole.STUDENT && studentProfile) {
    const mySheets = academicSheets.filter(s => s.targetStudentId === studentProfile.enrollmentNo);
    const activeS = activeSessions.find(s => s.isActive);
    const myAtt = attendance.filter(a => a.studentId === studentProfile.enrollmentNo);

    return (
      <Layout role="STUDENT" onLogout={handleLogout} title={studentProfile.department} userName={studentProfile.name}>
        <div className="pb-24">
          {activeTab === 'current' && (
            <div className="space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm relative overflow-hidden">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                       <div className={`w-2 h-2 rounded-full ${activeS ? 'bg-indigo-500 animate-pulse' : 'bg-slate-200'}`} />
                       Current Broadcast
                    </h3>
                    {activeS ? (
                      <div className="p-6 bg-indigo-50/50 rounded-3xl border border-indigo-100 flex justify-between items-center gap-4">
                         <div className="min-w-0">
                            <p className="text-xl font-black text-slate-900 truncate">{activeS.lectureName}</p>
                            <p className="text-xs text-indigo-600 font-bold mt-1">Automated Tracking On</p>
                         </div>
                         <div className={`px-5 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg ${myAtt.some(a => a.sessionId === activeS.id) ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white animate-pulse'}`}>
                            {myAtt.some(a => a.sessionId === activeS.id) ? 'Status: Present' : 'Establishing...'}
                         </div>
                      </div>
                    ) : (
                      <div className="text-center py-10"><p className="text-slate-300 font-medium italic">No active lectures found.</p></div>
                    )}
                  </div>
                  <GeofenceIndicator distance={distanceToCampus} radius={CAMPUS_LOCATION.radius} inRange={distanceToCampus !== null && distanceToCampus <= CAMPUS_LOCATION.radius} locationError={locationError} />
               </div>
               <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm">
                  <h3 className="font-black text-xl text-slate-900 mb-6 flex items-center gap-3"><ClipboardList className="text-indigo-600" /> Private Results</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mySheets.map(sheet => (
                      <div key={sheet.id} onClick={() => setSelectedSheet(sheet)} className="flex items-center justify-between p-5 bg-slate-50 rounded-3xl border border-slate-100 hover:border-indigo-400 hover:bg-white cursor-pointer group shadow-sm transition-all active:scale-95">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="p-3 bg-white rounded-2xl text-indigo-600 border shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                             <FileSpreadsheet size={20} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-sm text-slate-900 truncate">{sheet.fileName}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">Prof. {sheet.uploadedBy}</p>
                          </div>
                        </div>
                        <Maximize2 size={16} className="text-slate-200 group-hover:text-indigo-500" />
                      </div>
                    ))}
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'notifications' && (
             <div className="space-y-4">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Bell className="text-indigo-600" /> Notice Board</h2>
                {notices.map(n => (
                  <div key={n.id} className="p-8 bg-white rounded-[2rem] border border-slate-200 border-l-8 border-l-indigo-600 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                       <h4 className="font-black text-lg text-slate-900 leading-tight">{n.title}</h4>
                       <span className="text-[10px] font-black text-slate-300">{n.date}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm">{n.content}</p>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 text-[10px]">{n.author.charAt(0)}</div>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{n.author}</p>
                    </div>
                  </div>
                ))}
             </div>
          )}
          {activeTab === 'profile' && (
            <div className="flex flex-col items-center">
              <DigitalIDCard 
                name={studentProfile.name} idNo={studentProfile.enrollmentNo} dept={studentProfile.department}
                role="STUDENT" photoUrl={studentProfile.photoUrl} className={studentProfile.className}
                year={studentProfile.year} dob={studentProfile.dob} contact={studentProfile.contact}
              />
              <div className="grid grid-cols-2 gap-4 w-full max-w-sm mt-8">
                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center">
                    <p className="text-4xl font-black text-emerald-700">{myAtt.length}</p>
                    <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">Present</p>
                 </div>
                 <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 text-center">
                    <p className="text-4xl font-black text-rose-700">{Math.max(0, activeSessions.length - myAtt.length)}</p>
                    <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mt-1">Missed</p>
                 </div>
              </div>
            </div>
          )}
        </div>
        <BottomNav />
        {SheetViewer()}
        <ConfirmationModal />
      </Layout>
    );
  }

  if (currentUser.role === UserRole.TEACHER && teacherProfile) {
    const currS = activeSessions.find(s => s.isActive && s.teacherId === teacherProfile.teacherId);
    const presentCount = currS ? attendance.filter(a => a.sessionId === currS.id).length : 0;

    return (
      <Layout role="TEACHER" onLogout={handleLogout} title={teacherProfile.department} userName={teacherProfile.name}>
        <div className="pb-24">
          {activeTab === 'current' && (
            <div className="space-y-6">
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <h3 className="font-black text-xl mb-8 flex items-center gap-3 text-slate-900 tracking-tight">
                  <Clock size={28} className="text-blue-600" /> Class Governance
                </h3>
                {!currS ? (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const n = safeString((e.currentTarget.elements.namedItem('lect') as HTMLInputElement).value);
                    setActiveSessions(prev => [...prev, { id: `sess_${Date.now()}`, teacherId: teacherProfile.teacherId, lectureName: n, startTime: Date.now(), isActive: true, geofenceCenter: CAMPUS_LOCATION }]);
                  }} className="flex flex-col md:flex-row gap-4">
                    <input name="lect" placeholder="Lecture Identity (e.g. Physics 101)" required className="flex-1 p-5 rounded-3xl bg-slate-50 border font-black text-black text-sm outline-none" />
                    <button className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all active:scale-95">ESTABLISH ZONE</button>
                  </form>
                ) : (
                  <div className="space-y-8">
                    <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100 flex justify-between items-center gap-4">
                      <div>
                        <p className="text-[10px] text-blue-600 font-black uppercase tracking-widest mb-1">Broadcasting Live</p>
                        <h4 className="text-2xl font-black text-slate-900 leading-tight">{currS.lectureName}</h4>
                      </div>
                      <button onClick={() => setActiveSessions(prev => prev.map(s => s.id === currS.id ? { ...s, isActive: false } : s))} className="bg-rose-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all active:scale-95">END SESSION</button>
                    </div>
                    <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/20 text-center">
                       <p className="text-5xl font-black text-blue-600 mb-2">{presentCount}</p>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Students Marked Present</p>
                    </div>
                  </div>
                )}
               </div>

               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><Upload size={24} /></div>
                    <h3 className="font-black text-2xl text-slate-900 tracking-tight">Record Dissemination</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <label className="text-[11px] font-black uppercase text-slate-400 tracking-widest ml-1">Recipient Enrollment No</label>
                       <input 
                         value={targetStudentId} 
                         onChange={(e) => setTargetStudentId(e.target.value)} 
                         placeholder="Student ID (e.g. S123)" 
                         className="w-full p-5 rounded-3xl bg-slate-50 border font-black text-black outline-none focus:ring-2 focus:ring-blue-500" 
                       />
                    </div>
                    <div 
                      onClick={() => fileInputRef.current?.click()} 
                      className={`flex flex-col items-center justify-center p-10 border-4 border-dashed rounded-[2.5rem] transition-all cursor-pointer group ${targetStudentId ? 'bg-blue-50/30 border-blue-300 hover:border-blue-500' : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'}`}
                    >
                      <FileSpreadsheet size={40} className={targetStudentId ? 'text-blue-600 animate-bounce' : 'text-slate-200'} />
                      <p className="mt-4 font-black text-slate-900 text-lg">Push Marksheet</p>
                      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf, image/*, .xlsx" onChange={handleSheetUpload} disabled={!targetStudentId} />
                    </div>
                  </div>
               </div>
            </div>
          )}
          {activeTab === 'notifications' && (
            <div className="space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <h3 className="text-2xl font-black mb-10 text-slate-900 flex items-center gap-4"><PlusCircle className="text-blue-600" /> New Broadcast</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  const n: Notice = { id: `n_${Date.now()}`, title: safeString(fd.get('title')), content: safeString(fd.get('content')), author: teacherProfile.name, date: new Date().toLocaleDateString() };
                  setNotices(prev => [n, ...prev]);
                  (e.target as HTMLFormElement).reset();
                  alert("Broadcast Live!");
                }} className="space-y-6">
                  <input name="title" placeholder="Notice Headline" required className="w-full p-5 rounded-2xl bg-slate-50 border font-black text-black outline-none focus:ring-2 focus:ring-blue-500" />
                  <textarea name="content" placeholder="Broadcast Body..." required rows={5} className="w-full p-5 rounded-2xl bg-slate-50 border font-medium text-black outline-none focus:ring-2 focus:ring-blue-500" />
                  <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-3xl font-black shadow-xl hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3">
                    <Send size={20} /> DISPATCH NOTICE
                  </button>
                </form>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {notices.filter(n => n.author === teacherProfile.name).map(n => (
                   <div key={n.id} className="p-6 bg-white rounded-[2rem] border border-slate-200 relative group">
                      <button onClick={() => deleteNotice(n.id)} className="absolute top-4 right-4 p-2 text-rose-500 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={18} /></button>
                      <h5 className="font-black text-slate-900 pr-8">{n.title}</h5>
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{n.content}</p>
                   </div>
                 ))}
              </div>
            </div>
          )}
          {activeTab === 'profile' && (
            <div className="flex flex-col items-center">
              <DigitalIDCard 
                name={teacherProfile.name} idNo={teacherProfile.teacherId} dept={teacherProfile.department}
                role="TEACHER" photoUrl={teacherProfile.photoUrl} contact={teacherProfile.contact} subject={teacherProfile.subject}
              />
            </div>
          )}
        </div>
        <BottomNav />
        {SheetViewer()}
        <ConfirmationModal />
      </Layout>
    );
  }

  if (currentUser.role === UserRole.PARENT && parentProfile) {
    const wardId = currentUser.id;
    const wardP = enrolledStudents.find(s => s.enrollmentNo === wardId);
    const wardSheets = academicSheets.filter(s => s.targetStudentId === wardId);
    const wardAtt = attendance.filter(a => a.studentId === wardId);

    if (!wardP) return <div>Linking Error.</div>;

    return (
      <Layout role="PARENT" onLogout={handleLogout} title={`Guardian: ${parentProfile.parentName}`} userName={`Ward: ${wardP.name}`}>
        <div className="pb-24">
          {activeTab === 'current' && (
            <div className="space-y-8">
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden text-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center justify-center gap-2">
                   <TrendingUp className="text-amber-500" /> Ward Metrics
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-emerald-50/50 p-10 rounded-[2rem] border border-emerald-100 shadow-sm transition-transform hover:scale-105">
                    <p className="text-6xl font-black text-emerald-700 mb-2">{wardAtt.length}</p>
                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Recorded Presence</p>
                  </div>
                  <div className="bg-rose-50/50 p-10 rounded-[2rem] border border-rose-100 shadow-sm transition-transform hover:scale-105">
                    <p className="text-6xl font-black text-rose-700 mb-2">{Math.max(0, activeSessions.length - wardAtt.length)}</p>
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Missed Sessions</p>
                  </div>
                </div>
               </div>
               <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-black text-2xl text-slate-900 flex items-center gap-3"><BarChart className="text-amber-500" /> Performance Registry</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {wardSheets.map(sheet => (
                    <div key={sheet.id} onClick={() => setSelectedSheet(sheet)} className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-amber-400 hover:bg-white cursor-pointer group shadow-sm transition-all active:scale-95">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-3 bg-white rounded-2xl text-amber-600 border shadow-sm group-hover:bg-amber-500 group-hover:text-white transition-all">
                          <FileSpreadsheet size={24} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-black text-sm text-slate-900 truncate">{sheet.fileName}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Faculty Auth Required</p>
                        </div>
                      </div>
                      <Maximize2 size={18} className="text-slate-200 group-hover:text-amber-500" />
                    </div>
                  ))}
                  {wardSheets.length === 0 && (
                    <div className="col-span-full py-20 text-center border-4 border-dashed border-slate-100 rounded-[2.5rem]">
                      <FileSearch size={48} className="mx-auto text-slate-200 mb-4" />
                      <p className="text-slate-400 font-medium italic">No performance records published yet.</p>
                    </div>
                  )}
                </div>
               </div>
            </div>
          )}
          {activeTab === 'notifications' && (
             <div className="space-y-6">
               <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Bell className="text-amber-500" /> Campus Board</h2>
               {notices.map(n => (
                 <div key={n.id} className="p-10 bg-white rounded-[2rem] border border-slate-200 border-l-[12px] border-l-amber-500 shadow-sm">
                   <h4 className="font-black text-xl text-slate-900 mb-3">{n.title}</h4>
                   <p className="text-sm md:text-lg text-slate-600 leading-relaxed">{n.content}</p>
                 </div>
               ))}
               {notices.length === 0 && (
                 <div className="py-24 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                   <p className="text-slate-300">Board is currently clear.</p>
                 </div>
               )}
             </div>
          )}
          {activeTab === 'profile' && (
             <DigitalIDCard 
               name={wardP.name} idNo={wardP.enrollmentNo} dept={wardP.department} role="STUDENT" photoUrl={wardP.photoUrl}
               className={wardP.className} year={wardP.year} dob={wardP.dob} contact={wardP.contact}
             />
          )}
        </div>
        <BottomNav />
        {SheetViewer()}
        <ConfirmationModal />
      </Layout>
    );
  }

  return <AuthGateway />;
};

export default App;
