import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { LecturerHomeScreen } from '@/components/LecturerHomeScreen';
import { StudentHomeScreen } from '@/components/StudentHomeScreen';

export default function HomeScreen() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <View style={styles.container}>
      {user.role === 'lecturer' ? (
        <LecturerHomeScreen user={user} />
      ) : (
        <StudentHomeScreen user={user} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});