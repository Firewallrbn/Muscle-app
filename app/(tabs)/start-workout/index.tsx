import React, { useCallback, useContext, useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { fetchUserRoutines } from "@/utils/workouts";
import { RoutineSummary } from "@/types";
import { AuthContext } from "@/Context/AuthContext";

const RoutineListScreen = () => {
  const router = useRouter();
  const { user } = useContext(AuthContext);
  const [routines, setRoutines] = useState<RoutineSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const loadRoutines = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await fetchUserRoutines(user.id);
      setRoutines(data);
    } catch (error) {
      console.error("Error loading routines", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadRoutines();
  }, [loadRoutines]);

  const renderItem = ({ item }: { item: RoutineSummary }) => (
    <Pressable style={styles.card} onPress={() => router.push({ pathname: "/(tabs)/start-workout/preview", params: { routineId: item.id } })}>
      <Text style={styles.cardTitle}>{item.name}</Text>
      <Text style={styles.cardSubtitle}>Created: {new Date(item.createdAt).toLocaleDateString()}</Text>
      <Text style={styles.cardSubtitle}>
        Last performed: {item.lastPerformedAt ? new Date(item.lastPerformedAt).toLocaleDateString() : "Never"}
      </Text>
      {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Start a Workout</Text>
        <TouchableOpacity style={styles.newButton} onPress={() => router.push("/(tabs)/start-workout/create")}>
          <Text style={styles.newButtonText}>New Routine</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#FC3058" />
        </View>
      ) : (
        <FlatList
          data={routines}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          onRefresh={loadRoutines}
          refreshing={loading}
          ListEmptyComponent={<Text style={styles.emptyText}>Create your first routine to get started.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0E",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "700",
  },
  newButton: {
    backgroundColor: "#FC3058",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  newButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  listContent: {
    gap: 12,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: "#1C1C1E",
    borderRadius: 12,
    padding: 16,
  },
  cardTitle: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#8C8B91",
    fontSize: 13,
    marginBottom: 2,
  },
  cardDescription: {
    color: "#D8D8DC",
    marginTop: 8,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    color: "#8C8B91",
    textAlign: "center",
    marginTop: 40,
  },
});

export default RoutineListScreen;
