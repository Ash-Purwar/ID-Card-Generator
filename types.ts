
export enum UserRole {
  STUDENT = 'STUDENT',
  TEACHER = 'TEACHER',
  PARENT = 'PARENT'
}

export interface StudentProfile {
  name: string;
  enrollmentNo: string;
  password?: string;
  department: string;
  className: string;
  year: string;
  dob: string;
  contact: string;
  photoUrl: string;
  isEnrolled: boolean;
}

export interface TeacherProfile {
  name: string;
  teacherId: string;
  password?: string;
  department: string;
  subject: string;
  contact: string;
  photoUrl: string;
  isEnrolled: boolean;
}

export interface ParentProfile {
  wardId: string;
  parentName: string;
  password?: string;
  contact: string;
}

export interface LectureSession {
  id: string;
  teacherId: string;
  lectureName: string;
  startTime: number;
  endTime?: number;
  isActive: boolean;
  geofenceCenter: { lat: number; lng: number };
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  sessionId: string;
  timestamp: number;
  status: 'PRESENT' | 'ABSENT';
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
}

export interface AcademicSheet {
  id: string;
  fileName: string;
  fileType: string;
  uploadDate: string;
  uploadedBy: string;
  description: string;
  targetStudentId: string; 
  fileData?: string; 
}
