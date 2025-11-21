import React, { useCallback, useContext, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link, router, useFocusEffect } from 'expo-router';
import { AuthContext } from '@/Context/AuthContext';
import { fetchUserRoutines, Routine } from '@/utils/routines';

export default function RoutinesScreen() {
  const { user } = useContext(AuthContext);
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
          <ActivityIndicator color="#FC3058" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0E0E10',
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    color: '#8C8B91',
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#FC3058',
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
  },
  errorText: {
    color: '#FF647C',
    marginBottom: 8,
  },
  retryText: {
    color: '#FC3058',
  },
  emptyText: {
    color: '#8C8B91',
  },
  linkText: {
    color: '#FC3058',
    marginTop: 8,
  },
  card: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardDate: {
    color: '#8C8B91',
    fontSize: 12,
  },
  cardDescription: {
    color: '#B5B4BB',
    marginTop: 4,
  },
});
