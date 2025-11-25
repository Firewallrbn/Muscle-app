import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { ActiveExercise, ActiveSet, ActiveWorkout } from "@/types";
import { fetchRoutineDetail, saveWorkoutSession, saveWorkoutSets } from "@/utils/workouts";
import { useExerciseContext } from "./ExerciseContext";
import { AuthContext } from "./AuthContext";

interface WorkoutContextValue {
  currentWorkout: ActiveWorkout | null;
  startWorkoutFromRoutine(routineId: string): Promise<void>;
  updateSet(exerciseId: string, setIndex: number, patch: Partial<ActiveSet>): void;
  finishWorkout(): Promise<void>;
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(undefined);

const generateId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

export const WorkoutProvider = ({ children }: { children: React.ReactNode }) => {
  const { exercises: catalogExercises } = useExerciseContext();
  const { user } = useContext(AuthContext);
  const [currentWorkout, setCurrentWorkout] = useState<ActiveWorkout | null>(null);

  const startWorkoutFromRoutine = useCallback(
    async (routineId: string) => {
      if (!user?.id) throw new Error("No authenticated user");
      const routine = await fetchRoutineDetail(routineId);
      const exerciseMap = new Map(catalogExercises.map((exercise) => [exercise.id, exercise]));

      const activeExercises: ActiveExercise[] = routine.exercises.map((exercise) => {
        const details = exerciseMap.get(exercise.exerciseId);
        const sets: ActiveSet[] = Array.from({ length: exercise.defaultSets || 1 }, (_v, index) => ({
          setIndex: index + 1,
          weightKg: exercise.defaultWeightKg ?? undefined,
          reps: exercise.defaultReps ?? undefined,
          completed: false,
        }));

        return {
          routineExerciseId: `${exercise.exerciseId}-${exercise.order}`,
          exerciseId: exercise.exerciseId,
          name: details?.name ?? `Exercise ${exercise.exerciseId}`,
          restSeconds: exercise.defaultRestSeconds ?? 0,
          sets,
        };
      });

      const startedAt = new Date().toISOString();
      const activeWorkout: ActiveWorkout = {
        id: generateId(),
        routineId: routine.id,
        name: routine.name,
        startedAt,
        exercises: activeExercises,
      };

      setCurrentWorkout(activeWorkout);
    },
    [catalogExercises, user?.id]
  );

  const updateSet = useCallback((exerciseId: string, setIndex: number, patch: Partial<ActiveSet>) => {
    setCurrentWorkout((prev) => {
      if (!prev) return prev;
      const exercises = prev.exercises.map((exercise) => {
        if (exercise.exerciseId !== exerciseId) return exercise;

        const sets = exercise.sets.some((set) => set.setIndex === setIndex)
          ? exercise.sets.map((set) => (set.setIndex === setIndex ? { ...set, ...patch } : set))
          : [...exercise.sets, { setIndex, completed: false, ...patch } as ActiveSet];

        return { ...exercise, sets: sets.sort((a, b) => a.setIndex - b.setIndex) };
      });

      return { ...prev, exercises };
    });
  }, []);

  const finishWorkout = useCallback(async () => {
    if (!currentWorkout || !user?.id) return;
    const finishedAt = new Date().toISOString();
    const sessionId = await saveWorkoutSession(user.id, currentWorkout.routineId, currentWorkout.startedAt, finishedAt);

    const completedSets = currentWorkout.exercises.flatMap((exercise) =>
      exercise.sets
        .filter((set) => set.completed)
        .map((set) => ({
          exerciseId: exercise.exerciseId,
          setIndex: set.setIndex,
          weightKg: set.weightKg,
          reps: set.reps,
          completed: set.completed,
        }))
    );

    await saveWorkoutSets(sessionId, completedSets);
    setCurrentWorkout(null);
  }, [currentWorkout, user?.id]);

  const value = useMemo(
    () => ({ currentWorkout, startWorkoutFromRoutine, updateSet, finishWorkout }),
    [currentWorkout, finishWorkout, startWorkoutFromRoutine, updateSet]
  );

  return <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>;
};

export const useWorkoutContext = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkoutContext must be used within a WorkoutProvider");
  }
  return context;
};
