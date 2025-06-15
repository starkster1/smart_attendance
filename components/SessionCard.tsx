import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Clock, MapPin, Users } from 'lucide-react-native';
import { LectureSession } from '@/types';

interface SessionCardProps {
  session: LectureSession;
  onPress?: () => void;
  showAttendeeCount?: boolean;
}

export const SessionCard: React.FC<SessionCardProps> = ({ 
  session, 
  onPress, 
  showAttendeeCount = false 
}) => {
  const isActive = session.isActive;
  
  return (
    <TouchableOpacity 
      style={[styles.card, isActive && styles.activeCard]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.courseName}>{session.courseName}</Text>
        <View style={[styles.statusBadge, isActive && styles.activeBadge]}>
          <Text style={[styles.statusText, isActive && styles.activeStatusText]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      
      <Text style={styles.courseId}>Course ID: {session.courseId}</Text>
      
      <View style={styles.infoRow}>
        <MapPin size={16} color="#64748B" />
        <Text style={styles.infoText}>{session.roomLocation}</Text>
      </View>
      
      <View style={styles.infoRow}>
        <Clock size={16} color="#64748B" />
        <Text style={styles.infoText}>
          {session.date} • {session.startTime} - {session.endTime}
        </Text>
      </View>
      
      {showAttendeeCount && (
        <View style={styles.infoRow}>
          <Users size={16} color="#64748B" />
          <Text style={styles.infoText}>
            {session.checkedInStudents.length} students checked in
          </Text>
        </View>
      )}
      
      <Text style={styles.lecturer}>Lecturer: {session.lecturerName}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activeCard: {
    borderColor: '#059669',
    backgroundColor: '#F0FDF4',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  courseName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  courseId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  activeStatusText: {
    color: '#059669',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 8,
  },
  lecturer: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginTop: 4,
  },
});