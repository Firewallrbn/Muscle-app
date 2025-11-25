import AsyncStorage from '@react-native-async-storage/async-storage';

export const TRAINING_TYPES: { key: string; label: string; color: string }[] = [
  { key: 'pierna', label: 'Pierna', color: '#FF6B6B' },
  { key: 'tren_superior', label: 'Tren Superior', color: '#4D96FF' },
  { key: 'core', label: 'Core', color: '#FFD93D' },
  { key: 'pecho', label: 'Pecho', color: '#9B5DE5' },
  { key: 'espalda', label: 'Espalda', color: '#2EC4B6' },
  { key: 'full', label: 'Full', color: '#FF8A65' },
];

export const TRAINING_STORAGE_KEY = '@muscle_training_data';

export const dateToString = (date: Date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const getTodayDateString = () => dateToString(new Date());

export const loadTrainingMap = async (): Promise<Record<string, string>> => {
  const jsonValue = await AsyncStorage.getItem(TRAINING_STORAGE_KEY);
  if (!jsonValue) return {};
  try {
    return JSON.parse(jsonValue);
  } catch (error) {
    console.error('Error parsing training map', error);
    return {};
  }
};

export const saveTrainingMap = async (map: Record<string, string>) => {
  const jsonValue = JSON.stringify(map);
  await AsyncStorage.setItem(TRAINING_STORAGE_KEY, jsonValue);
};

export const registerTrainingEntry = async (
  typeKey: string,
  dateString: string = getTodayDateString()
): Promise<Record<string, string>> => {
  const currentMap = await loadTrainingMap();
  const updated = { ...currentMap, [dateString]: typeKey };
  await saveTrainingMap(updated);
  return updated;
};
