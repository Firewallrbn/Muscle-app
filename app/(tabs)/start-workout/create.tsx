import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useExerciseContext } from "@/Context/ExerciseContext";
import { AuthContext } from "@/Context/AuthContext";
import { RoutineExercise } from "@/types";
import { createRoutineWithExercises } from "@/utils/workouts";

const CreateRoutineScreen = () => {
  const router = useRouter();
  const { exercises, loading } = useExerciseContext();
  const { user } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [query, setQuery] = useState("");
  const [bodyPart, setBodyPart] = useState("");
  const [saving, setSaving] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<RoutineExercise[]>([]);

  const filteredExercises = useMemo(() => {
    const normalizedQuery = query.toLowerCase();
    return exercises.filter((exercise) => {
      const matchesQuery = exercise.name.toLowerCase().includes(normalizedQuery);
      const matchesBodyPart = bodyPart ? exercise.bodyPart === bodyPart : true;
      return matchesQuery && matchesBodyPart;
    });
  }, [bodyPart, exercises, query]);

  const addExercise = (exerciseId: string) => {
    if (selectedExercises.some((item) => item.exerciseId === exerciseId)) return;
    const nextOrder = selectedExercises.length + 1;
    setSelectedExercises((prev) => [
      ...prev,
      {
        exerciseId,
        order: nextOrder,
        defaultSets: 3,
        defaultReps: 10,
        defaultRestSeconds: 60,
      },
    ]);
  };

  const removeExercise = (exerciseId: string) => {
    setSelectedExercises((prev) =>
      prev
        .filter((item) => item.exerciseId !== exerciseId)
        .map((item, index) => ({ ...item, order: index + 1 }))
    );
  };

  const handleSave = async () => {
    if (!user?.id || !name || !selectedExercises.length) return;
    setSaving(true);
    try {
      await createRoutineWithExercises(user.id, name, description || undefined, selectedExercises);
      router.replace("/(tabs)/start-workout");
    } catch (error) {
      console.error("Error saving routine", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Create Routine</Text>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Leg day"
          placeholderTextColor="#8C8B91"
        />
      </View>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          value={description}
          onChangeText={setDescription}
          placeholder="Add a short note"
          placeholderTextColor="#8C8B91"
          multiline
          numberOfLines={3}
        />
      </View>

      <View style={styles.filterRow}>
        <TextInput
          style={[styles.input, styles.filterInput]}
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises"
          placeholderTextColor="#8C8B91"
        />
        <TextInput
          style={[styles.input, styles.filterInput]}
          value={bodyPart}
          onChangeText={setBodyPart}
          placeholder="Body part"
          placeholderTextColor="#8C8B91"
        />
      </View>

      <Text style={styles.sectionTitle}>Selected Exercises ({selectedExercises.length})</Text>
      <FlatList
        data={selectedExercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => (
          <View style={styles.selectedCard}>
            <Text style={styles.selectedText}>
              {item.order}. {exercises.find((e) => e.id === item.exerciseId)?.name ?? item.exerciseId}
            </Text>
            <TouchableOpacity onPress={() => removeExercise(item.exerciseId)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.emptyText}>No exercises selected yet.</Text>}
        contentContainerStyle={{ paddingVertical: 8, gap: 8 }}
      />

      <Text style={styles.sectionTitle}>Exercises</Text>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#FC3058" />
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.exerciseCard} onPress={() => addExercise(item.id)}>
              <Text style={styles.exerciseTitle}>{item.name}</Text>
              <Text style={styles.exerciseMeta}>{item.bodyPart}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.exerciseList}
        />
      )}

      <TouchableOpacity
        style={[styles.saveButton, (!name || !selectedExercises.length || saving) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!name || !selectedExercises.length || saving}
      >
        <Text style={styles.saveButtonText}>{saving ? "Saving..." : "Save Routine"}</Text>
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
  title: {
    color: "#FFF",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    color: "#D8D8DC",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1C1C1E",
    borderRadius: 10,
    padding: 12,
    color: "#FFF",
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    marginVertical: 8,
  },
  filterInput: {
    flex: 1,
  },
  sectionTitle: {
    color: "#FFF",
    fontWeight: "700",
    marginTop: 12,
    marginBottom: 8,
  },
  selectedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1C1C1E",
    padding: 10,
    borderRadius: 10,
    gap: 12,
  },
  selectedText: {
    color: "#FFF",
    fontWeight: "600",
  },
  removeText: {
    color: "#FC3058",
    fontWeight: "700",
  },
  emptyText: {
    color: "#8C8B91",
  },
  exerciseCard: {
    backgroundColor: "#1C1C1E",
    padding: 12,
    borderRadius: 10,
  },
  exerciseTitle: {
    color: "#FFF",
    fontWeight: "700",
    marginBottom: 4,
  },
  exerciseMeta: {
    color: "#8C8B91",
  },
  exerciseList: {
    gap: 10,
    paddingBottom: 20,
  },
  saveButton: {
    backgroundColor: "#FC3058",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 12,
  },
  saveButtonText: {
    color: "#FFF",
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loader: {
    paddingVertical: 20,
  },
});

export default CreateRoutineScreen;
