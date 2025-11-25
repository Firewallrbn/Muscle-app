import { Exercise, ExerciseDetails } from "@/types";
import { supabase } from "./Supabase";

const API_BASE_URL = "https://exercisedb.p.rapidapi.com";

const getApiKey = () => {
  const apiKey = "7bef2ba3b5mshcbc24c43f38da88p15b065jsn2bea43ab6482";
  if (!apiKey) {
    throw new Error("RapidAPI key is not configured.");
  }
  return apiKey;
};

const buildHeaders = () => ({
  "x-rapidapi-host": "exercisedb.p.rapidapi.com",
  "x-rapidapi-key": getApiKey(),
});

// 🔥 NUEVO: builder como tenías antes
const DEFAULT_IMAGE_RESOLUTION = 360;

const buildExerciseImageUrl = (
  id: string | number,
  resolution: number = DEFAULT_IMAGE_RESOLUTION
) => {
  const apiKey = getApiKey();
  const paddedId = id.toString().padStart(4, "0");
  return `https://exercisedb.p.rapidapi.com/image?exerciseId=${paddedId}&resolution=${resolution}&rapidapi-key=${apiKey}`;
};

/**
 * Supabase column `exercise_id` is a UUID, but ExerciseDB IDs are short numeric strings (e.g. "0001").
 * This helper pads the ExerciseDB ID into a valid UUID shape that stays deterministic for the same exercise.
 */
export const normalizeExerciseId = (exerciseId: string) => {
  const sanitized = exerciseId.replace(/[^a-fA-F0-9]/g, "");
  const padded = sanitized.slice(-12).padStart(12, "0");
  return `00000000-0000-0000-0000-${padded}`;
};

export const denormalizeExerciseId = (exerciseId: string) => {
  const sanitized = exerciseId.replace(/[^a-fA-F0-9]/g, "");
  const lastTwelve = sanitized.slice(-12);
  const trimmed = lastTwelve.replace(/^0+/, "");

  if (trimmed) {
    return trimmed.padStart(4, "0");
  }

  return exerciseId;
};

// 🔥 NUEVO: Fallback robusto en mapApiExercise
const mapApiExercise = (payload: any): Exercise => {
  const id = payload.id?.toString();

  return {
    id,
    name: payload.name ?? "Unknown exercise",
    bodyPart: payload.bodyPart ?? "Unknown",
    target: payload.target ?? "Unknown",
    equipment: payload.equipment ?? null,
    gifUrl: payload.gifUrl,
    // Fallbacks en orden:
    imageUrl:
      payload.image ??
      payload.gifUrl ??
      (id ? buildExerciseImageUrl(id) : undefined),
  };
};

export const fetchExercisesFromAPI = async (): Promise<Exercise[]> => {
  const response = await fetch(`${API_BASE_URL}/exercises`, {
    headers: buildHeaders(),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exercises from ExerciseDB");
  }

  const data = await response.json();
  return (data as any[]).map(mapApiExercise);
};

export const fetchExerciseById = async (exerciseId: string): Promise<Exercise> => {
  try {
    // Si el ID ya está desnormalizado (corto como "0003"), úsalo directamente
    const normalizedId = exerciseId.includes("-") 
      ? denormalizeExerciseId(exerciseId) 
      : exerciseId.padStart(4, "0"); // Asegúrate que tenga 4 dígitos

    console.log('Fetching from API with ID:', normalizedId);

    const response = await fetch(
      `${API_BASE_URL}/exercises/exercise/${normalizedId}`,
      {
        headers: buildHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error Response:', errorData);
      throw new Error(`Failed to fetch exercise detail from ExerciseDB: ${response.status}`);
    }

    const payload = await response.json();
    console.log('API Response:', payload);
    
    return mapApiExercise(payload);
  } catch (err) {
    console.error('fetchExerciseById error:', err);
    throw err;
  }
};

export const fetchExerciseDetails = async (exerciseId: string): Promise<ExerciseDetails> => {
  try {
    // Si el ID ya está desnormalizado (corto como "0003"), úsalo directamente
    const normalizedId = exerciseId.includes("-") 
      ? denormalizeExerciseId(exerciseId) 
      : exerciseId.padStart(4, "0");

    const response = await fetch(
      `${API_BASE_URL}/exercises/exercise/${normalizedId}`,
      {
        headers: buildHeaders(),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch exercise details: ${response.status}`);
    }

    const payload = await response.json();
    
    return {
      id: payload.id?.toString(),
      name: payload.name ?? "Unknown exercise",
      bodyPart: payload.bodyPart ?? "Unknown",
      target: payload.target ?? "Unknown",
      equipment: payload.equipment ?? null,
      gifUrl: payload.gifUrl,
      imageUrl: payload.image ?? payload.gifUrl ?? (payload.id ? buildExerciseImageUrl(payload.id) : undefined),
      secondaryMuscles: payload.secondaryMuscles ?? [],
      instructions: payload.instructions ?? [],
      description: payload.description ?? "",
      difficulty: payload.difficulty ?? "intermediate",
      category: payload.category ?? "strength",
    };
  } catch (err) {
    console.error('fetchExerciseDetails error:', err);
    throw err;
  }
};

export const toggleLike = async (
  profile_id: string,
  exercise_id: string
): Promise<"liked" | "unliked"> => {
  const normalizedExerciseId = normalizeExerciseId(exercise_id);

  const { data, error } = await supabase
    .from("exercise_likes")
    .select("profile_id")
    .eq("profile_id", profile_id)
    .eq("exercise_id", normalizedExerciseId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    const { error: deleteError } = await supabase
      .from("exercise_likes")
      .delete()
      .eq("profile_id", profile_id)
      .eq("exercise_id", normalizedExerciseId);

    if (deleteError) throw deleteError;
    return "unliked";
  }

  const { error: insertError } = await supabase
    .from("exercise_likes")
    .insert({ profile_id, exercise_id: normalizedExerciseId });

  if (insertError) throw insertError;
  return "liked";
};

export const fetchLikedExercises = async (
  profile_id: string
): Promise<string[]> => {
  const { data, error } = await supabase
    .from("exercise_likes")
    .select("exercise_id")
    .eq("profile_id", profile_id);

  if (error) throw error;
  return data?.map((item) => item.exercise_id) ?? [];
};
