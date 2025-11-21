import { supabase } from "./Supabase";
import { RoutineExerciseInput } from "../Context/RoutineBuilderContext";
import { Exercise } from "../types";

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

export const fetchExercises = async (profileId?: string, onlyLiked?: boolean) => {
  if (onlyLiked && profileId) {
    const { data, error } = await supabase
      .from("exercises")
      .select("*, exercise_likes!inner(profile_id)")
      .eq("exercise_likes.profile_id", profileId)
      .order("muscle_group", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return data as Exercise[];
  }

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .order("muscle_group", { ascending: true })
    .order("name", { ascending: true });

  if (error) throw error;
  return data as Exercise[];
};

export const fetchRoutineDetail = async (routineId: string) => {
  const { data, error } = await supabase
    .from("routine_exercises")
    .select("id, position, sets, reps, weight, rest_seconds, notes, exercises (id, name, muscle_group, equipment, difficulty, image_url)")
    .eq("routine_id", routineId)
    .order("position", { ascending: true });

  if (error) throw error;
  return data;
};

export const createRoutineWithExercises = async (
  profileId: string,
  name: string,
  description: string,
  exercises: RoutineExerciseInput[]
) => {
  const { data: routineData, error: routineError } = await supabase
    .from("routines")
    .insert([{ profile_id: profileId, name, description }])
    .select("id")
    .single();

  if (routineError || !routineData) {
    throw routineError ?? new Error("Unable to create routine");
  }

  if (!exercises.length) return routineData.id;

  const routineExercisesPayload = exercises.map((item, index) => ({
    routine_id: routineData.id,
    exercise_id: item.exercise.id,
    position: index + 1,
    sets: item.sets ?? null,
    reps: item.reps ?? null,
    weight: item.weight ?? null,
    rest_seconds: item.rest_seconds ?? null,
    notes: item.notes ?? null,
  }));

  const { error: routineExercisesError } = await supabase
    .from("routine_exercises")
    .insert(routineExercisesPayload);

  if (routineExercisesError) throw routineExercisesError;

  return routineData.id;
};
