import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { Exercise } from "../types";

export interface RoutineExerciseInput {
  exercise: Exercise;
  position: number;
  sets?: number;
  reps?: number;
  weight?: number;
  rest_seconds?: number;
  notes?: string;
}

interface RoutineBuilderContextValue {
  name: string;
  description: string;
  trainingType: string;
  exercises: RoutineExerciseInput[];
  setName: (value: string) => void;
  setDescription: (value: string) => void;
  setTrainingType: (value: string) => void;
  addExercise: (exercise: Exercise) => void;
  updateExercise: (exerciseId: string, payload: Partial<RoutineExerciseInput>) => void;
  removeExercise: (exerciseId: string) => void;
  reset: () => void;
}

const RoutineBuilderContext = createContext<RoutineBuilderContextValue | undefined>(undefined);

export const RoutineBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [trainingType, setTrainingType] = useState("pierna");
  const [exercises, setExercises] = useState<RoutineExerciseInput[]>([]);

  const addExercise = useCallback((exercise: Exercise) => {
    setExercises((prev) => {
      const position = prev.length + 1;
      return [...prev, { exercise, position }];
    });
  }, []);

  const updateExercise = useCallback((exerciseId: string, payload: Partial<RoutineExerciseInput>) => {
    setExercises((prev) =>
      prev.map((item) =>
        item.exercise.id === exerciseId
          ? {
              ...item,
              ...payload,
            }
          : item
      )
    );
  }, []);

  const removeExercise = useCallback((exerciseId: string) => {
    setExercises((prev) => {
      const filtered = prev.filter((item) => item.exercise.id !== exerciseId);
      return filtered.map((item, index) => ({ ...item, position: index + 1 }));
    });
  }, []);

  const reset = useCallback(() => {
    setName("");
    setDescription("");
    setTrainingType("pierna");
    setExercises([]);
  }, []);

  const value = useMemo(
    () => ({
      name,
      description,
      trainingType,
      exercises,
      setName,
      setDescription,
      setTrainingType,
      addExercise,
      updateExercise,
      removeExercise,
      reset,
    }),
    [name, description, trainingType, exercises, addExercise, updateExercise, removeExercise, reset]
  );

  return <RoutineBuilderContext.Provider value={value}>{children}</RoutineBuilderContext.Provider>;
};

export const useRoutineBuilder = () => {
  const context = useContext(RoutineBuilderContext);
  if (!context) {
    throw new Error("useRoutineBuilder must be used within RoutineBuilderProvider");
  }
  return context;
};
