import { Stack } from 'expo-router';

export default function RoutineStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="create" />
      <Stack.Screen name="add-exercises" />
      <Stack.Screen name="parameters" />
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
