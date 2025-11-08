import { Stack } from 'expo-router';
import { AuthProvider } from '../Context/AuthContext';

export default function RootLayout() {
    return (
        <AuthProvider>
            <Stack
                initialRouteName='index'
                screenOptions={{ headerShown: false }}
            >
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(main)" />
            </Stack>
        </AuthProvider>
    );
}