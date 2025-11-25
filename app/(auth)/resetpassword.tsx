import { Theme, useTheme } from "@/Context/ThemeContext";
import { supabase } from "@/utils/Supabase";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
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

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleResetPassword = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      Alert.alert("Error", "Ingresa tu correo electrónico.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: 'muscle://reset-password',
      });

      if (error) {
        Alert.alert("Error", error.message);
      } else {
        setSent(true);
      }
    } catch (err) {
      Alert.alert("Error", "No se pudo enviar el correo de recuperación.");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <View style={styles.container}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>MUSCLE</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.successIcon}>
              <Text style={styles.successEmoji}>✉️</Text>
            </View>
            <Text style={styles.successTitle}>¡Correo enviado!</Text>
            <Text style={styles.successText}>
              Hemos enviado un enlace de recuperación a{'\n'}
              <Text style={styles.emailHighlight}>{email}</Text>
            </Text>
            <Text style={styles.successHint}>
              Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
            </Text>

            <TouchableOpacity 
              style={styles.primaryButton} 
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.primaryButtonText}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

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
          <Text style={styles.subtitle}>Recupera tu cuenta</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Restablecer contraseña</Text>
          <Text style={styles.formDescription}>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </Text>
          
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

          <TouchableOpacity 
            style={[styles.primaryButton, loading && styles.buttonDisabled]} 
            onPress={handleResetPassword} 
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Enviar enlace</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Recordaste tu contraseña?</Text>
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
      marginBottom: 12,
    },
    formDescription: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginBottom: 24,
      lineHeight: 20,
    },
    inputGroup: {
      marginBottom: 20,
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
    // Success state styles
    successIcon: {
      alignItems: 'center',
      marginBottom: 16,
    },
    successEmoji: {
      fontSize: 48,
    },
    successTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 12,
    },
    successText: {
      fontSize: 15,
      color: theme.colors.textSecondary,
      marginBottom: 8,
      lineHeight: 22,
    },
    emailHighlight: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    successHint: {
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginBottom: 24,
      lineHeight: 18,
    },
  });
