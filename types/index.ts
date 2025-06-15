export interface User {
  id: string;
  email: string;
  name: string;
  role: 'lecturer' | 'student';
  studentId?: string;
  department?: string;
}

export interface LectureSession {
  id: string;
  courseId: string;
  courseName: string;
  lecturerName: string;
  lecturerId: string;
  roomLocation: string;
  date: string;
  startTime: string;
  endTime: string;
  latitude: number;
  longitude: number;
  pin: string;
  qrData: string;
  isActive: boolean;
  createdAt: Date;
  checkedInStudents: string[];
  allowedRadius: number; // in meters
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseName: string;
  checkInTime: Date;
  latitude: number;
  longitude: number;
  status: 'present' | 'absent' | 'late';
  verificationMethod: 'qr' | 'pin';
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}