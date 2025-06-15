import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Calendar, Clock, MapPin, CircleCheck as CheckCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { getStudentAttendance, getLecturerSessions } from '@/services/attendance';
import { AttendanceRecord, LectureSession } from '@/types';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function HistoryScreen() {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [sessions, setSessions] = useState<LectureSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user) return;

    try {
      if (user.role === 'student') {
        const records = await getStudentAttendance(user.id);
        setAttendanceRecords(records);
      } else {
        const lecturerSessions = await getLecturerSessions(user.id);
        setSessions(lecturerSessions);
      }
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  if (loading) {
    return <LoadingSpinner message="Loading history..." />;
  }

  const renderAttendanceRecord = (record: AttendanceRecord) => (
    <View key={record.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.statusContainer}>
          <CheckCircle size={20} color="#059669" />
          <Text style={styles.statusText}>Present</Text>
        </View>
        <Text style={styles.recordDate}>
          {record.checkInTime.toLocaleDateString()}
        </Text>
      </View>
      
      <Text style={styles.courseName}>{record.courseName}</Text>
      <Text style={styles.courseId}>Course ID: {record.courseId}</Text>
      
      <View style={styles.recordDetails}>
        <View style={styles.detailItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {record.checkInTime.toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            Verified via {record.verificationMethod === 'qr' ? 'QR Code' : 'PIN'}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSessionRecord = (session: LectureSession) => (
    <View key={session.id} style={styles.recordCard}>
      <View style={styles.recordHeader}>
        <View style={styles.statusContainer}>
          <Calendar size={20} color="#2563EB" />
          <Text style={[styles.statusText, { color: '#2563EB' }]}>Session</Text>
        </View>
        <Text style={styles.recordDate}>{session.date}</Text>
      </View>
      
      <Text style={styles.courseName}>{session.courseName}</Text>
      <Text style={styles.courseId}>Course ID: {session.courseId}</Text>
      
      <View style={styles.recordDetails}>
        <View style={styles.detailItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {session.startTime} - {session.endTime}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={16} color="#6B7280" />
          <Text style={styles.detailText}>{session.roomLocation}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <CheckCircle size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            {session.checkedInStudents.length} students attended
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {user?.role === 'student' ? 'Attendance History' : 'Session History'}
        </Text>
        <Text style={styles.subtitle}>
          {user?.role === 'student' 
            ? `${attendanceRecords.length} attendance records`
            : `${sessions.length} sessions created`
          }
        </Text>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {user?.role === 'student' ? (
          attendanceRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No attendance records yet</Text>
              <Text style={styles.emptySubtext}>
                Start scanning QR codes to build your attendance history
              </Text>
            </View>
          ) : (
            attendanceRecords.map(renderAttendanceRecord)
          )
        ) : (
          sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No sessions created yet</Text>
              <Text style={styles.emptySubtext}>
                Create your first session to start tracking attendance
              </Text>
            </View>
          ) : (
            sessions.map(renderSessionRecord)
          )
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    padding: 24,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
    marginLeft: 8,
  },
  recordDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  courseId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  recordDetails: {
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});