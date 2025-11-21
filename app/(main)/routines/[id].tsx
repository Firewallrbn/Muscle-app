import React, { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View, FlatList } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/Supabase';
import { fetchRoutineDetail } from '@/utils/routines';
import { RoutineExerciseDisplay } from '@/types';

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

        const detail = await fetchRoutineDetail(id);
        setItems(detail as RoutineExerciseDisplay[]);
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
        <Text style={styles.exerciseName}>{item.exercises.name}</Text>
        <Text style={styles.exerciseBadge}>{item.exercises.muscle_group}</Text>
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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}> 
        <View style={styles.centered}>
          <ActivityIndicator color="#FC3058" />
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
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#B5B4BB',
    marginTop: 6,
  },
  dateText: {
    color: '#8C8B91',
    marginTop: 6,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#FF647C',
  },
  exerciseCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  exerciseIndex: {
    color: '#FC3058',
    fontWeight: '800',
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  exerciseBadge: {
    color: '#8C8B91',
  },
  exerciseMeta: {
    color: '#B5B4BB',
  },
  exerciseNotes: {
    color: '#8C8B91',
    marginTop: 6,
  },
});
