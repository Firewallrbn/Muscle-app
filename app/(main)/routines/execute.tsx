import { AuthContext } from '@/Context/AuthContext';
import { useTheme } from '@/Context/ThemeContext';
import { supabase } from '@/utils/Supabase';
import { denormalizeExerciseId, fetchExerciseById } from '@/utils/exerciseApi';
import { router, useLocalSearchParams } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface ExerciseSet {
  exercise_id: string;
  exercise_name: string;
  body_part: string;
  sets: number;
  reps: number;
  weight: number;
  rest_seconds: number;
  notes: string;
  position: number;
}

interface ExecutionState {
  exerciseIndex: number;
  currentSet: number;
  isResting: boolean;
  restTimeLeft: number;
}

export default function ExecuteRoutineScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [exercises, setExercises] = useState<ExerciseSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [execution, setExecution] = useState<ExecutionState>({
    exerciseIndex: 0,
    currentSet: 1,
    isResting: false,
    restTimeLeft: 0,
  });

  useEffect(() => {
    loadRoutineExercises();
  }, []);

  const loadRoutineExercises = async () => {
    try {
      // Obtener los ejercicios de la rutina desde Supabase
      const { data, error } = await supabase
        .from('routine_exercises')
        .select(
          `
          id,
          exercise_id,
          sets,
          reps,
          weight,
          rest_seconds,
          notes,
          position
        `
        )
        .eq('routine_id', id)
        .order('position', { ascending: true });

      if (error) throw error;

      if (!data || data.length === 0) {
        setExercises([]);
        setLoading(false);
        return;
      }

      // Obtener detalles de cada ejercicio desde la API
      const exercisesWithDetails: ExerciseSet[] = [];

      for (const item of data) {
        try {
          console.log('Buscando ejercicio con ID:', item.exercise_id);
          
          // Denormalizar el ID si es UUID
          const exerciseId = item.exercise_id.includes('-') 
            ? denormalizeExerciseId(item.exercise_id) 
            : item.exercise_id;
          
          console.log('ID desnormalizado:', exerciseId);
          
          const apiExercise = await fetchExerciseById(exerciseId);
          
          console.log('Ejercicio obtenido:', apiExercise);
          
          exercisesWithDetails.push({
            exercise_id: item.exercise_id,
            exercise_name: apiExercise.name,
            body_part: apiExercise.bodyPart,
            sets: item.sets,
            reps: item.reps,
            weight: item.weight,
            rest_seconds: item.rest_seconds,
            notes: item.notes,
            position: item.position,
          });
        } catch (err) {
          console.error(`Error fetching exercise ${item.exercise_id}:`, err);
          // Fallback si la API falla
          exercisesWithDetails.push({
            exercise_id: item.exercise_id,
            exercise_name: 'Ejercicio desconocido',
            body_part: 'Sin categoría',
            sets: item.sets,
            reps: item.reps,
            weight: item.weight,
            rest_seconds: item.rest_seconds,
            notes: item.notes,
            position: item.position,
          });
        }
      }

      setExercises(exercisesWithDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error loading routine:', err);
      Alert.alert('Error', 'No pudimos cargar la rutina.');
      router.back();
    }
  };

  useEffect(() => {
    if (!execution.isResting || execution.restTimeLeft <= 0) return;

    const interval = setInterval(() => {
      setExecution((prev) => ({
        ...prev,
        restTimeLeft: prev.restTimeLeft - 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [execution.isResting, execution.restTimeLeft]);

  const handleSetComplete = () => {
    const currentExercise = exercises[execution.exerciseIndex];

    // Si no es el último set del ejercicio
    if (execution.currentSet < currentExercise.sets) {
      setExecution((prev) => ({
        ...prev,
        isResting: true,
        restTimeLeft: currentExercise.rest_seconds,
        currentSet: prev.currentSet + 1,
      }));
    } else {
      // Último set del ejercicio
      if (execution.exerciseIndex < exercises.length - 1) {
        // Hay más ejercicios
        setExecution((prev) => ({
          ...prev,
          isResting: true,
          restTimeLeft: currentExercise.rest_seconds,
          exerciseIndex: prev.exerciseIndex + 1,
          currentSet: 1,
        }));
      } else {
        // Fin de la rutina
        Alert.alert('¡Felicidades!', 'Completaste la rutina.', [
          { text: 'Volver', onPress: () => router.back() },
        ]);
      }
    }
  };

  const skipRest = () => {
    setExecution((prev) => ({
      ...prev,
      isResting: false,
      restTimeLeft: 0,
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>No hay ejercicios en esta rutina.</Text>
      </SafeAreaView>
    );
  }

  const currentExercise = exercises[execution.exerciseIndex];
  const progress = Math.round(
    ((execution.exerciseIndex + (execution.currentSet - 1) / currentExercise.sets) /
      exercises.reduce((sum, ex) => sum + ex.sets, 0)) *
      100
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con progreso */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Atrás</Text>
        </TouchableOpacity>
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>

      {execution.isResting ? (
        // Pantalla de descanso con cronómetro
        <View style={styles.restContainer}>
          <Text style={styles.restTitle}>Descansa</Text>
          <Text style={styles.nextExerciseText}>
            Próximo: {exercises[execution.exerciseIndex].exercise_name}
          </Text>

          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(execution.restTimeLeft)}</Text>
          </View>

          <View style={styles.restButtonContainer}>
            <TouchableOpacity
              style={styles.skipButton}
              onPress={skipRest}
            >
              <Text style={styles.skipButtonText}>Saltar descanso</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        // Pantalla de ejercicio
        <View style={styles.exerciseContainer}>
          {/* Tarjeta del ejercicio */}
          <View style={styles.exerciseCard}>
            <Text style={styles.exerciseName}>{currentExercise.exercise_name}</Text>
            <Text style={styles.bodyPart}>{currentExercise.body_part}</Text>

            <View style={styles.seriesInfo}>
              <View style={styles.seriesBox}>
                <Text style={styles.seriesLabel}>Serie</Text>
                <Text style={styles.seriesValue}>
                  {execution.currentSet} / {currentExercise.sets}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.seriesBox}>
                <Text style={styles.seriesLabel}>Reps</Text>
                <Text style={styles.seriesValue}>{currentExercise.reps}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.seriesBox}>
                <Text style={styles.seriesLabel}>Peso</Text>
                <Text style={styles.seriesValue}>{currentExercise.weight} kg</Text>
              </View>
            </View>

            {currentExercise.notes && (
              <View style={styles.notesContainer}>
                <Text style={styles.notesLabel}>Notas</Text>
                <Text style={styles.notesText}>{currentExercise.notes}</Text>
              </View>
            )}
          </View>

          {/* Botones de acción */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.skipExerciseButton}
              onPress={() => {
                setExecution((prev) => ({
                  ...prev,
                  exerciseIndex: prev.exerciseIndex + 1,
                  currentSet: 1,
                }));
              }}
              disabled={execution.exerciseIndex >= exercises.length - 1}
            >
              <Text style={styles.skipExerciseButtonText}>Saltar ejercicio</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.completeButton}
              onPress={handleSetComplete}
            >
              <Text style={styles.completeButtonText}>✓ Completar serie</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      gap: 12,
    },
    backButton: {
      color: theme.colors.accent,
      fontSize: 16,
      fontWeight: '600',
    },
    progressContainer: {
      flex: 1,
      height: 8,
      backgroundColor: theme.colors.input,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: theme.colors.accent,
    },
    progressText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
      minWidth: 40,
      textAlign: 'right',
    },

    /* Pantalla de ejercicio */
    exerciseContainer: {
      flex: 1,
      justifyContent: 'space-between',
    },
    exerciseCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
    },
    exerciseName: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '700',
      marginBottom: 6,
    },
    bodyPart: {
      color: theme.colors.textSecondary,
      fontSize: 14,
      marginBottom: 20,
    },
    seriesInfo: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: theme.colors.input,
      borderRadius: 12,
      paddingVertical: 16,
      marginBottom: 16,
    },
    seriesBox: {
      flex: 1,
      alignItems: 'center',
    },
    seriesLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    seriesValue: {
      color: theme.colors.accent,
      fontSize: 20,
      fontWeight: '700',
    },
    divider: {
      width: 1,
      height: 40,
      backgroundColor: theme.colors.border,
    },
    notesContainer: {
      backgroundColor: theme.colors.input,
      borderRadius: 12,
      padding: 12,
    },
    notesLabel: {
      color: theme.colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 6,
    },
    notesText: {
      color: theme.colors.text,
      fontSize: 14,
      lineHeight: 20,
    },

    actionButtonsContainer: {
      gap: 12,
      marginBottom: 20,
    },
    skipExerciseButton: {
      backgroundColor: theme.colors.input,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    skipExerciseButtonText: {
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },
    completeButton: {
      backgroundColor: theme.colors.accent,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    completeButtonText: {
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    },

    /* Pantalla de descanso */
    restContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    restTitle: {
      color: theme.colors.text,
      fontSize: 28,
      fontWeight: '700',
      marginBottom: 12,
    },
    nextExerciseText: {
      color: theme.colors.textSecondary,
      fontSize: 16,
      marginBottom: 40,
    },
    timerContainer: {
      backgroundColor: theme.colors.card,
      width: 200,
      height: 200,
      borderRadius: 100,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 40,
      borderWidth: 3,
      borderColor: theme.colors.accent,
    },
    timerText: {
      color: theme.colors.accent,
      fontSize: 48,
      fontWeight: '700',
    },
    restButtonContainer: {
      width: '100%',
    },
    skipButton: {
      backgroundColor: theme.colors.input,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
    },
    skipButtonText: {
      color: theme.colors.textSecondary,
      fontWeight: '700',
    },

    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 20,
    },
  });