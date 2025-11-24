import { RoutineExerciseInput } from "@/Context/RoutineBuilderContext";
import { RoutineExerciseDisplay } from "@/types";
import { fetchExerciseById } from "./exerciseApi";
import { supabase } from "./Supabase";

export interface Routine {
  id: string;
  profile_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const fetchUserRoutines = async (profileId: string) => {
  const { data, error } = await supabase
    .from("routines")
    .select("id, name, description, created_at")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as Routine[];
};

export const createRoutine = async (profile_id: string, name: string, description?: string) => {
  const { data, error } = await supabase
    .from("routines")
    .insert({ profile_id, name, description })
    .select("id")
    .single();

  if (error || !data) throw error ?? new Error("Unable to create routine");
  return data.id as string;
};

export const addExerciseToRoutine = async (
  payload: Omit<RoutineExerciseInput, "exercise"> & {
    routine_id: string;
    exercise_api_id: string;
  }
) => {
  const { error } = await supabase.from("routine_exercises").insert({
    routine_id: payload.routine_id,
    exercise_api_id: payload.exercise_api_id,
    position: payload.position,
    sets: payload.sets ?? null,
    reps: payload.reps ?? null,
    weight: payload.weight ?? null,
    rest_seconds: payload.rest_seconds ?? null,
    notes: payload.notes ?? null,
  });

  if (error) throw error;
};

export const fetchRoutineDetails = async (routine_id: string): Promise<RoutineExerciseDisplay[]> => {
  const { data, error } = await supabase
    .from("routine_exercises")
    .select("id, exercise_api_id, position, sets, reps, weight, rest_seconds, notes")
    .eq("routine_id", routine_id)
    .order("position", { ascending: true });

  if (error) throw error;

  const exercises = await Promise.all(
    (data ?? []).map(async (item) => ({
      id: item.id,
      position: item.position,
      sets: item.sets,
      reps: item.reps,
      weight: item.weight,
      rest_seconds: item.rest_seconds,
      notes: item.notes,
      exercise: await fetchExerciseById(item.exercise_api_id),
    }))
  );

  return exercises;
};
