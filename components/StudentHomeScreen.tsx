import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  QrCode, 
  MapPin, 
  Clock, 
  AlertCircle, 
  Camera,
  X,
  Zap,
  Shield,
  CheckCircle
} from 'lucide-react-native';
import { User } from '@/types';
import { parseQRData, validateQRData, isSessionActive } from '@/utils/qr';
import { getCurrentLocation, isWithinRadius } from '@/services/location';
import { recordAttendance, getActiveSession } from '@/services/attendance';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withRepeat,
  withSequence
} from 'react-native-reanimated';

interface StudentHomeScreenProps {
  user: User;
}

export const StudentHomeScreen: React.FC<StudentHomeScreenProps> = ({ user }) => {
  const [showCamera, setShowCamera] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const scanAnimation = useSharedValue(1);
  const pulseAnimation = useSharedValue(1);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanAnimation.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  useEffect(() => {
    // Start pulse animation
    pulseAnimation.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const handleScanPress = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    
    scanAnimation.value = withSpring(0.95, { damping: 15, stiffness: 200 });
    setTimeout(() => {
      setShowCamera(true);
      scanAnimation.value = withSpring(1, { damping: 15, stiffness: 200 });
    }, 150);
  };

  const handleQRScanned = async ({ data }: { data: string }) => {
    if (scanning) return;
    
    setScanning(true);
    setShowCamera(false);

    try {
      // Parse QR data
      const qrData = parseQRData(data);
      
      if (!validateQRData(qrData)) {
        throw new Error('Invalid QR code format');
      }

      // Check if session is still active
      if (!isSessionActive(qrData.startTime, qrData.endTime, qrData.date)) {
        throw new Error('This session is no longer active');
      }

      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get your location. Please enable location services.');
      }

      // Verify location proximity (100 meters radius)
      const withinRadius = isWithinRadius(
        location.latitude,
        location.longitude,
        qrData.latitude,
        qrData.longitude,
        100
      );

      if (!withinRadius) {
        throw new Error('You must be within 100 meters of the class location to check in.');
      }

      // Get the actual session from Firebase
      const session = await getActiveSession(qrData.sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      // Check if already checked in
      if (session.checkedInStudents.includes(user.id)) {
        throw new Error('You have already checked in for this session');
      }

      // Record attendance
      await recordAttendance(
        session.id,
        user.id,
        user.name,
        location,
        'qr'
      );

      Alert.alert(
        'Success!',
        `You have successfully checked in for ${qrData.courseName}`,
        [{ text: 'OK' }]
      );

    } catch (error: any) {
      Alert.alert('Check-in Failed', error.message || 'Failed to process QR code');
    } finally {
      setScanning(false);
    }
  };

  if (scanning) {
    return <LoadingSpinner message="Processing check-in..." />;
  }

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          onBarcodeScanned={handleQRScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.8)', 'transparent', 'rgba(0,0,0,0.8)']}
            style={styles.cameraOverlay}
          >
            <View style={styles.cameraHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            <View style={styles.scanArea}>
              <View style={styles.scanFrame}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
              </View>
              <Text style={styles.scanText}>
                Position the QR code within the frame
              </Text>
            </View>

            <View style={styles.cameraFooter}>
              <Text style={styles.cameraInstructions}>
                Make sure you're within 100 meters of the classroom
              </Text>
            </View>
          </LinearGradient>
        </CameraView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.welcomeSection}>
            <Text style={styles.greeting}>Hello,</Text>
            <Text style={styles.name}>{user.name}</Text>
            {user.studentId && (
              <Text style={styles.studentId}>ID: {user.studentId}</Text>
            )}
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        </View>
      </LinearGradient>

      {/* Main Scan Section */}
      <View style={styles.scanSection}>
        <BlurView intensity={20} tint="light" style={styles.scanCard}>
          <Animated.View style={[styles.scanIconContainer, pulseStyle]}>
            <QrCode size={64} color="#2563EB" strokeWidth={1.5} />
          </Animated.View>
          
          <Text style={styles.scanTitle}>Scan to Check In</Text>
          <Text style={styles.scanSubtitle}>
            Scan the QR code displayed by your lecturer to mark your attendance
          </Text>
          
          <Animated.View style={scanStyle}>
            <TouchableOpacity style={styles.scanButton} onPress={handleScanPress}>
              <Camera size={24} color="#FFFFFF" />
              <Text style={styles.scanButtonText}>Open Camera</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <Text style={styles.featuresTitle}>How it works</Text>
        
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <QrCode size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>1. Scan QR Code</Text>
              <Text style={styles.featureDescription}>
                Use your camera to scan the QR code shown by your lecturer
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#059669' }]}>
              <MapPin size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>2. Location Verified</Text>
              <Text style={styles.featureDescription}>
                Your location is checked to ensure you're in the classroom
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={[styles.featureIcon, { backgroundColor: '#7C3AED' }]}>
              <CheckCircle size={24} color="#FFFFFF" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>3. Attendance Recorded</Text>
              <Text style={styles.featureDescription}>
                Your attendance is automatically recorded in the system
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Security Notice */}
      <View style={styles.securitySection}>
        <View style={styles.securityCard}>
          <View style={styles.securityHeader}>
            <Shield size={24} color="#DC2626" />
            <Text style={styles.securityTitle}>Security Notice</Text>
          </View>
          <Text style={styles.securityText}>
            You must be physically present in the classroom to check in. 
            Location spoofing will be detected and may result in attendance penalties.
          </Text>
        </View>
      </View>

      {/* Background Image */}
      <Image
        source={{ uri: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg' }}
        style={styles.backgroundImage}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  contentContainer: {
    paddingBottom: 32,
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.05,
    zIndex: -1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  welcomeSection: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  name: {
    fontSize: 28,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginTop: 4,
  },
  studentId: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  scanSection: {
    padding: 24,
    marginTop: -20,
  },
  scanCard: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 12,
  },
  scanIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  scanTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  scanSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    maxWidth: 280,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  featuresSection: {
    padding: 24,
    paddingTop: 0,
  },
  featuresTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 20,
  },
  securitySection: {
    padding: 24,
    paddingTop: 0,
  },
  securityCard: {
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    marginLeft: 12,
  },
  securityText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#7F1D1D',
    lineHeight: 20,
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  cameraHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  scanText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
    marginTop: 30,
    paddingHorizontal: 40,
  },
  cameraFooter: {
    padding: 24,
    alignItems: 'center',
  },
  cameraInstructions: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
  },
});