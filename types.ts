export interface Exercise {
    id: string;
    name: string;
    bodyPart: string;
    equipment: string;
    target: string;
    imageUrl: string;
    description?: string;
    muscleGroup?: string;
    [key: string]: any;
}

