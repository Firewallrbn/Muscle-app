export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscleGroup?: string;
  equipment?: string;
  [key: string]: any;
}

