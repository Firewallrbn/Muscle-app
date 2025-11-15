export interface Exercise {
    id: string;
    name: string;
    bodyPart: string;
    target: string;
    equipment: string;
    gifUrl: string;
    secondaryMuscles?: string[];
    instructions?: string[];
    imageUrl?: string;
}
