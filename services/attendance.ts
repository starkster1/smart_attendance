import { db } from '@/config/firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { LectureSession, AttendanceRecord, LocationData } from '@/types';

export const createLectureSession = async (sessionData: Omit<LectureSession, 'id' | 'createdAt' | 'checkedInStudents'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'sessions'), {
      ...sessionData,
      createdAt: Timestamp.now(),
      checkedInStudents: []
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getActiveSession = async (sessionId: string): Promise<LectureSession | null> => {
  try {
    const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
    
    if (sessionDoc.exists()) {
      const data = sessionDoc.data();
      return {
        id: sessionDoc.id,
        ...data,
        createdAt: data.createdAt.toDate()
      } as LectureSession;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
};

export const getLecturerSessions = async (lecturerId: string): Promise<LectureSession[]> => {
  try {
    const q = query(
      collection(db, 'sessions'),
      where('lecturerId', '==', lecturerId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as LectureSession[];
  } catch (error) {
    console.error('Error getting lecturer sessions:', error);
    return [];
  }
};

export const recordAttendance = async (
  sessionId: string,
  studentId: string,
  studentName: string,
  location: LocationData,
  verificationMethod: 'qr' | 'pin'
): Promise<void> => {
  try {
    // Get session details
    const session = await getActiveSession(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Create attendance record
    const attendanceRecord: Omit<AttendanceRecord, 'id'> = {
      sessionId,
      studentId,
      studentName,
      courseId: session.courseId,
      courseName: session.courseName,
      checkInTime: new Date(),
      latitude: location.latitude,
      longitude: location.longitude,
      status: 'present',
      verificationMethod
    };

    // Add attendance record
    await addDoc(collection(db, 'attendance'), {
      ...attendanceRecord,
      checkInTime: Timestamp.now()
    });

    // Update session with checked-in student
    await updateDoc(doc(db, 'sessions', sessionId), {
      checkedInStudents: arrayUnion(studentId)
    });

  } catch (error) {
    console.error('Error recording attendance:', error);
    throw error;
  }
};

export const getStudentAttendance = async (studentId: string): Promise<AttendanceRecord[]> => {
  try {
    const q = query(
      collection(db, 'attendance'),
      where('studentId', '==', studentId),
      orderBy('checkInTime', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      checkInTime: doc.data().checkInTime.toDate()
    })) as AttendanceRecord[];
  } catch (error) {
    console.error('Error getting student attendance:', error);
    return [];
  }
};