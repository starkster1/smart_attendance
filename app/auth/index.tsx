import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  User, 
  Hash, 
  Building, 
  Eye, 
  EyeOff,
  ArrowRight 
} from 'lucide-react-native';
import { signIn, signUp } from '@/services/auth';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  interpolate
} from 'react-native-reanimated';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'student' as 'lecturer' | 'student',
    studentId: '',
    department: '',
  });

  const { setUser } = useAuth();
  const router = useRouter();

  const slideAnimation = useSharedValue(0);

  const loginFormStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(slideAnimation.value, [0, 1], [0, -400])
      }
    ],
    opacity: interpolate(slideAnimation.value, [0, 0.5, 1], [1, 0, 0])
  }));

  const signupFormStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: interpolate(slideAnimation.value, [0, 1], [400, 0])
      }
    ],
    opacity: interpolate(slideAnimation.value, [0, 0.5, 1], [0, 0, 1])
  }));

  const toggleAuthMode = (mode: boolean) => {
    setIsLogin(mode);
    slideAnimation.value = withSpring(mode ? 0 : 1, {
      damping: 20,
      stiffness: 90,
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = 'Full name is required';
      }
      if (!formData.department) {
        newErrors.department = 'Department is required';
      }
      if (formData.role === 'student' && !formData.studentId) {
        newErrors.studentId = 'Student ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAuth = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (isLogin) {
        const user = await signIn(formData.email, formData.password);
        if (user) {
          setUser(user);
          router.replace('/(tabs)');
        }
      } else {
        const additionalData = formData.role === 'student' 
          ? { studentId: formData.studentId, department: formData.department }
          : { department: formData.department };
          
        const user = await signUp(
          formData.email,
          formData.password,
          formData.name,
          formData.role,
          additionalData
        );
        setUser(user);
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      setErrors({ general: error.message || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg' }}
        style={styles.backgroundImage}
      />
      <LinearGradient
        colors={['rgba(37, 99, 235, 0.9)', 'rgba(29, 78, 216, 0.95)']}
        style={styles.overlay}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <GraduationCap size={48} color="#FFFFFF" strokeWidth={1.5} />
            </View>
            <Text style={styles.title}>Smart Attendance</Text>
            <Text style={styles.subtitle}>
              Welcome to the future of attendance tracking
            </Text>
          </View>

          {/* Auth Form Container */}
          <BlurView intensity={20} tint="light" style={styles.formContainer}>
            {/* Tab Switcher */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.activeTab]}
                onPress={() => toggleAuthMode(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.activeTab]}
                onPress={() => toggleAuthMode(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Message */}
            {errors.general && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{errors.general}</Text>
              </View>
            )}

            {/* Forms */}
            <View style={styles.formsContainer}>
              {/* Login Form */}
              <Animated.View style={[styles.form, loginFormStyle]}>
                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#9CA3AF"
                      value={formData.email}
                      onChangeText={(text) => updateFormData('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                    <Lock size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Password"
                      placeholderTextColor="#9CA3AF"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      secureTextEntry={!showPassword}
                      autoComplete="password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </View>
              </Animated.View>

              {/* Signup Form */}
              <Animated.View style={[styles.form, signupFormStyle, { position: 'absolute', width: '100%' }]}>
                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.name && styles.inputError]}>
                    <User size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Full Name"
                      placeholderTextColor="#9CA3AF"
                      value={formData.name}
                      onChangeText={(text) => updateFormData('name', text)}
                      autoCapitalize="words"
                      autoComplete="name"
                    />
                  </View>
                  {errors.name && <Text style={styles.fieldError}>{errors.name}</Text>}
                </View>

                <View style={styles.roleContainer}>
                  <Text style={styles.roleLabel}>I am a:</Text>
                  <View style={styles.roleButtons}>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'student' && styles.activeRoleButton,
                      ]}
                      onPress={() => updateFormData('role', 'student')}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          formData.role === 'student' && styles.activeRoleButtonText,
                        ]}
                      >
                        Student
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.roleButton,
                        formData.role === 'lecturer' && styles.activeRoleButton,
                      ]}
                      onPress={() => updateFormData('role', 'lecturer')}
                    >
                      <Text
                        style={[
                          styles.roleButtonText,
                          formData.role === 'lecturer' && styles.activeRoleButtonText,
                        ]}
                      >
                        Lecturer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {formData.role === 'student' && (
                  <View style={styles.inputGroup}>
                    <View style={[styles.inputContainer, errors.studentId && styles.inputError]}>
                      <Hash size={20} color="#6B7280" />
                      <TextInput
                        style={styles.input}
                        placeholder="Student ID"
                        placeholderTextColor="#9CA3AF"
                        value={formData.studentId}
                        onChangeText={(text) => updateFormData('studentId', text)}
                        autoCapitalize="characters"
                      />
                    </View>
                    {errors.studentId && <Text style={styles.fieldError}>{errors.studentId}</Text>}
                  </View>
                )}

                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.department && styles.inputError]}>
                    <Building size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Department"
                      placeholderTextColor="#9CA3AF"
                      value={formData.department}
                      onChangeText={(text) => updateFormData('department', text)}
                      autoCapitalize="words"
                    />
                  </View>
                  {errors.department && <Text style={styles.fieldError}>{errors.department}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                    <Mail size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Email address"
                      placeholderTextColor="#9CA3AF"
                      value={formData.email}
                      onChangeText={(text) => updateFormData('email', text)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoComplete="email"
                    />
                  </View>
                  {errors.email && <Text style={styles.fieldError}>{errors.email}</Text>}
                </View>

                <View style={styles.inputGroup}>
                  <View style={[styles.inputContainer, errors.password && styles.inputError]}>
                    <Lock size={20} color="#6B7280" />
                    <TextInput
                      style={styles.input}
                      placeholder="Password (min. 6 characters)"
                      placeholderTextColor="#9CA3AF"
                      value={formData.password}
                      onChangeText={(text) => updateFormData('password', text)}
                      secureTextEntry={!showPassword}
                      autoComplete="new-password"
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      {showPassword ? (
                        <EyeOff size={20} color="#6B7280" />
                      ) : (
                        <Eye size={20} color="#6B7280" />
                      )}
                    </TouchableOpacity>
                  </View>
                  {errors.password && <Text style={styles.fieldError}>{errors.password}</Text>}
                </View>
              </Animated.View>
            </View>

            {/* Submit Button */}
            <TouchableOpacity style={styles.authButton} onPress={handleAuth}>
              <Text style={styles.authButtonText}>
                {isLogin ? 'Sign In' : 'Create Account'}
              </Text>
              <ArrowRight size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </BlurView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    borderRadius: 24,
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  errorText: {
    color: '#FEF2F2',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  formsContainer: {
    position: 'relative',
    minHeight: 300,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(254, 242, 242, 0.9)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    marginLeft: 12,
    color: '#1F2937',
  },
  fieldError: {
    color: '#FEF2F2',
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    marginTop: 4,
    marginLeft: 4,
  },
  roleContainer: {
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  activeRoleButton: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roleButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeRoleButtonText: {
    color: '#FFFFFF',
  },
  authButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  authButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2563EB',
  },
});