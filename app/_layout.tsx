import { Stack } from 'expo-router';
import { AuthProvider } from '../Context/AuthContext';
import { ExerciseProvider } from '../Context/ExerciseContext';
import { RoutineBuilderProvider } from '../Context/RoutineBuilderContext';
import { ThemeProvider } from '../Context/ThemeContext';

export default function RootLayout() {
    return (
        <ThemeProvider>
            <AuthProvider>
                <ExerciseProvider>
                    <RoutineBuilderProvider>
                        <Stack
                            initialRouteName='index'
                            screenOptions={{ headerShown: false }}
                        >
                            <Stack.Screen name="index" />
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(main)" />
                        </Stack>
                    </RoutineBuilderProvider>
                </ExerciseProvider>
            </AuthProvider>
        </ThemeProvider>
    );
}