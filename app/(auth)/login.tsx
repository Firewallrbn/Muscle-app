import { AuthContext } from "@/Context/AuthContext";
import { Theme, useTheme } from "@/Context/ThemeContext";
import { useRouter } from "expo-router";
import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AuthContext);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleLogin = async () => {
    const cleanEmail = email.trim();
    const cleanPassword = password.trim();
    
    if (!cleanEmail || !cleanPassword) {
      alert("Por favor completa todos los campos.");
      return;
    }
    
    setLoading(true);
    const success = await context.login(cleanEmail, cleanPassword);
    setLoading(false);
    
    if (success) {
      router.replace("/(main)/exercises");
    } else {
      alert("Error al iniciar sesión. Revisa tus credenciales.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>MUSCLE</Text>
          <Text style={styles.subtitle}>Tu compañero de entrenamiento</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Iniciar sesión</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput 
              style={styles.input} 
              value={email} 
              onChangeText={setEmail} 
              placeholder="tu@email.com"
              placeholderTextColor={theme.colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity onPress={() => router.push("/(auth)/resetpassword")}>
            <Text style={styles.forgotPassword}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/register")}>
            <Text style={styles.footerLink}>Regístrate aquí</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 24,
      paddingVertical: 40,
    },
    header: {
      alignItems: 'center',
      marginBottom: 40,
    },
    title: {
      fontSize: 42,
      fontWeight: '800',
      color: theme.mode === 'dark' ? '#FFFFFF' : '#111111',
      letterSpacing: 3,
    },
    subtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      marginTop: 8,
    },
    formCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    formTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 24,
    },
    inputGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      marginBottom: 8,
    },
    input: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    forgotPassword: {
      color: theme.colors.accent,
      fontSize: 14,
      fontWeight: '600',
      textAlign: 'right',
      marginBottom: 20,
      marginTop: 4,
    },
    primaryButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    primaryButtonText: {
      color: '#fff',
      fontSize: 17,
      fontWeight: '700',
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 32,
      gap: 6,
    },
    footerText: {
      color: theme.colors.textSecondary,
      fontSize: 15,
    },
    footerLink: {
      color: theme.colors.accent,
      fontSize: 15,
      fontWeight: '700',
    },
  });