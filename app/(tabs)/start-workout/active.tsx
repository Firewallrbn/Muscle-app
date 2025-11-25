import React, { useEffect, useState } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useWorkoutContext } from "@/Context/WorkoutContext";
import { ActiveExercise, ActiveSet } from "@/types";

const ActiveWorkoutScreen = () => {
  const router = useRouter();
  const { currentWorkout, finishWorkout, updateSet } = useWorkoutContext();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [restTimers, setRestTimers] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!currentWorkout) return;
    const startedAt = new Date(currentWorkout.startedAt).getTime();
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
      setRestTimers((prev) => {
        const next: Record<string, number> = {};
        Object.entries(prev).forEach(([key, value]) => {
          if (value > 1) next[key] = value - 1;
        });
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentWorkout]);

  const handleFinish = async () => {
    await finishWorkout();
    router.replace("/(tabs)/start-workout");
  };

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  const toggleComplete = (exercise: ActiveExercise, set: ActiveSet) => {
    const nextCompleted = !set.completed;
    updateSet(exercise.exerciseId, set.setIndex, { completed: nextCompleted });

    if (nextCompleted && exercise.restSeconds) {
      setRestTimers((prev) => ({ ...prev, [`${exercise.exerciseId}-${set.setIndex}`]: exercise.restSeconds }));
    }
  };

  const addSet = (exercise: ActiveExercise) => {
    const nextIndex = exercise.sets.length + 1;
    const lastSet = exercise.sets[exercise.sets.length - 1];
    updateSet(exercise.exerciseId, nextIndex, {
      weightKg: lastSet?.weightKg,
      reps: lastSet?.reps,
      completed: false,
    });
  };

  const renderSet = (exercise: ActiveExercise, set: ActiveSet) => {
    const timerKey = `${exercise.exerciseId}-${set.setIndex}`;
    const remainingRest = restTimers[timerKey];
    return (
      <View key={timerKey} style={styles.setRow}>
        <Text style={styles.setLabel}>Set {set.setIndex}</Text>
        <View style={styles.inputsRow}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="kg"
            placeholderTextColor="#8C8B91"
            value={set.weightKg?.toString() ?? ""}
            onChangeText={(value) =>
              updateSet(exercise.exerciseId, set.setIndex, { weightKg: value ? Number(value) : undefined })
            }
          />
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="reps"
            placeholderTextColor="#8C8B91"
            value={set.reps?.toString() ?? ""}
            onChangeText={(value) =>
              updateSet(exercise.exerciseId, set.setIndex, { reps: value ? Number(value) : undefined })
            }
          />
          <TouchableOpacity
            style={[styles.checkbox, set.completed && styles.checkboxCompleted]}
            onPress={() => toggleComplete(exercise, set)}
          >
            <Text style={styles.checkboxText}>{set.completed ? "✓" : ""}</Text>
          </TouchableOpacity>
        </View>
        {remainingRest ? <Text style={styles.restText}>Rest: {remainingRest}s</Text> : null}
      </View>
    );
  };

  if (!currentWorkout) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <Text style={styles.emptyText}>No active workout. Start one from your routines.</Text>
        <TouchableOpacity style={[styles.button, styles.primary]} onPress={() => router.replace("/(tabs)/start-workout")}>
          <Text style={styles.buttonText}>Go to Routines</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{currentWorkout.name}</Text>
          <Text style={styles.subtitle}>{new Date(currentWorkout.startedAt).toLocaleDateString()}</Text>
        </View>
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{formatTime(elapsedSeconds)}</Text>
        </View>
      </View>

      <View style={styles.exerciseList}>
        {currentWorkout.exercises.map((exercise) => (
          <View key={exercise.routineExerciseId} style={styles.exerciseCard}>
            <View style={styles.exerciseHeader}>
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <TouchableOpacity onPress={() => addSet(exercise)}>
                <Text style={styles.addSet}>+ Add Set</Text>
              </TouchableOpacity>
            </View>
            {exercise.sets.map((set) => renderSet(exercise, set))}
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.button, styles.finishButton]} onPress={handleFinish}>
        <Text style={styles.buttonText}>Finish Workout</Text>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "800",
  },
  subtitle: {
    color: "#8C8B91",
  },
  timerBadge: {
    backgroundColor: "#1C1C1E",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  timerText: {
    color: "#FC3058",
    fontWeight: "700",
  },
  exerciseList: {
    flex: 1,
    gap: 12,
  },
  exerciseCard: {
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  exerciseName: {
    color: "#FFF",
    fontWeight: "700",
    fontSize: 16,
  },
  addSet: {
    color: "#FC3058",
    fontWeight: "700",
  },
  setRow: {
    backgroundColor: "#101012",
    padding: 10,
    borderRadius: 10,
    marginBottom: 8,
  },
  setLabel: {
    color: "#D8D8DC",
    marginBottom: 6,
  },
  inputsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#1C1C1E",
    borderRadius: 8,
    padding: 10,
    color: "#FFF",
  },
  checkbox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FC3058",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: "#FC3058",
  },
  checkboxText: {
    color: "#FFF",
    fontWeight: "800",
  },
  restText: {
    color: "#8C8B91",
    marginTop: 6,
  },
  button: {
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primary: {
    backgroundColor: "#FC3058",
  },
  finishButton: {
    backgroundColor: "#FC3058",
    marginTop: 10,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyText: {
    color: "#8C8B91",
    textAlign: "center",
  },
});

export default ActiveWorkoutScreen;
