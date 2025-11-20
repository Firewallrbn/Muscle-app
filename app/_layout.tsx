import { StripeProvider } from '@stripe/stripe-react-native';
import { Stack } from 'expo-router';
import { AuthProvider } from '../Context/AuthContext';
import { ExerciseProvider } from '../Context/ExerciseContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <StripeProvider publishableKey="pk_test_51SSSpX34nB0iTmwzgNwrvD2aR0rtC7b8Wm2GMwPtgVkN6A3fwUcqfZHccXt7780CfH5UGKRhvTHLTFzKOGJiZCZA000cLum5VS">
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
            </StripeProvider>
        </AuthProvider>
    );
}