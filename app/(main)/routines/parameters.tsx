import React, { useContext, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { createRoutine, addExerciseToRoutine } from '@/utils/routines';
import { AuthContext } from '@/Context/AuthContext';
import { registerTrainingEntry } from '@/utils/trainingTracker';

export default function RoutineParametersScreen() {
  const { user } = useContext(AuthContext);
  const { name, description, exercises, trainingType, updateExercise, removeExercise, reset } = useRoutineBuilder();
  const [saving, setSaving] = useState(false);

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
      const routineId = await createRoutine(user.id, name, description);
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
      await registerTrainingEntry(trainingType);
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
            placeholderTextColor="#7A7A7F"
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
            placeholderTextColor="#7A7A7F"
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
            placeholderTextColor="#7A7A7F"
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
            placeholderTextColor="#7A7A7F"
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
          placeholderTextColor="#7A7A7F"
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
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>Finalizar rutina</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8C8B91',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: '#8C8B91',
    marginBottom: 12,
  },
  removeText: {
    color: '#FF647C',
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
    color: '#B5B4BB',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#2A2A2C',
    color: '#fff',
    borderRadius: 12,
    padding: 10,
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
    color: '#8C8B91',
  },
  link: {
    color: '#FC3058',
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
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F2F33',
  },
  outlineText: {
    color: '#fff',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#FC3058',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontWeight: '700',
  },
});
