import React, { useContext, useEffect } from 'react';
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { AuthContext } from '@/Context/AuthContext';

export default function CreateRoutineScreen() {
  const { user } = useContext(AuthContext);
  const { name, description, setName, setDescription, exercises, reset } = useRoutineBuilder();

  useEffect(() => {
    reset();
  }, [reset]);

  const handleAddExercises = () => {
    if (!user?.id) {
      Alert.alert('Sesión expirada', 'Inicia sesión para crear rutinas.');
      return;
    }
    if (!name.trim()) {
      Alert.alert('Nombre requerido', 'Asigna un nombre a tu rutina antes de continuar.');
      return;
    }
    router.push('/(main)/routines/add-exercises');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Nueva rutina</Text>
      <Text style={styles.subtitle}>Asigna un nombre y una descripción breve.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Pierna explosiva"
          placeholderTextColor="#7A7A7F"
          value={name}
          onChangeText={setName}
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Descripción</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Notas o enfoque de la sesión"
          placeholderTextColor="#7A7A7F"
          value={description}
          multiline
          numberOfLines={4}
          onChangeText={setDescription}
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Ejercicios añadidos</Text>
        <Text style={styles.summaryCount}>{exercises.length} seleccionado(s)</Text>
        <TouchableOpacity onPress={() => router.push('/(main)/routines/parameters')} disabled={!exercises.length}>
          <Text style={[styles.link, !exercises.length && styles.disabledText]}>Editar sets y reps</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleAddExercises}>
        <Text style={styles.primaryText}>Agregar ejercicios</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
        <Text style={styles.secondaryText}>Cancelar</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#8C8B91',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
  },
  label: {
    color: '#B5B4BB',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#2A2A2C',
    color: '#fff',
    borderRadius: 12,
    padding: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    color: '#fff',
    fontWeight: '700',
    marginBottom: 4,
  },
  summaryCount: {
    color: '#8C8B91',
  },
  link: {
    color: '#FC3058',
    marginTop: 8,
  },
  disabledText: {
    color: '#555',
  },
  primaryButton: {
    marginTop: 30,
    backgroundColor: '#FC3058',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  primaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    marginTop: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#8C8B91',
  },
});
