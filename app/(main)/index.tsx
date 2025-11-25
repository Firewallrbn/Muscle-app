import { AuthContext } from '@/Context/AuthContext';
import { Theme, useTheme } from '@/Context/ThemeContext';
import { fetchUserRoutines, Routine } from '@/utils/routines';
import { Link, router, useFocusEffect } from 'expo-router';
import { useCallback, useContext, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RoutinesScreen() {
  const { user } = useContext(AuthContext);
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRoutines = async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserRoutines(user.id);
      setRoutines(data);
    } catch (err) {
      console.error('Error fetching routines', err);
      setError('No pudimos cargar tus rutinas.');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [user?.id])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRoutines();
    setRefreshing(false);
  };

  const renderRoutine = ({ item }: { item: Routine }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(main)/routines/${item.id}`)}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardDate}>{new Date(item.created_at ?? '').toLocaleDateString()}</Text>
      </View>
      {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tus rutinas</Text>
          <Text style={styles.subtitle}>Organiza y guarda tus entrenamientos.</Text>
        </View>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/(main)/routines/create')}>
          <Text style={styles.createButtonText}>Crear</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={theme.colors.accent} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={loadRoutines}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          renderItem={renderRoutine}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <View style={styles.centered}> 
              <Text style={styles.emptyText}>Aún no tienes rutinas creadas.</Text>
              <Link href="/(main)/routines/create" style={styles.linkText}>
                Crear tu primera rutina
              </Link>
            </View>
          )}
        />
      )}
    </View>
  );
}

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 16,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 20,
    },
    title: {
      color: theme.colors.text,
      fontSize: 24,
      fontWeight: '700',
    },
    subtitle: {
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    createButton: {
      backgroundColor: theme.colors.accent,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },
    createButtonText: {
      color: '#fff',
      fontWeight: '600',
    },
    centered: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    errorText: {
      color: theme.colors.accent,
      marginBottom: 8,
      textAlign: 'center',
    },
    retryText: {
      color: theme.colors.accent,
      fontWeight: '600',
    },
    emptyText: {
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    linkText: {
      color: theme.colors.accent,
      marginTop: 12,
      fontWeight: '600',
    },
    card: {
      backgroundColor: theme.colors.card,
      padding: 16,
      borderRadius: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '700',
      flex: 1,
    },
    cardDate: {
      color: theme.colors.textSecondary,
      fontSize: 12,
    },
    cardDescription: {
      color: theme.colors.textSecondary,
      marginTop: 4,
    },
    listContent: {
      paddingBottom: 32,
    },
  });
