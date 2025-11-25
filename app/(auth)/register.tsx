import { AuthContext } from "@/Context/AuthContext";
import { Theme, useTheme } from "@/Context/ThemeContext";
import { useRouter } from "expo-router";
import { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const context = useContext(AuthContext);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleRegister = async () => {
    const cleanEmail = email.trim();
    const cleanUsername = cleanEmail.split('@')[0].trim();

    if (!cleanEmail || !password || !repeatPassword) {
      Alert.alert("Error", "Completa todos los campos.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Error", "La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== repeatPassword) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    
    setLoading(true);
    const result = await context.register(cleanEmail, password, cleanUsername);
    setLoading(false);
    
    if (result.success) {
      Alert.alert("¡Registro exitoso!", "Ahora puedes iniciar sesión.", [
        { text: "OK", onPress: () => router.push("/(auth)/login") }
      ]);
    } else {
      Alert.alert("Error", result.error || "No se pudo registrar.");
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
          <Text style={styles.subtitle}>Crea tu cuenta</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registro</Text>
          
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
              value={password} 
              onChangeText={setPassword} 
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry 
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña</Text>
            <TextInput 
              style={styles.input} 
              value={repeatPassword} 
              onChangeText={setRepeatPassword} 
              placeholder="Repite tu contraseña"
              placeholderTextColor={theme.colors.textSecondary}
              secureTextEntry 
            />
          </View>

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleRegister} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta?</Text>
          <TouchableOpacity onPress={() => router.push("/(auth)/login")}>
            <Text style={styles.footerLink}>Inicia sesión</Text>
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
      marginBottom: 32,
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
    primaryButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: 16,
      borderRadius: 14,
      alignItems: 'center',
      marginTop: 8,
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