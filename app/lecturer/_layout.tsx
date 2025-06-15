import { Stack } from 'expo-router';

export default function LecturerLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create-session" />
      <Stack.Screen name="session/[id]" />
    </Stack>
  );
}