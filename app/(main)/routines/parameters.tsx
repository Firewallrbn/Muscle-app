import { AuthContext } from '@/Context/AuthContext';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { Theme, useTheme } from '@/Context/ThemeContext';
import { addExerciseToRoutine, createRoutine } from '@/utils/routines';
import { router } from 'expo-router';
import { useContext, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RoutineParametersScreen() {
  const { user } = useContext(AuthContext);
  const { name, description, exercises, trainingType, updateExercise, removeExercise, reset } = useRoutineBuilder();
  const [saving, setSaving] = useState(false);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  const handleSave = async () => {
    if (!user?.id) {
      Alert.alert('Sesión expirada', 'Inicia sesión nuevamente.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Completa tu rutina', 'Agrega un nombre en el paso anterior.');
      router.back();
      return;
    }
    if (!exercises.length) {
      Alert.alert('Sin ejercicios', 'Agrega ejercicios antes de guardar.');
      return;
    }

    setSaving(true);
    try {
      const routineId = await createRoutine(user.id, name, description, trainingType);
      for (const item of exercises) {
        await addExerciseToRoutine({
          routine_id: routineId,
          exercise_id: item.exercise.id,
          position: item.position,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          rest_seconds: item.rest_seconds,
          notes: item.notes,
        });
      }
      Alert.alert('Rutina guardada', 'Tu rutina fue creada con éxito.');
      reset();
      router.replace(`/(main)/routines/${routineId}`);
    } catch (err) {
      console.error('Routine creation error', err);
      Alert.alert('Error', 'No pudimos guardar tu rutina. Intenta nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const renderExercise = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.exercise.name}</Text>
        <TouchableOpacity onPress={() => removeExercise(item.exercise.id)}>
          <Text style={styles.removeText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.cardSubtitle}>{`#${item.position} • ${item.exercise.bodyPart}`}</Text>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Sets</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor={theme.colors.textSecondary}
            value={item.sets ? String(item.sets) : ''}
            onChangeText={(text) => updateExercise(item.exercise.id, { sets: text ? Number(text) : undefined })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Reps</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="12"
            placeholderTextColor={theme.colors.textSecondary}
            value={item.reps ? String(item.reps) : ''}
            onChangeText={(text) => updateExercise(item.exercise.id, { reps: text ? Number(text) : undefined })}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Peso (kg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="40"
            placeholderTextColor={theme.colors.textSecondary}
            value={item.weight ? String(item.weight) : ''}
            onChangeText={(text) => updateExercise(item.exercise.id, { weight: text ? Number(text) : undefined })}
          />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Descanso (seg)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="90"
            placeholderTextColor={theme.colors.textSecondary}
            value={item.rest_seconds ? String(item.rest_seconds) : ''}
            onChangeText={(text) => updateExercise(item.exercise.id, { rest_seconds: text ? Number(text) : undefined })}
          />
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.notes]}
          placeholder="Mantén la técnica controlada"
          placeholderTextColor={theme.colors.textSecondary}
          multiline
          value={item.notes ?? ''}
          onChangeText={(text) => updateExercise(item.exercise.id, { notes: text })}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Parámetros</Text>
        <Text style={styles.subtitle}>Define sets, repeticiones y descansos.</Text>
      </View>

      <FlatList
        data={exercises}
        keyExtractor={(item) => item.exercise.id}
        renderItem={renderExercise}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No has agregado ejercicios.</Text>
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 140 }}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()} disabled={saving}>
          <Text style={styles.outlineText}>Atrás</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.primaryButton, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={theme.colors.text} /> : <Text style={styles.primaryText}>Finalizar rutina</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
      paddingTop: 50,
    },
    header: {
      marginBottom: 16,
    },
    title: {
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    cardSubtitle: {
      color: theme.colors.textSecondary,
      marginBottom: 12,
    },
    removeText: {
      color: theme.colors.accent,
    },
    row: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 10,
    },
    inputGroup: {
      flex: 1,
    },
    label: {
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    input: {
      backgroundColor: theme.colors.input,
      color: theme.colors.text,
      borderRadius: 12,
      padding: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    notes: {
      height: 70,
      textAlignVertical: 'top',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      color: theme.colors.textSecondary,
    },
    link: {
      color: theme.colors.accent,
      marginTop: 8,
    },
    footer: {
      position: 'absolute',
      bottom: 20,
      left: 16,
      right: 16,
      flexDirection: 'row',
      gap: 12,
    },
    outlineButton: {
      flex: 1,
      backgroundColor: theme.colors.card,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    outlineText: {
      color: theme.colors.text,
    },
    primaryButton: {
      flex: 1,
      backgroundColor: theme.colors.accent,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
    },
    primaryText: {
      color: '#fff',
      fontWeight: '700',
    },
  });
