import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/Supabase';
import { fetchRoutineDetails } from '@/utils/routines';
import { RoutineExerciseDisplay } from '@/types';
import { Theme, useTheme } from '@/Context/ThemeContext';

interface RoutineDetail {
  id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export default function RoutineDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [routine, setRoutine] = useState<RoutineDetail | null>(null);
  const [items, setItems] = useState<RoutineExerciseDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error: routineError } = await supabase
          .from('routines')
          .select('id, name, description, created_at')
          .eq('id', id)
          .single();

        if (routineError || !data) throw routineError;
        setRoutine(data);

        const detail = await fetchRoutineDetails(id);
        setItems(detail);
      } catch (err) {
        console.error('Routine detail error', err);
        setError('No pudimos cargar esta rutina.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const renderItem = ({ item }: { item: RoutineExerciseDisplay }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseIndex}>#{item.position}</Text>
        <Text style={styles.exerciseName}>{item.exercise.name}</Text>
        <Text style={styles.exerciseBadge}>{item.exercise.bodyPart}</Text>
      </View>
      <Text style={styles.exerciseMeta}>
        {item.sets ? `${item.sets}x` : '-'} {item.reps ? `${item.reps} reps` : ''}
      </Text>
      <Text style={styles.exerciseMeta}>
        {item.weight ? `${item.weight} kg • ` : ''}
        {item.rest_seconds ? `${item.rest_seconds}s descanso` : ''}
      </Text>
      {item.notes ? <Text style={styles.exerciseNotes}>{item.notes}</Text> : null}
    </View>
  );

  const handleBack = () => router.back();

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{routine?.name}</Text>
        {routine?.description ? <Text style={styles.subtitle}>{routine.description}</Text> : null}
        <Text style={styles.dateText}>{routine?.created_at ? new Date(routine.created_at).toLocaleString() : ''}</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.errorText}>No hay ejercicios en esta rutina.</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.outlineButton}
          onPress={handleBack}
        >
          <Text style={styles.outlineText}>Atrás</Text>
        </TouchableOpacity>
        {routine && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.push({
              pathname: '/(main)/routines/execute',
              params: { id: routine.id }
            })}
          >
            <Text style={styles.primaryText}>Ejecutar rutina</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
      fontSize: 24,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
    dateText: {
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    errorText: {
      color: theme.colors.accent,
    },
    exerciseCard: {
      backgroundColor: theme.colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    exerciseHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 4,
    },
    exerciseIndex: {
      color: theme.colors.accent,
      fontWeight: '800',
    },
    exerciseName: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '700',
      flex: 1,
    },
    exerciseBadge: {
      color: theme.colors.textSecondary,
    },
    exerciseMeta: {
      color: theme.colors.textSecondary,
    },
    exerciseNotes: {
      color: theme.colors.textSecondary,
      marginTop: 6,
    },
  });
