import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { useRoutineBuilder } from '@/Context/RoutineBuilderContext';
import { AuthContext } from '@/Context/AuthContext';
import { Exercise } from '@/types';
import { useExerciseContext } from '@/Context/ExerciseContext';
import { fetchLikedExercises } from '@/utils/exerciseApi';
import ExerciseCard from '@/components/ExerciseCard';
import TopBar from '@/components/TopBar';
import { Theme, useTheme } from '@/Context/ThemeContext';

export default function AddExercisesScreen() {
  const { user } = useContext(AuthContext);
  const { addExercise, exercises } = useRoutineBuilder();
  const { exercises: apiExercises, loading, error } = useExerciseContext();
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
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
    <View style={styles.container}>
      <TopBar
        title="Añadir ejercicios"
        subtitle={`${exercises.length} seleccionados`}
        showBack
        rightComponent={
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setOnlyFavorites((prev) => !prev)}
          >
            <Text style={styles.filterText}>{onlyFavorites ? 'Ver todos' : 'Favoritos'}</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
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
          contentContainerStyle={styles.listContent}
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
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    filterButton: {
      backgroundColor: theme.colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterText: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
    },
    errorText: {
      color: theme.colors.accent,
      textAlign: 'center',
      marginBottom: 8,
    },
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    card: {
      marginBottom: 10,
    },
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
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
