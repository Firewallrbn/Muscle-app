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
    fetchAllExercises: () => Promise<void>;
}

const ExerciseContext = createContext<ExerciseContextValue | undefined>(undefined);

const API_BASE_URL = 'https://exercisedb.p.rapidapi.com';

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

            if (isMountedRef.current) {
                setBodyParts(data);
            }
        } catch (err) {
            handleError(err);
            throw err;
        }
    }, [handleError]);

    const fetchAllExercises = useCallback(async () => {
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

            const data = (await response.json()) as Exercise[];
            const exercisesWithImages = data.map((exercise) => ({
                ...exercise,
                imageUrl: exercise.gifUrl,
            }));

            if (isMountedRef.current) {
                setExercises(exercisesWithImages);
            }
        } catch (err) {
            handleError(err);
            throw err;
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
