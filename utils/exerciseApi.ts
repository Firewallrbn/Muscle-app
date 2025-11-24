import { Exercise } from "@/types";
import { supabase } from "./Supabase";

const API_BASE_URL = "https://exercisedb.p.rapidapi.com";

const getApiKey = () => {
  const apiKey = "112d73487fmshe91ccfabdca7b08p1a9b1ejsnebe43c1e4234";
  if (!apiKey) {
    throw new Error("RapidAPI key is not configured.");
  }
  return apiKey;
};

const buildHeaders = () => ({
  "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  "x-rapidapi-key": getApiKey(),
});

const mapApiExercise = (payload: any): Exercise => ({
  id: payload.id?.toString(),
  name: payload.name ?? "Unknown exercise",
  bodyPart: payload.bodyPart ?? "Unknown",
  target: payload.target ?? "Unknown",
  equipment: payload.equipment ?? null,
  gifUrl: payload.gifUrl,
  imageUrl: payload.image ?? payload.gifUrl,
});

export const fetchExercisesFromAPI = async (): Promise<Exercise[]> => {
  const response = await fetch(`${API_BASE_URL}/exercises`, { headers: buildHeaders() });

  if (!response.ok) {
    throw new Error("Failed to fetch exercises from ExerciseDB");
  }

  const data = await response.json();
  return (data as any[]).map(mapApiExercise);
};

export const fetchExerciseById = async (id: string): Promise<Exercise> => {
  const response = await fetch(`${API_BASE_URL}/exercises/exerciseId/${id}`, { headers: buildHeaders() });

  if (!response.ok) {
    throw new Error("Failed to fetch exercise detail from ExerciseDB");
  }

  const payload = await response.json();
  return mapApiExercise(payload);
};

export const toggleLike = async (profile_id: string, exercise_api_id: string): Promise<"liked" | "unliked"> => {
  const { data, error } = await supabase
    .from("exercise_likes")
    .select("profile_id")
    .eq("profile_id", profile_id)
    .eq("exercise_api_id", exercise_api_id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    const { error: deleteError } = await supabase
      .from("exercise_likes")
      .delete()
      .eq("profile_id", profile_id)
      .eq("exercise_api_id", exercise_api_id);

    if (deleteError) throw deleteError;
    return "unliked";
  }

  const { error: insertError } = await supabase
    .from("exercise_likes")
    .insert({ profile_id, exercise_api_id });

  if (insertError) throw insertError;
  return "liked";
};

export const fetchLikedExercises = async (profile_id: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from("exercise_likes")
    .select("exercise_api_id")
    .eq("profile_id", profile_id);

  if (error) throw error;
  return data?.map((item) => item.exercise_api_id) ?? [];
};
