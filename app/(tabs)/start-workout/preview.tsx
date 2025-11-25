import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useExerciseContext } from "@/Context/ExerciseContext";
import { RoutineTemplate } from "@/types";
import { fetchRoutineDetail } from "@/utils/workouts";
import { useWorkoutContext } from "@/Context/WorkoutContext";

const RoutinePreviewScreen = () => {
  const { routineId } = useLocalSearchParams<{ routineId: string }>();
  const router = useRouter();
  const { exercises } = useExerciseContext();
  const { startWorkoutFromRoutine } = useWorkoutContext();

  const [routine, setRoutine] = useState<RoutineTemplate | null>(null);
  const [loading, setLoading] = useState(false);

  const exerciseMap = useMemo(() => new Map(exercises.map((exercise) => [exercise.id, exercise])), [exercises]);

  useEffect(() => {
    const load = async () => {
      if (!routineId) return;
      setLoading(true);
      try {
        const data = await fetchRoutineDetail(String(routineId));
        setRoutine(data);
      } catch (error) {
        console.error("Error loading routine detail", error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [routineId]);

  const handleStart = async () => {
    if (!routineId) return;
    await startWorkoutFromRoutine(String(routineId));
    router.push("/(tabs)/start-workout/active");
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loader]}>
        <ActivityIndicator color="#FC3058" />
      </View>
    );
  }

  if (!routine) {
    return (
      <View style={[styles.container, styles.loader]}>
        <Text style={styles.emptyText}>Routine not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>{routine.name}</Text>
      {routine.description ? <Text style={styles.description}>{routine.description}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Exercises</Text>
        {routine.exercises.map((item) => {
          const exercise = exerciseMap.get(item.exerciseId);
          return (
            <View key={`${item.exerciseId}-${item.order}`} style={styles.exerciseRow}>
              <Text style={styles.exerciseName}>
                {item.order}. {exercise?.name ?? item.exerciseId}
              </Text>
              <Text style={styles.exerciseMeta}>
                {item.defaultSets} sets{item.defaultReps ? ` x ${item.defaultReps} reps` : ""}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={[styles.button, styles.outline]} onPress={() => router.push(`/(tabs)/routines/${routine.id}`)}>
          <Text style={[styles.buttonText, styles.outlineText]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={handleStart}>
          <Text style={styles.buttonText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D0D0E",
    padding: 16,
  },
  loader: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#FFF",
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 8,
  },
  description: {
    color: "#D8D8DC",
    marginBottom: 16,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 10,
  },
  exerciseRow: {
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  exerciseName: {
    color: "#FFF",
    fontWeight: "700",
  },
  exerciseMeta: {
    color: "#8C8B91",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  button: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: {
    backgroundColor: "#FC3058",
  },
  outline: {
    borderColor: "#FC3058",
    borderWidth: 1,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  outlineText: {
    color: "#FC3058",
  },
  emptyText: {
    color: "#8C8B91",
  },
});

export default RoutinePreviewScreen;
