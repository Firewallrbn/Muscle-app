import { Stack } from 'expo-router';
import { AuthProvider } from '../Context/AuthContext';
import { ExerciseProvider } from '../Context/ExerciseContext';
import { RoutineBuilderProvider } from '../Context/RoutineBuilderContext';
import { WorkoutProvider } from '../Context/WorkoutContext';

export default function RootLayout() {
    return (
        <AuthProvider>

            <ExerciseProvider>
                <RoutineBuilderProvider>
                    <WorkoutProvider>
                        <Stack
                            initialRouteName='index'
                            screenOptions={{ headerShown: false }}
                        >
                            <Stack.Screen name="index" />
                            <Stack.Screen name="(auth)" />
                            <Stack.Screen name="(tabs)" />
                        </Stack>
                    </WorkoutProvider>
                </RoutineBuilderProvider>
            </ExerciseProvider>

        </AuthProvider>
    );
}