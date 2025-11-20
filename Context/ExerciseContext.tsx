import { Exercise } from '@/types';
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from 'react';

interface ExerciseContextValue {
    bodyParts: string[];
    exercises: Exercise[];
    loading: boolean;
    error: string | null;
    fetchBodyParts: () => Promise<void>;
    fetchAllExercises: (resolution?: number) => Promise<void>;
}

type ApiExercise = Partial<Exercise> & {
    id: string;
    gifUrl?: string;
    imageUrl?: string;
};


const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

const API_BASE_URL = 'https://exercisedb.p.rapidapi.com';
const DEFAULT_IMAGE_RESOLUTION = 360;

type ExerciseApiResponse = Omit<Exercise, 'imageUrl'> & { id: string | number };

const buildExerciseImageUrl = (id: string | number, resolution: number = DEFAULT_IMAGE_RESOLUTION) => {
    const paddedId = id.toString().padStart(4, '0');
    return `https://cdn.exercisedb.io/exercises/${paddedId}/${resolution}.gif`;
};

const getApiKey = () => {
    const apiKey = process.env.EXPO_PUBLIC_RAPIDAPI_KEY;
    if (!apiKey) {
        throw new Error('RapidAPI key is not configured.');
    }
    return apiKey;
};

export const ExerciseProvider = ({ children }: { children: ReactNode }) => {
    const [bodyParts, setBodyParts] = useState<string[]>([]);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const handleError = useCallback((err: unknown) => {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        if (isMountedRef.current) {
            setError(message);
        }
    }, []);

    const fetchBodyParts = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/exercises/bodyPartList`, {
                headers: {
                    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
                    'x-rapidapi-key': getApiKey(),
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch body parts.');
            }

            const data = (await response.json()) as string[];
            console.log('Fetched body parts:', data);
            if (isMountedRef.current) {
                setBodyParts(data);
            }
        } catch (err) {
            handleError(err);
            throw err;
        }
    }, [handleError]);

    const fetchAllExercises = useCallback(async (resolution: number = DEFAULT_IMAGE_RESOLUTION) => {
        try {
            const response = await fetch(`${API_BASE_URL}/exercises`, {
                headers: {
                    'x-rapidapi-host': 'exercisedb.p.rapidapi.com',
                    'x-rapidapi-key': getApiKey(),
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch exercises.');
            }

            const data = (await response.json()) as ApiExercise[];

            const exercisesWithImages: Exercise[] = data.map((exercise) => ({
                id: exercise.id.toString(),
                name: exercise.name ?? 'Unknown exercise',
                bodyPart: exercise.bodyPart ?? 'Unknown body part',
                equipment: exercise.equipment ?? 'Unknown equipment',
                target: exercise.target ?? 'Unknown target',
                imageUrl: buildExerciseImageUrl(exercise.id, resolution),
                description: exercise.description ?? 'No description available',
                muscleGroup: exercise.muscleGroup ?? 'Unknown muscle group',
            }));

            if (isMountedRef.current) {
                setExercises(exercisesWithImages);
            }
        } catch (err) {
            handleError(err);
        }
    }, [handleError]);

    useEffect(() => {
        let isActive = true;

        const loadInitialData = async () => {
            if (!isMountedRef.current) {
                return;
            }
            setLoading(true);
            setError(null);

            try {
                await Promise.all([fetchBodyParts(), fetchAllExercises()]);
            } catch (err) {
                if (!isActive) {
                    return;
                }
                // Error already handled in fetch functions
            } finally {
                if (isMountedRef.current) {
                    setLoading(false);
                }
            }
        };

        loadInitialData();

        return () => {
            isActive = false;
        };
    }, [fetchBodyParts, fetchAllExercises]);

    const value: ExerciseContextValue = {
        bodyParts,
        exercises,
        loading,
        error,
        fetchBodyParts,
        fetchAllExercises,
    };

    return <ExerciseContext.Provider value={value}>{children}</ExerciseContext.Provider>;
};

export const useExerciseContext = () => {
    const context = useContext(ExerciseContext);
    if (!context) {
        throw new Error('useExerciseContext must be used within an ExerciseProvider.');
    }
    return context;
};