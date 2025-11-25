import { AuthContext } from "@/Context/AuthContext";
import { Theme, useTheme } from "@/Context/ThemeContext";
import TopBar from '@/components/TopBar';
import { createClient } from '@supabase/supabase-js';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
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
} from 'react-native';

type Message = {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
};

type UserProfile = {
  username?: string | null;
  weight?: number | null;
  age?: number | null;
  height?: number | null;
  weight_goal?: number | null;
  ROL: 'USER' | 'PREMIUM';
};

export default function MaxScreen() {
  const { user, updateProfile } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [messageCount, setMessageCount] = useState<number>(0);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  const scrollRef = useRef<ScrollView | null>(null);

  const FREE_MESSAGE_LIMIT = 5; // Límite para usuarios FREE


  const supabaseUrl = "https://dzwkyykjnrcllgsqnrlg.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d2t5eWtqbnJjbGxnc3FucmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjE1NzUsImV4cCI6MjA3NzY5NzU3NX0.IgNzNMA5e8WCkVyo_89l1Nagfcl2zRf8y3QrMBxFJrU";
  const supabase = createClient(supabaseUrl, supabaseKey);

  useEffect(() => {
    loadUserProfile();

  }, []);

  useEffect(() => {

    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, [messages, loading]);

  const loadUserProfile = async () => {
    setLoadingProfile(true);
    try {
      // intenta obtener user id desde AuthContext.user (ajusta según estructura real)
      let uid = (user as any)?.id ?? (user as any)?.userId ?? (user as any)?.uid ?? null;

      // si no hay uid en contexto, intenta obtener del auth de Supabase
      if (!uid) {
        const { data: authData } = await supabase.auth.getUser();
        uid = authData?.user?.id ?? null;
      }

      if (!uid) {
        const mockProfile: UserProfile = {
          username: 'invitado',
          weight: 70,
          age: 25,
          height: null,
          weight_goal: 170,
          ROL: 'USER'
        };
        setUserProfile(mockProfile);
        setMessages([{
          role: 'assistant',
          content: `¡Hola ${mockProfile.username}! Soy M.A.X, tu asistente de entrenamiento personal 💪\n\nVeo que tienes ${mockProfile.age ?? 'no especificado'} años, pesas ${mockProfile.weight ?? 'no especificado'} kg y tu objetivo es: ${mockProfile.weight_goal ?? 'no especificado'}.\n\n¿En qué puedo ayudarte hoy?`,
          timestamp: new Date()
        }]);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('username, age, height, weight, weight_goal, ROL')
        .eq('id', uid)
        .single();

      if (error || !data) {
        throw error ?? new Error('Perfil no encontrado');
      }

      const profileFromDb: UserProfile = {
        username: data.username ?? null,
        age: data.age ?? null,
        height: data.height ?? null,
        weight: data.weight ?? null,
        weight_goal: data.weight_goal ?? null,
        ROL: (data.ROL === 'PREMIUM' ? 'PREMIUM' : 'USER')
      };

      setUserProfile(profileFromDb);

      // Mensaje inicial
      setMessages([{
        role: 'assistant',
        content: `¡Hola ${profileFromDb.username ?? 'amigo/a'}! Soy M.A.X, tu asistente de entrenamiento personal 💪\n\nVeo que tienes ${profileFromDb.age ?? 'no especificado'} años, pesas ${profileFromDb.weight ?? 'no especificado'} kg y tu objetivo es: ${profileFromDb.weight_goal ?? 'no especificado'}.\n\n¿En qué puedo ayudarte hoy?`,
        timestamp: new Date()
      }]);

      // opcional: sincronizar contexto si es necesario
      if (!(user && (user as any).id)) {
        try { await updateProfile(profileFromDb); } catch {}
      }
    } catch (error) {
      console.error('Error loading profile from Supabase:', error);
      Alert.alert('Error', 'No se pudo cargar tu perfil desde la base de datos');
    } finally {
      setLoadingProfile(false);
    }
  };

  const canSendMessage = (): boolean => {
    if (!userProfile) return false;
    if (userProfile.ROL === 'PREMIUM') return true;
    return messageCount < FREE_MESSAGE_LIMIT;
  };

  const getRemainingMessages = (): number => {
    if (!userProfile) return 0;
    if (userProfile.ROL === 'PREMIUM') return -1; // Ilimitado
    return Math.max(0, FREE_MESSAGE_LIMIT - messageCount);
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    if (!canSendMessage()) {
      Alert.alert(
        'Límite alcanzado',
        'Has alcanzado el límite de mensajes gratuitos. Actualiza a PREMIUM para mensajes ilimitados.',
        [{ text: 'OK' }]
      );
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText("");
    setLoading(true);

    try {
      const response = await getGeminiResponse(userMessage.content);

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setMessageCount(prev => prev + 1);
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: `Lo siento, hubo un error al procesar tu mensaje: ${error.message}. Por favor, intenta de nuevo.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const getGeminiResponse = async (userInput: string): Promise<string> => {
    if (!userProfile) throw new Error('Perfil no cargado');

    // Construye contexto con sólo los datos disponibles
    const usernameText = userProfile.username ?? 'no especificado';
    const ageText = userProfile.age ? `${userProfile.age} años` : 'no especificado';
    const weightText = userProfile.weight ? `${userProfile.weight} kg` : 'no especificado';
    const heightText = userProfile.height ? `${userProfile.height} cm` : 'no especificado';
    const goalText = userProfile.weight_goal ? `${userProfile.weight_goal} kg` : 'no especificado';
    const roleText = userProfile.ROL ?? 'USER';

    const systemContext = `Eres M.A.X, un asistente personal de entrenamiento experto, motivador y amigable.

Información del usuario:
- Username: ${usernameText}
- Edad: ${ageText}
- Altura: ${heightText}
- Peso: ${weightText}
- Objetivo de peso: ${goalText}
- Tipo de usuario: ${roleText}

INSTRUCCIONES:
- Proporciona consejos personalizados basados en el perfil del usuario (usa sólo los datos disponibles).
- Si faltan datos relevantes (altura, edad, etc.), indica qué información falta y sugiere preguntas para obtenerla.
- Si te preguntan sobre rutinas, incluye ejercicios específicos con series, repeticiones y descansos adecuados.
- Sé claro, conciso pero completo.
- No uses muchos emojis, solo unos pocos para enfatizar.
- No respondas en formato markdown, sólo texto plano.
- Si es necesario, divide las respuestas en secciones con títulos claros.
- Siempre motiva al usuario de forma positiva.

Responde de forma profesional pero cercana.`;

    // Historial de conversación (últimos 6 mensajes para contexto)
    const conversationHistory = messages.slice(-6).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [{ text: systemContext }]
        },
        ...conversationHistory,
        {
          role: 'user',
          parts: [{ text: userInput }]
        }
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096, 
      }
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.EXPO_PUBLIC_GEMINI_API_KEY}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000); // 60s

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        console.error('API Error:', errorText);
        throw new Error(`Error API: ${response.status}`);
      }

      const data = await response.json();
      console.log('Gemini Response:', JSON.stringify(data, null, 2));

      if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('Respuesta inválida de la API');
      }
    } catch (err: any) {
      clearTimeout(timeout);
      if (err.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado');
      }
      throw err;
    }
  };

  const clearConversation = () => {
    Alert.alert(
      'Limpiar conversación',
      '¿Estás seguro de que quieres borrar toda la conversación?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setMessages([{
              role: 'assistant',
              content: '¡Conversación limpiada! ¿En qué puedo ayudarte ahora? 💪',
              timestamp: new Date()
            }]);
            setMessageCount(0);
          }
        }
      ]
    );
  };

  if (loadingProfile) {
    return (
      <View style={styles.container}>
        <TopBar title="M.A.X 💪" subtitle="Tu asistente de entrenamiento" />
        <View style={[styles.centerContent, { flex: 1 }]}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
          <Text style={styles.loadingText}>Cargando tu perfil...</Text>
        </View>
      </View>
    );
  }

  const remainingMessages = getRemainingMessages();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <TopBar
        title="M.A.X 💪"
        subtitle="Tu asistente de entrenamiento"
        rightAction={{
          icon: 'trash-outline',
          onPress: clearConversation,
        }}
      />

      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        ref={scrollRef}
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.assistantBubble
            ]}
          >
            <Text style={[
              styles.messageText,
              msg.role === 'user' ? styles.userText : styles.assistantText
            ]}>
              {msg.content}
            </Text>
            <Text style={[
              styles.timestamp,
              msg.role === 'user' && styles.timestampUser
            ]}>
              {msg.timestamp.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Text>
          </View>
        ))}


        {loading && (
          <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingBubble]}>
            <ActivityIndicator size="small" color={theme.colors.accent} />
            <Text style={styles.loadingMessage}>M.A.X está pensando...</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={canSendMessage() ? "Escribe tu pregunta..." : "Límite alcanzado"}
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={2000}
          editable={!loading && canSendMessage()}
          onSubmitEditing={() => { /* evitar submit automático en multiline */ }}
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || loading || !canSendMessage()) && styles.sendBtnDisabled
          ]}
          onPress={sendMessage}
          disabled={!inputText.trim() || loading || !canSendMessage()}
        >
          <Text style={styles.sendBtnText}>
            {loading ? '⏳' : '➤'}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (theme: Theme) => {
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    limitBanner: {
      display: 'none'
    },
    limitBannerDanger: {
      display: 'none'
    },
    limitText: {
      fontSize: 13,
      color: '#856404',
      fontWeight: '600',
    },
    loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: colors.textSecondary,
    },
    messagesContainer: {
      flex: 1,
    },
    messagesContent: {
      padding: 15,
      paddingBottom: 20,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
      marginBottom: 12,
    },
    userBubble: {
      alignSelf: 'flex-end',
      backgroundColor: colors.accent,
      borderBottomRightRadius: 4,
    },
    assistantBubble: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: theme.mode === 'light' ? '#000' : 'transparent',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: theme.mode === 'light' ? 0.06 : 0,
      shadowRadius: 2,
      elevation: theme.mode === 'light' ? 2 : 0,
    },
    loadingBubble: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 15,
    },
    messageText: {
      fontSize: 15,
      lineHeight: 22,
    },
    userText: {
      color: '#fff',
    },
    assistantText: {
      color: colors.text,
    },
    timestamp: {
      fontSize: 10,
      color: colors.textSecondary,
      marginTop: 4,
      alignSelf: 'flex-end',
    },
    timestampUser: {
      color: '#ffecec',
    },
    loadingMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      marginLeft: 8,
      fontStyle: 'italic',
    },
    inputContainer: {
      flexDirection: 'row',
      padding: 12,
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      alignItems: 'flex-end',
    },
    input: {
      flex: 1,
      backgroundColor: colors.input,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 15,
      maxHeight: 140,
      marginRight: 8,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendBtn: {
      backgroundColor: colors.accent,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendBtnDisabled: {
      backgroundColor: colors.border,
    },
    sendBtnText: {
      fontSize: 20,
      color: '#fff',
      fontWeight: 'bold',
    },
  });
};