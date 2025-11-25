export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment?: string | null;
  gifUrl?: string;
  imageUrl?: string;
}

export interface RoutineExerciseDisplay {
  id: string;
  position: number;
  sets?: number | null;
  reps?: number | null;
  weight?: number | null;
  rest_seconds?: number | null;
  notes?: string | null;
  exercise: Pick<Exercise, 'id' | 'name' | 'bodyPart' | 'target' | 'equipment' | 'imageUrl' | 'gifUrl'>;
}

export type RoutineExercise = {
  exerciseId: string;
  order: number;
  defaultSets: number;
  defaultReps?: number;
  defaultWeightKg?: number;
  defaultRestSeconds?: number;
};

export type RoutineTemplate = {
  id: string;
  name: string;
  description?: string;
  exercises: RoutineExercise[];
  createdAt: string;
};

export type RoutineSummary = RoutineTemplate & {
  lastPerformedAt?: string | null;
};

export type ActiveSet = {
  setIndex: number;
  weightKg?: number;
  reps?: number;
  completed: boolean;
};

export type ActiveExercise = {
  routineExerciseId: string;
  exerciseId: string;
  name: string;
  restSeconds: number;
  sets: ActiveSet[];
};

export type ActiveWorkout = {
  id: string;
  routineId: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  exercises: ActiveExercise[];
};
