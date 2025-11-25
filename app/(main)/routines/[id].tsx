import { Theme, useTheme } from '@/Context/ThemeContext';
import TopBar from '@/components/TopBar';
import { RoutineExerciseDisplay } from '@/types';
import { supabase } from '@/utils/Supabase';
import { fetchRoutineDetails } from '@/utils/routines';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
      <View style={styles.container}>
        <TopBar title="Cargando..." showBack />
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <TopBar title="Error" showBack />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar
        title={routine?.name ?? 'Rutina'}
        subtitle={routine?.description ?? undefined}
        showBack
        rightAction={
          routine
            ? {
                icon: 'play',
                label: 'Iniciar',
                onPress: () =>
                  router.push({
                    pathname: '/(main)/routines/execute',
                    params: { id: routine.id },
                  }),
              }
            : undefined
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.centered}>
            <Text style={styles.errorText}>No hay ejercicios en esta rutina.</Text>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.outlineButton} onPress={handleBack}>
          <Text style={styles.outlineText}>Atrás</Text>
        </TouchableOpacity>
        {routine && (
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() =>
              router.push({
                pathname: '/(main)/routines/execute',
                params: { id: routine.id },
              })
            }
          >
            <Text style={styles.primaryText}>Ejecutar rutina</Text>
          </TouchableOpacity>
        )}
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
    listContent: {
      paddingHorizontal: 16,
      paddingBottom: 16,
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
    footer: {
      flexDirection: 'row',
      gap: 12,
      paddingVertical: 16,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    outlineButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.card,
    },
    outlineText: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '600',
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
      fontSize: 16,
      fontWeight: '700',
    },
  });
