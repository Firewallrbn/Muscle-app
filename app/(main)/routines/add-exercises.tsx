import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { AuthContext } from '@/Context/AuthContext';
import { Exercise } from '@/types';
import { useExerciseContext } from '@/Context/ExerciseContext';
import { fetchLikedExercises } from '@/utils/exerciseApi';
import ExerciseCard from '@/components/ExerciseCard';

export default function AddExercisesScreen() {
  const { user } = useContext(AuthContext);
  const { addExercise, exercises } = useRoutineBuilder();
  const { exercises: apiExercises, loading, error } = useExerciseContext();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [likedIds, setLikedIds] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const liked = await fetchLikedExercises(user.id);
        setLikedIds(liked);
      } catch (err) {
        console.error('Error loading liked exercises', err);
      }
    };
    load();
  }, [user?.id]);

  const visibleExercises = useMemo(() => {
    if (onlyFavorites) {
      return apiExercises.filter((item) => likedIds.includes(item.id));
    }
    return apiExercises;
  }, [apiExercises, likedIds, onlyFavorites]);

  const handleAdd = (exercise: Exercise) => {
    const alreadyAdded = exercises.some((item) => item.exercise.id === exercise.id);
    if (alreadyAdded) {
      Alert.alert('Ejercicio ya agregado', 'Puedes editar sus parámetros en el siguiente paso.');
      return;
    }
    addExercise(exercise);
  };

  const renderExercise = ({ item }: { item: Exercise }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleAdd(item)}>
      <ExerciseCard exercise={item} liked={likedIds.includes(item.id)} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Añadir ejercicios</Text>
        <TouchableOpacity onPress={() => setOnlyFavorites((prev) => !prev)} style={styles.filterButton}>
          <Text style={styles.filterText}>{onlyFavorites ? 'Ver todos' : 'Solo favoritos'}</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#FC3058" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={visibleExercises}
          keyExtractor={(item) => item.id}
          renderItem={renderExercise}
          ListEmptyComponent={() => (
            <View style={styles.centered}>
              <Text style={styles.errorText}>No se encontraron ejercicios.</Text>
            </View>
          )}
        />
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.outlineButton} onPress={() => router.back()}>
          <Text style={styles.outlineText}>Volver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(main)/routines/parameters')}>
          <Text style={styles.primaryText}>Continuar</Text>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  filterButton: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  filterText: {
    color: '#FC3058',
    fontWeight: '600',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF647C',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
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
