export interface Exercise {
    id: string;
    name: string;
    description?: string | null;
    muscle_group: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    equipment?: string | null;
    video_url?: string | null;
    image_url?: string | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export interface RoutineExerciseDisplay {
    id: string;
    position: number;
    sets?: number | null;
    reps?: number | null;
    weight?: number | null;
    rest_seconds?: number | null;
    notes?: string | null;
    exercises: Pick<Exercise, 'id' | 'name' | 'muscle_group' | 'equipment' | 'difficulty' | 'image_url'>;
}
