export interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  target: string;
  equipment?: string | null;
  gifUrl?: string;
  imageUrl?: string;
}

export interface ExerciseDetails extends Exercise {
  secondaryMuscles?: string[];
  instructions?: string[];
  description?: string;
  difficulty?: string;
  category?: string;
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
