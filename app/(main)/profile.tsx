import { AuthContext } from '@/Context/AuthContext';
import { supabase } from '@/utils/Supabase';
import { fetchWorkoutStats, WorkoutStats } from '@/utils/workouts';
import { useFocusEffect } from 'expo-router';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Theme, useTheme } from '@/Context/ThemeContext';

type ProfileData = {
  id: string;
  username: string | null;
  email?: string | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  weight_goal: number | null;
};

const chartWidth = Dimensions.get('window').width - 32;

const formatDate = (value: string) => {
  const date = new Date(value);
  return `${date.toLocaleDateString()} · ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export default function ProfileScreen() {
  const { user, updateProfile } = useContext(AuthContext);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [measurementsExpanded, setMeasurementsExpanded] = useState(true);
  const [formValues, setFormValues] = useState({
    weight: '',
    height: '',
    age: '',
    weight_goal: '',
  });
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: theme.colors.card,
      backgroundGradientTo: theme.colors.card,
      color: (opacity = 1) => `rgba(252, 48, 88, ${opacity})`,
      labelColor: () => theme.colors.text,
      decimalPlaces: 0,
      propsForDots: {
        r: '5',
        strokeWidth: '2',
        stroke: theme.colors.text,
      },
      propsForBackgroundLines: {
        stroke: theme.colors.border,
      },
    }),
    [theme],
  );

  const loadProfile = async () => {
    if (!user?.id) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, age, height, weight, weight_goal')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      if (data) {
        setProfile(data);
        setFormValues({
          weight: data.weight?.toString() ?? '',
          height: data.height?.toString() ?? '',
          age: data.age?.toString() ?? '',
          weight_goal: data.weight_goal?.toString() ?? '',
        });
      }
    } catch (err) {
      console.error('Error loading profile', err);
      Alert.alert('Error', 'No pudimos cargar tu perfil.');
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadStats = async () => {
    if (!user?.id) return;
    setLoadingStats(true);
    try {
      const workoutStats = await fetchWorkoutStats(user.id);
      setStats(workoutStats);
    } catch (err) {
      console.error('Error fetching workout stats', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadProfile();
    loadStats();
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [user?.id])
  );

  const handleSaveProfile = async () => {
    const payload = {
      weight: formValues.weight ? parseFloat(formValues.weight) : null,
      height: formValues.height ? parseFloat(formValues.height) : null,
      age: formValues.age ? parseInt(formValues.age, 10) : null,
      weight_goal: formValues.weight_goal ? parseFloat(formValues.weight_goal) : null,
    };

    const success = await updateProfile(payload);
    if (success) {
      setProfile((prev) => (prev ? { ...prev, ...payload } : prev));
      setSettingsVisible(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
    } else {
      Alert.alert('Error', 'No pudimos actualizar tu perfil.');
    }
  };

  const renderStatCard = (title: string, value: string, helper?: string) => (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      {helper ? <Text style={styles.statHelper}>{helper}</Text> : null}
    </View>
  );

  const renderWeeklyActivity = () => {
    if (!stats?.weeklyActivity?.length) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad semanal</Text>
          <View style={[styles.placeholderCard, styles.chartPlaceholder]}>
            <Text style={styles.placeholderEmoji}>📊</Text>
            <Text style={styles.placeholderTitle}>Aún no hay entrenos</Text>
            <Text style={styles.placeholderText}>
              Registra tus primeras sesiones para ver un gráfico con la actividad de los últimos 7 días.
            </Text>
          </View>
        </View>
      );
    }

    const weeklyValues = stats.weeklyActivity.map((day) => day.count);
    const hasData = weeklyValues.some((value) => value > 0);

    if (!hasData) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actividad semanal</Text>
          <View style={[styles.placeholderCard, styles.chartPlaceholder]}>
            <Text style={styles.placeholderEmoji}>🧘‍♂️</Text>
            <Text style={styles.placeholderTitle}>Todo listo para empezar</Text>
            <Text style={styles.placeholderText}>
              En cuanto completes tu primer entrenamiento llenaremos este espacio con tu actividad semanal.
            </Text>
          </View>
        </View>
      );
    }

    const chartData = {
      labels: stats.weeklyActivity.map((day) => day.label),
      datasets: [
        {
          data: weeklyValues,
          color: (opacity = 1) => `rgba(252, 48, 88, ${opacity})`,
        },
      ],
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actividad semanal</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            fromZero
            bezier
            style={styles.chart}
            segments={4}
          />
          <View style={styles.chartFooter}>
            <Text style={styles.chartFooterText}>Últimos 7 días</Text>
            <Text style={styles.chartHint}>Cuenta las sesiones registradas por día.</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderRecentSessions = () => {
    if (!stats?.lastSessions?.length) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sesiones recientes</Text>
        {stats.lastSessions.map((session) => (
          <View key={session.id} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>Entrenamiento</Text>
              <Text style={styles.sessionVolume}>{`${session.volume.toFixed(0)} kg`}</Text>
            </View>
            <Text style={styles.sessionDate}>{formatDate(session.started_at)}</Text>
            <Text style={styles.sessionSubtitle}>
              {session.finished_at ? 'Finalizado' : 'En progreso'} · {session.finished_at ? 'Completado' : 'Abierto'}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const renderMacroPlaceholder = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Macros diarios</Text>
      <View style={styles.placeholderCard}>
        <Text style={styles.placeholderTitle}>Disponible con Muscle+</Text>
        <Text style={styles.placeholderText}>
          Desbloquea el seguimiento de proteínas, carbohidratos y grasas registrando tus comidas con Muscle+.
        </Text>
        <TouchableOpacity style={styles.placeholderButton}>
          <Text style={styles.placeholderButtonText}>Conocer Muscle+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tu perfil</Text>
            <Text style={styles.subtitle}>Resumen de progreso y datos personales.</Text>
          </View>
          <TouchableOpacity style={styles.menuButton} onPress={() => setSettingsVisible(true)}>
            <Text style={styles.menuDots}>⋯</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileCard}>
          {loadingProfile ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <>
              <Text style={styles.profileName}>{profile?.username ?? 'Sin nombre'}</Text>
              <Text style={styles.profileEmail}>{profile?.email ?? user?.email ?? ''}</Text>
              <View style={styles.profileGrid}>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Peso</Text>
                  <Text style={styles.profileValue}>{profile?.weight ? `${profile.weight} kg` : '—'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Altura</Text>
                  <Text style={styles.profileValue}>{profile?.height ? `${profile.height} cm` : '—'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Edad</Text>
                  <Text style={styles.profileValue}>{profile?.age ?? '—'}</Text>
                </View>
                <View style={styles.profileItem}>
                  <Text style={styles.profileLabel}>Objetivo</Text>
                  <Text style={styles.profileValue}>{profile?.weight_goal ? `${profile.weight_goal} kg` : '—'}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tu progreso</Text>
          {loadingStats ? (
            <ActivityIndicator color={ACCENT} />
          ) : (
            <View style={styles.statsRow}>
              {renderStatCard('Workouts esta semana', `${stats?.sessionsThisWeek ?? 0}`, 'Últimos 7 días')}
              {renderStatCard('Volumen total', `${(stats?.totalVolume ?? 0).toFixed(0)} kg`, 'Suma de peso x reps')}
              {renderStatCard(
                'Ejercicio destacado',
                stats?.topExercise ? stats.topExercise.exerciseId : 'Sin datos',
                stats?.topExercise ? `${stats.topExercise.volume.toFixed(0)} kg en ${stats.topExercise.sets} sets` : 'Registra tus entrenos'
              )}
            </View>
          )}
        </View>

        {renderWeeklyActivity()}
        {renderRecentSessions()}
        {renderMacroPlaceholder()}
      </ScrollView>

      <Modal visible={settingsVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajustes y datos</Text>

            <TouchableOpacity
              style={styles.placeholderRow}
              onPress={() => setMeasurementsExpanded((prev) => !prev)}
            >
              <Text style={styles.placeholderRowText}>Medidas</Text>
              <Text style={styles.placeholderTag}>{measurementsExpanded ? 'Ocultar' : 'Editar'}</Text>
            </TouchableOpacity>

            {measurementsExpanded ? (
              <View style={styles.measurementsCard}>
                <Text style={styles.modalLabel}>Peso (kg)</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="numeric"
                  placeholder="Ej. 72"
                  placeholderTextColor={theme.colors.textSecondary}
                  value={formValues.weight}
                  onChangeText={(text) => setFormValues((prev) => ({ ...prev, weight: text }))}
                />

                <Text style={styles.modalLabel}>Altura (cm)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ej. 175"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formValues.height}
                    onChangeText={(text) => setFormValues((prev) => ({ ...prev, height: text }))}
                  />

                <Text style={styles.modalLabel}>Edad</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ej. 28"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formValues.age}
                    onChangeText={(text) => setFormValues((prev) => ({ ...prev, age: text }))}
                  />

                <Text style={styles.modalLabel}>Objetivo de peso (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ej. 80"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formValues.weight_goal}
                    onChangeText={(text) => setFormValues((prev) => ({ ...prev, weight_goal: text }))}
                  />

                  <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
                    <Text style={styles.saveButtonText}>Guardar cambios</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

            <View style={styles.modalDivider} />
            <Text style={styles.modalSubtitle}>Preferencias</Text>

            {["Tema", "Idioma", "Sincronización", "Ayuda", "Privacidad"].map((item) => (
              <TouchableOpacity key={item} style={styles.placeholderRow}>
                <Text style={styles.placeholderRowText}>{item}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeButton} onPress={() => setSettingsVisible(false)}>
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const createStyles = (theme: Theme) => {
  const { colors } = theme;
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 50,
      paddingBottom: 40,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    title: {
      color: colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    subtitle: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    menuButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    menuDots: {
      color: colors.text,
      fontSize: 22,
      marginTop: -4,
    },
    profileCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 14,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileName: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
    },
    profileEmail: {
      color: colors.textSecondary,
      marginBottom: 16,
      marginTop: 4,
    },
    profileGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    profileItem: {
      width: '48%',
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileLabel: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    profileValue: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginTop: 4,
    },
    section: {
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 10,
    },
    statsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    statCard: {
      flexBasis: '48%',
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    statTitle: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    statValue: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginTop: 4,
    },
    statHelper: {
      color: colors.textSecondary,
      marginTop: 6,
    },
    chartCard: {
      backgroundColor: colors.card,
      borderRadius: 14,
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chart: {
      borderRadius: 12,
    },
    chartFooter: {
      paddingHorizontal: 12,
      paddingBottom: 10,
    },
    chartFooterText: {
      color: colors.text,
      fontWeight: '700',
    },
    chartHint: {
      color: colors.textSecondary,
      marginTop: 4,
    },
    sessionCard: {
      backgroundColor: colors.card,
      padding: 14,
      borderRadius: 14,
      marginBottom: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sessionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sessionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    sessionVolume: {
      color: colors.accent,
      fontWeight: '700',
    },
    sessionDate: {
      color: colors.textSecondary,
      marginTop: 6,
    },
    sessionSubtitle: {
      color: colors.textSecondary,
      marginTop: 2,
    },
    placeholderCard: {
      backgroundColor: colors.card,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      rowGap: 8,
    },
    placeholderEmoji: {
      fontSize: 28,
    },
    placeholderTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    placeholderText: {
      color: colors.textSecondary,
      marginTop: 6,
      marginBottom: 12,
    },
    placeholderButton: {
      alignSelf: 'flex-start',
      backgroundColor: colors.card,
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    placeholderButtonText: {
      color: colors.accent,
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'flex-end',
    },
    modalContent: {
      backgroundColor: colors.card,
      padding: 20,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 12,
    },
    modalLabel: {
      color: colors.textSecondary,
      marginTop: 10,
      marginBottom: 4,
    },
    measurementsCard: {
      backgroundColor: colors.card,
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    input: {
      backgroundColor: colors.input,
      color: colors.text,
      borderRadius: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    saveButton: {
      marginTop: 16,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    saveButtonText: {
      color: '#fff',
      fontWeight: '700',
    },
    modalDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: 16,
    },
    modalSubtitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 8,
    },
    placeholderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 10,
    },
    placeholderRowText: {
      color: colors.text,
    },
    placeholderTag: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    closeButton: {
      marginTop: 12,
      alignItems: 'center',
      paddingVertical: 12,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    closeButtonText: {
      color: colors.text,
      fontWeight: '700',
    },
  });
};
