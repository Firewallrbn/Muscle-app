import { Stack } from 'expo-router';

export default function AuthLayout() {
    return (
        <Stack
            // initialRouteName='login' //welcome o una pagina 
            screenOptions={{ headerShown: false }}
        >
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="resetpassword" />

        </Stack>
    );
}