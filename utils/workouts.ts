import { supabase } from './Supabase';

export type WorkoutSession = {
  id: string;
  profile_id: string;
  routine_id: string | null;
  started_at: string;
  finished_at: string | null;
};

export type WorkoutSet = {
  id: string;
  session_id: string;
  exercise_id: string;
  set_index: number;
  weight: number | null;
  reps: number | null;
  completed: boolean | null;
};

export type WorkoutStats = {
  sessionsThisWeek: number;
  totalVolume: number;
  topExercise?: {
    exerciseId: string;
    volume: number;
    sets: number;
  };
  weeklyActivity: { label: string; count: number }[];
  lastSessions: { id: string; started_at: string; finished_at: string | null; volume: number }[];
};

const parseNumber = (value: number | null) => (typeof value === 'number' ? value : 0);

const isSameWeek = (date: Date, reference: Date) => {
  const startOfWeek = new Date(reference);
  const day = startOfWeek.getDay();
  const diffToMonday = (day + 6) % 7; // Monday as start of week
  startOfWeek.setDate(reference.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 7);

  return date >= startOfWeek && date < endOfWeek;
};

const buildWeeklyActivity = (sessions: WorkoutSession[]) => {
  const today = new Date();
  const days: { label: string; count: number; key: string }[] = [];
  const dayLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date();
    day.setDate(today.getDate() - i);
    day.setHours(0, 0, 0, 0);
    days.push({
      label: dayLabels[day.getDay()],
      count: 0,
      key: day.toISOString().slice(0, 10)
    });
  }

  const sessionByDay = sessions.reduce<Record<string, number>>((acc, session) => {
    const key = session.started_at.slice(0, 10);
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  return days.map(({ label, key, count }) => ({
    label,
    count: sessionByDay[key] ?? count
  }));
};

export const fetchWorkoutStats = async (profileId: string): Promise<WorkoutStats> => {
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id, profile_id, routine_id, started_at, finished_at')
    .eq('profile_id', profileId)
    .order('started_at', { ascending: false })
    .limit(50);

  if (sessionsError) {
    throw new Error(sessionsError.message);
  }

  const sessions: WorkoutSession[] = sessionsData ?? [];
  const sessionIds = sessions.map((session) => session.id);

  const { data: setsData, error: setsError } = sessionIds.length
    ? await supabase
        .from('workout_sets')
        .select('id, session_id, exercise_id, set_index, weight, reps, completed')
        .in('session_id', sessionIds)
    : { data: [], error: null };

  if (setsError) {
    throw new Error(setsError.message);
  }

  const sets: WorkoutSet[] = setsData ?? [];

  const totalVolume = sets.reduce((acc, set) => acc + parseNumber(set.weight) * parseNumber(set.reps), 0);

  const sessionsThisWeek = sessions.filter((session) => {
    const sessionDate = new Date(session.started_at);
    return isSameWeek(sessionDate, new Date());
  }).length;

  const volumePerExercise = sets.reduce<Record<string, { volume: number; sets: number }>>((acc, set) => {
    const volume = parseNumber(set.weight) * parseNumber(set.reps);
    const current = acc[set.exercise_id] ?? { volume: 0, sets: 0 };
    acc[set.exercise_id] = {
      volume: current.volume + volume,
      sets: current.sets + 1,
    };
    return acc;
  }, {});

  const topExerciseEntry = Object.entries(volumePerExercise).sort((a, b) => b[1].volume - a[1].volume)[0];
  const topExercise = topExerciseEntry
    ? { exerciseId: topExerciseEntry[0], volume: topExerciseEntry[1].volume, sets: topExerciseEntry[1].sets }
    : undefined;

  const lastSessions = sessions.slice(0, 5).map((session) => {
    const sessionSets = sets.filter((set) => set.session_id === session.id);
    const sessionVolume = sessionSets.reduce((acc, set) => acc + parseNumber(set.weight) * parseNumber(set.reps), 0);
    return {
      id: session.id,
      started_at: session.started_at,
      finished_at: session.finished_at,
      volume: sessionVolume,
    };
  });

  return {
    sessionsThisWeek,
    totalVolume,
    topExercise,
    weeklyActivity: buildWeeklyActivity(sessions),
    lastSessions,
  };
};
