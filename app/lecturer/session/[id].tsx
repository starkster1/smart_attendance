import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Users, 
  Clock, 
  MapPin, 
  QrCode, 
  Share2,
  ToggleLeft,
  ToggleRight,
  Copy,
  Download
} from 'lucide-react-native';
import { getActiveSession, getLecturerSessions } from '@/services/attendance';
import { LectureSession } from '@/types';
import { QRCodeGenerator } from '@/components/QRCodeGenerator';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring
} from 'react-native-reanimated';

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [session, setSession] = useState<LectureSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showQR, setShowQR] = useState(true);

  const qrAnimation = useSharedValue(1);
  const pinAnimation = useSharedValue(0);

  const qrStyle = useAnimatedStyle(() => ({
    opacity: qrAnimation.value,
    transform: [{ scale: qrAnimation.value }],
  }));

  const pinStyle = useAnimatedStyle(() => ({
    opacity: pinAnimation.value,
    transform: [{ scale: pinAnimation.value }],
  }));

  const loadSession = async () => {
    if (!id) return;
    
    try {
      const sessionData = await getActiveSession(id);
      setSession(sessionData);
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSession();
    setRefreshing(false);
  };

  const toggleDisplay = () => {
    if (showQR) {
      qrAnimation.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        setShowQR(false);
        pinAnimation.value = withSpring(1, { damping: 15, stiffness: 100 });
      }, 200);
    } else {
      pinAnimation.value = withTiming(0, { duration: 200 });
      setTimeout(() => {
        setShowQR(true);
        qrAnimation.value = withSpring(1, { damping: 15, stiffness: 100 });
      }, 200);
    }
  };

  const shareSession = async () => {
    if (!session) return;

    const message = `Join my lecture session!\n\nCourse: ${session.courseName} (${session.courseId})\nRoom: ${session.roomLocation}\nTime: ${session.startTime} - ${session.endTime}\nPIN: ${session.pin}`;

    try {
      await Share.share({
        message,
        title: 'Lecture Session',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  useEffect(() => {
    loadSession();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="Loading session..." />;
  }

  if (!session) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Session not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.headerBackButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{session.courseName}</Text>
            <Text style={styles.headerSubtitle}>{session.courseId}</Text>
          </View>
          <TouchableOpacity onPress={shareSession} style={styles.shareButton}>
            <Share2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Session Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MapPin size={20} color="#6B7280" />
            <Text style={styles.infoText}>{session.roomLocation}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {session.date} • {session.startTime} - {session.endTime}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Users size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              {session.checkedInStudents.length} students checked in
            </Text>
          </View>
        </View>

        {/* QR Code / PIN Display */}
        <View style={styles.displayCard}>
          <View style={styles.displayHeader}>
            <Text style={styles.displayTitle}>
              {showQR ? 'QR Code' : 'Session PIN'}
            </Text>
            <TouchableOpacity onPress={toggleDisplay} style={styles.toggleButton}>
              {showQR ? (
                <ToggleRight size={24} color="#2563EB" />
              ) : (
                <ToggleLeft size={24} color="#2563EB" />
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.displayContent}>
            {showQR ? (
              <Animated.View style={[styles.qrContainer, qrStyle]}>
                <QRCodeGenerator
                  value={session.qrData}
                  size={200}
                  title="Scan to check in"
                />
              </Animated.View>
            ) : (
              <Animated.View style={[styles.pinContainer, pinStyle]}>
                <Text style={styles.pinLabel}>Session PIN</Text>
                <Text style={styles.pinCode}>{session.pin}</Text>
                <Text style={styles.pinDescription}>
                  Students can use this PIN as an alternative to QR scanning
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Attendance List */}
        <View style={styles.attendanceCard}>
          <Text style={styles.attendanceTitle}>Attendance ({session.checkedInStudents.length})</Text>
          
          {session.checkedInStudents.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No students checked in yet</Text>
              <Text style={styles.emptySubtext}>
                Students will appear here once they scan the QR code or enter the PIN
              </Text>
            </View>
          ) : (
            <View style={styles.attendanceList}>
              {session.checkedInStudents.map((studentId, index) => (
                <View key={studentId} style={styles.attendanceItem}>
                  <View style={styles.studentAvatar}>
                    <Text style={styles.studentInitial}>
                      {(index + 1).toString()}
                    </Text>
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>Student {index + 1}</Text>
                    <Text style={styles.studentId}>ID: {studentId}</Text>
                  </View>
                  <View style={styles.checkInTime}>
                    <Text style={styles.timeText}>Just now</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#374151',
    marginLeft: 12,
  },
  displayCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  displayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  displayTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
  },
  toggleButton: {
    padding: 8,
  },
  displayContent: {
    alignItems: 'center',
    minHeight: 250,
    justifyContent: 'center',
  },
  qrContainer: {
    alignItems: 'center',
  },
  pinContainer: {
    alignItems: 'center',
  },
  pinLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 12,
  },
  pinCode: {
    fontSize: 48,
    fontFamily: 'Poppins-Bold',
    color: '#2563EB',
    letterSpacing: 8,
    marginBottom: 16,
  },
  pinDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
  attendanceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  attendanceTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
  attendanceList: {
    gap: 12,
  },
  attendanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  studentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInitial: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  studentId: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  checkInTime: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: '#059669',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginBottom: 20,
  },
  backButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});