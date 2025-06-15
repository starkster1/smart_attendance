import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  BookOpen, 
  Hash,
  Plus,
  CheckCircle
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { createLectureSession } from '@/services/attendance';
import { getCurrentLocation } from '@/services/location';
import { generateSessionPin, generateQRData } from '@/utils/qr';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';

export default function CreateSessionScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [sessionData, setSessionData] = useState({
    courseId: '',
    courseName: '',
    roomLocation: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    allowedRadius: 100,
  });

  const progressAnimation = useSharedValue(0);
  const stepAnimation = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressAnimation.value}%`,
  }));

  const stepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: stepAnimation.value }],
  }));

  useEffect(() => {
    progressAnimation.value = withTiming((step / 3) * 100, { duration: 300 });
    stepAnimation.value = withSpring(0, { damping: 20, stiffness: 90 });
  }, [step]);

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!sessionData.courseId) newErrors.courseId = 'Course ID is required';
      if (!sessionData.courseName) newErrors.courseName = 'Course name is required';
    } else if (currentStep === 2) {
      if (!sessionData.roomLocation) newErrors.roomLocation = 'Room location is required';
      if (!sessionData.date) newErrors.date = 'Date is required';
      if (!sessionData.startTime) newErrors.startTime = 'Start time is required';
      if (!sessionData.endTime) newErrors.endTime = 'End time is required';
      
      if (sessionData.startTime && sessionData.endTime) {
        const start = new Date(`2000-01-01T${sessionData.startTime}`);
        const end = new Date(`2000-01-01T${sessionData.endTime}`);
        if (start >= end) {
          newErrors.endTime = 'End time must be after start time';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep(step + 1);
        stepAnimation.value = withSpring(-50, { damping: 20, stiffness: 90 });
      }
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      stepAnimation.value = withSpring(50, { damping: 20, stiffness: 90 });
    }
  };

  const createSession = async () => {
    if (!validateStep(step)) return;

    setLoading(true);
    try {
      // Get current location
      const location = await getCurrentLocation();
      if (!location) {
        throw new Error('Unable to get location. Please enable location services.');
      }

      // Generate PIN and QR data
      const pin = generateSessionPin();
      const qrData = generateQRData({
        ...sessionData,
        lecturerName: user!.name,
        lecturerId: user!.id,
        latitude: location.latitude,
        longitude: location.longitude,
        pin,
        qrData: '',
        isActive: true,
        allowedRadius: sessionData.allowedRadius,
      });

      // Create session in Firebase
      const sessionId = await createLectureSession({
        ...sessionData,
        lecturerName: user!.name,
        lecturerId: user!.id,
        latitude: location.latitude,
        longitude: location.longitude,
        pin,
        qrData,
        isActive: true,
        allowedRadius: sessionData.allowedRadius,
      });

      Alert.alert(
        'Session Created!',
        'Your lecture session has been created successfully.',
        [
          {
            text: 'View Session',
            onPress: () => router.replace(`/lecturer/session/${sessionId}`),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const updateSessionData = (field: string, value: string | number) => {
    setSessionData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Creating session..." />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#2563EB', '#1D4ED8']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Create Session</Text>
            <Text style={styles.headerSubtitle}>Step {step} of 3</Text>
          </View>
        </View>
        
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View style={[styles.progressBar, progressStyle]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.stepContainer, stepStyle]}>
          {step === 1 && (
            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <BookOpen size={32} color="#2563EB" />
                <Text style={styles.stepTitle}>Course Information</Text>
                <Text style={styles.stepDescription}>
                  Enter the basic details about your course
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Course ID</Text>
                <View style={[styles.inputContainer, errors.courseId && styles.inputError]}>
                  <Hash size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., CS101"
                    value={sessionData.courseId}
                    onChangeText={(text) => updateSessionData('courseId', text)}
                    autoCapitalize="characters"
                  />
                </View>
                {errors.courseId && <Text style={styles.errorText}>{errors.courseId}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Course Name</Text>
                <View style={[styles.inputContainer, errors.courseName && styles.inputError]}>
                  <BookOpen size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Introduction to Computer Science"
                    value={sessionData.courseName}
                    onChangeText={(text) => updateSessionData('courseName', text)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.courseName && <Text style={styles.errorText}>{errors.courseName}</Text>}
              </View>
            </View>
          )}

          {step === 2 && (
            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <Calendar size={32} color="#2563EB" />
                <Text style={styles.stepTitle}>Schedule & Location</Text>
                <Text style={styles.stepDescription}>
                  Set the time and location for your session
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Room Location</Text>
                <View style={[styles.inputContainer, errors.roomLocation && styles.inputError]}>
                  <MapPin size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Room 101, Building A"
                    value={sessionData.roomLocation}
                    onChangeText={(text) => updateSessionData('roomLocation', text)}
                    autoCapitalize="words"
                  />
                </View>
                {errors.roomLocation && <Text style={styles.errorText}>{errors.roomLocation}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Date</Text>
                <View style={[styles.inputContainer, errors.date && styles.inputError]}>
                  <Calendar size={20} color="#6B7280" />
                  <TextInput
                    style={styles.input}
                    placeholder="YYYY-MM-DD"
                    value={sessionData.date}
                    onChangeText={(text) => updateSessionData('date', text)}
                  />
                </View>
                {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
              </View>

              <View style={styles.timeRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Start Time</Text>
                  <View style={[styles.inputContainer, errors.startTime && styles.inputError]}>
                    <Clock size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      value={sessionData.startTime}
                      onChangeText={(text) => updateSessionData('startTime', text)}
                    />
                  </View>
                  {errors.startTime && <Text style={styles.errorText}>{errors.startTime}</Text>}
                </View>

                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>End Time</Text>
                  <View style={[styles.inputContainer, errors.endTime && styles.inputError]}>
                    <Clock size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="HH:MM"
                      value={sessionData.endTime}
                      onChangeText={(text) => updateSessionData('endTime', text)}
                    />
                  </View>
                  {errors.endTime && <Text style={styles.errorText}>{errors.endTime}</Text>}
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.step}>
              <View style={styles.stepHeader}>
                <CheckCircle size={32} color="#059669" />
                <Text style={styles.stepTitle}>Review & Create</Text>
                <Text style={styles.stepDescription}>
                  Review your session details before creating
                </Text>
              </View>

              <View style={styles.reviewCard}>
                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Course</Text>
                  <Text style={styles.reviewValue}>
                    {sessionData.courseId} - {sessionData.courseName}
                  </Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Location</Text>
                  <Text style={styles.reviewValue}>{sessionData.roomLocation}</Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Date & Time</Text>
                  <Text style={styles.reviewValue}>
                    {sessionData.date} • {sessionData.startTime} - {sessionData.endTime}
                  </Text>
                </View>

                <View style={styles.reviewItem}>
                  <Text style={styles.reviewLabel}>Lecturer</Text>
                  <Text style={styles.reviewValue}>{user?.name}</Text>
                </View>
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.buttonRow}>
          {step > 1 && (
            <TouchableOpacity style={styles.secondaryButton} onPress={prevStep}>
              <Text style={styles.secondaryButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.primaryButton, step === 1 && styles.fullWidthButton]} 
            onPress={step === 3 ? createSession : nextStep}
          >
            <Text style={styles.primaryButtonText}>
              {step === 3 ? 'Create Session' : 'Next'}
            </Text>
            {step < 3 ? (
              <Plus size={20} color="#FFFFFF" />
            ) : (
              <CheckCircle size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
    marginBottom: 20,
  },
  backButton: {
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
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  stepContainer: {
    flex: 1,
  },
  step: {
    flex: 1,
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stepTitle: {
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    color: '#1F2937',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    marginLeft: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  reviewItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  reviewLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  reviewValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  footer: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  primaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#2563EB',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fullWidthButton: {
    flex: 1,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});