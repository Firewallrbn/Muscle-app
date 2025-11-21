import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { AuthContext } from '@/Context/AuthContext';
import { Exercise } from '@/types';
import { fetchExercises } from '@/utils/routines';

export default function AddExercisesScreen() {
  const { user } = useContext(AuthContext);
  const { addExercise, exercises } = useRoutineBuilder();
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Exercise[]>([]);

  const loadExercises = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await fetchExercises(user?.id, onlyFavorites);
      setData(items);
    } catch (err) {
      console.error('Error fetching exercises', err);
      setError('No pudimos cargar los ejercicios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExercises();
  }, [onlyFavorites]);

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
      <View style={styles.cardRow}>
        <View>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <Text style={styles.cardSubtitle}>{item.muscle_group}</Text>
        </View>
        <Text style={styles.badge}>{item.difficulty ?? 'n/a'}</Text>
      </View>
      {item.equipment ? <Text style={styles.cardMeta}>{item.equipment}</Text> : null}
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
          <TouchableOpacity onPress={loadExercises}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
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
  retryText: {
    color: '#FC3058',
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardRow: {
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
  },
  badge: {
    color: '#FC3058',
    fontWeight: '700',
  },
  cardMeta: {
    color: '#B5B4BB',
    marginTop: 4,
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
