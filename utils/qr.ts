import { LectureSession } from '@/types';

export const generateSessionPin = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateQRData = (session: Omit<LectureSession, 'id' | 'createdAt' | 'checkedInStudents'>): string => {
  const qrData = {
    sessionId: 'temp_id', // Will be replaced with actual ID after creation
    courseId: session.courseId,
    courseName: session.courseName,
    lecturerName: session.lecturerName,
    roomLocation: session.roomLocation,
    date: session.date,
    startTime: session.startTime,
    latitude: session.latitude,
    longitude: session.longitude,
    pin: session.pin,
    timestamp: Date.now()
  };

  return JSON.stringify(qrData);
};

export const parseQRData = (qrString: string): any => {
  try {
    return JSON.parse(qrString);
  } catch (error) {
    throw new Error('Invalid QR code format');
  }
};

export const validateQRData = (qrData: any): boolean => {
  const requiredFields = [
    'courseId', 'courseName', 'lecturerName', 
    'roomLocation', 'date', 'startTime', 
    'latitude', 'longitude', 'pin', 'timestamp'
  ];

  return requiredFields.every(field => qrData.hasOwnProperty(field));
};

export const isSessionActive = (startTime: string, endTime: string, date: string): boolean => {
  const now = new Date();
  const sessionDate = new Date(date);
  
  // Check if it's the correct date
  if (now.toDateString() !== sessionDate.toDateString()) {
    return false;
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  
  const startDateTime = new Date(sessionDate);
  startDateTime.setHours(startHour, startMinute, 0, 0);
  
  const endDateTime = new Date(sessionDate);
  endDateTime.setHours(endHour, endMinute, 0, 0);

  return now >= startDateTime && now <= endDateTime;
};