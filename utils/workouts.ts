import { RoutineExercise, RoutineSummary, RoutineTemplate } from "@/types";
import { supabase } from "./Supabase";

export type WorkoutSetInput = {
  exerciseId: string;
  setIndex: number;
  weightKg?: number;
  reps?: number;
  completed: boolean;
};

export const fetchUserRoutines = async (profileId: string): Promise<RoutineSummary[]> => {
  const { data: routines, error } = await supabase
    .from("routines")
    .select("id, name, description, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const { data: sessions, error: sessionsError } = await supabase
    .from("workout_sessions")
    .select("routine_id, finished_at, started_at")
    .eq("profile_id", profileId)
    .order("finished_at", { ascending: false });

  if (sessionsError) throw sessionsError;

  const lastPerformedMap = new Map<string, string | null>();
  (sessions ?? []).forEach((session) => {
    const performedAt = session.finished_at ?? session.started_at;
    if (!lastPerformedMap.has(session.routine_id) && performedAt) {
      lastPerformedMap.set(session.routine_id, performedAt);
    }
  });

  return (routines ?? []).map((routine) => ({
    id: routine.id,
    name: routine.name,
    description: routine.description ?? undefined,
    createdAt: routine.created_at,
    exercises: [],
    lastPerformedAt: lastPerformedMap.get(routine.id) ?? null,
  }));
};

export const fetchRoutineDetail = async (routineId: string): Promise<RoutineTemplate> => {
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .select("id, name, description, created_at")
    .eq("id", routineId)
    .single();

  if (routineError || !routine) throw routineError ?? new Error("Routine not found");

  const { data: exercises, error: exercisesError } = await supabase
    .from("routine_exercises")
    .select("id, exercise_id, position, sets, reps, weight, rest_seconds")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (exercisesError) throw exercisesError;

  const mappedExercises: RoutineExercise[] = (exercises ?? []).map((item) => ({
    exerciseId: item.exercise_id,
    order: item.position,
    defaultSets: item.sets ?? 1,
    defaultReps: item.reps ?? undefined,
    defaultWeightKg: item.weight ?? undefined,
    defaultRestSeconds: item.rest_seconds ?? undefined,
  }));

  return {
    id: routine.id,
    name: routine.name,
    description: routine.description ?? undefined,
    createdAt: routine.created_at,
    exercises: mappedExercises,
  };
};

export const createRoutineWithExercises = async (
  profileId: string,
  name: string,
  description: string | undefined,
  exercises: RoutineExercise[]
): Promise<string> => {
  const { data: routine, error: routineError } = await supabase
    .from("routines")
    .insert({ profile_id: profileId, name, description })
    .select("id")
    .single();

  if (routineError || !routine) throw routineError ?? new Error("Unable to create routine");

  if (exercises.length) {
    const { error: insertError } = await supabase.from("routine_exercises").insert(
      exercises.map((exercise) => ({
        routine_id: routine.id,
        exercise_id: exercise.exerciseId,
        position: exercise.order,
        sets: exercise.defaultSets,
        reps: exercise.defaultReps ?? null,
        weight: exercise.defaultWeightKg ?? null,
        rest_seconds: exercise.defaultRestSeconds ?? null,
      }))
    );

    if (insertError) throw insertError;
  }

  return routine.id;
};

export const saveWorkoutSession = async (
  profileId: string,
  routineId: string,
  startedAt: string,
  finishedAt?: string
): Promise<string> => {
  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({
      profile_id: profileId,
      routine_id: routineId,
      started_at: startedAt,
      finished_at: finishedAt ?? null,
    })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Unable to create workout session");
  return data.id;
};

export const saveWorkoutSets = async (sessionId: string, sets: WorkoutSetInput[]) => {
  if (!sets.length) return;

  const { error } = await supabase.from("workout_sets").insert(
    sets.map((set) => ({
      session_id: sessionId,
      exercise_id: set.exerciseId,
      set_index: set.setIndex,
      weight: set.weightKg ?? null,
      reps: set.reps ?? null,
      completed: set.completed,
    }))
  );

  if (error) throw error;
};
