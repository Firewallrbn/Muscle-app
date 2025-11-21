import { Stack } from 'expo-router';
import { AuthProvider } from '../Context/AuthContext';
import { ExerciseProvider } from '../Context/ExerciseContext';

export default function RootLayout() {
    return (
        <AuthProvider>

            <ExerciseProvider>
                <Stack
                    initialRouteName='index'
                    screenOptions={{ headerShown: false }}
                >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(main)" />
                </Stack>
            </ExerciseProvider>

        </AuthProvider>
    );
}