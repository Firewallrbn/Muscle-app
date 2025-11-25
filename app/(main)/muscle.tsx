import { useNotifications } from '@/utils/Notifications';
import {
  TRAINING_STORAGE_KEY,
  TRAINING_TYPES,
  dateToString,
  getTodayDateString,
  loadTrainingMap,
  saveTrainingMap,
} from '@/utils/trainingTracker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Calendar } from 'react-native-calendars';

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const isWithinNext7Days = (dateString: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateString + 'T12:00:00'); // Fix timezone
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays >= 0 && diffDays < 7;
};

const getWeekdayName = (dateString: string) => {
  const d = new Date(dateString + 'T12:00:00'); // Fix timezone
  return WEEKDAY_NAMES[d.getDay()] || dateString;
};

const parseDateString = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

const calculateCurrentStreak = (map: Record<string, string>) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates = new Set(Object.keys(map));
  let streak = 0;
  const cursor = new Date(today);

  while (dates.has(dateToString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const calculateBestStreak = (map: Record<string, string>) => {
  const dates = Object.keys(map).sort();
  if (dates.length === 0) return 0;

  let best = 1;
  let current = 1;

  for (let i = 1; i < dates.length; i++) {
    const prev = parseDateString(dates[i - 1]);
    const currentDate = parseDateString(dates[i]);
    const diffDays = (currentDate.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);

    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }

    if (current > best) best = current;
  }

  return best;
};

const countDaysThisMonth = (map: Record<string, string>) => {
  const today = new Date();
  const month = today.getMonth();
  const year = today.getFullYear();

  return Object.keys(map).filter((date) => {
    const parsed = parseDateString(date);
    return parsed.getMonth() === month && parsed.getFullYear() === year;
  }).length;
};

const getStartOfWeek = (date: Date) => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7; // Lunes como inicio de semana
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
};

const buildWeeklySummary = (map: Record<string, string>) => {
  const summary = TRAINING_TYPES.reduce((acc, type) => {
    acc[type.key] = 0;
    return acc;
  }, {} as Record<string, number>);

  const start = getStartOfWeek(new Date());
  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  Object.entries(map).forEach(([date, typeKey]) => {
    const parsed = parseDateString(date);
    if (parsed >= start && parsed <= end) {
      summary[typeKey] = (summary[typeKey] || 0) + 1;
    }
  });

  return summary;
};

export default function MuscleScreen() {
  const [dateTypeMap, setDateTypeMap] = useState<Record<string, string>>({});
  const [selectedType, setSelectedType] = useState<string | null>('pierna');
  const [isLoading, setIsLoading] = useState(true);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderDate, setReminderDate] = useState<string | null>(null);
  const [reminderHour, setReminderHour] = useState('07');
  const [reminderMinute, setReminderMinute] = useState('00');
  const [notify30Before, setNotify30Before] = useState(true);
  const router = useRouter();
  const { scheduleDaily, cancelAll } = useNotifications();

  // Cargar datos al iniciar
  useEffect(() => {
    loadData();
  }, []);

  // Guardar datos cada vez que cambian
  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [dateTypeMap]);

  const loadData = async () => {
    try {
      const data = await loadTrainingMap();
      setDateTypeMap(data);
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const saveData = async () => {
    try {
      await saveTrainingMap(dateTypeMap);
    } catch (e) {
      console.error('Error al guardar datos:', e);
    }
  };

  const buildMarkedDates = (map: Record<string, string>) => {
    const marked: Record<string, any> = {};
    Object.keys(map).forEach((date) => {
      const typeKey = map[date];
      const type = TRAINING_TYPES.find((t) => t.key === typeKey);
      const bg = type ? type.color : '#999';
      marked[date] = {
        customStyles: {
          container: {
            backgroundColor: bg,
            borderRadius: 6,
          },
          text: {
            color: '#fff',
            fontWeight: '600',
          },
        },
      };
    });
    return marked;
  };

  const onDayPress = (day: { dateString: string }) => {
    if (!selectedType) return;
    const date = day.dateString;

    setDateTypeMap((prev) => {
      if (prev[date] === selectedType) {
        const copy = { ...prev };
        delete copy[date];
        return copy;
      }
      return { ...prev, [date]: selectedType };
    });
  };

  const changeTypeForDate = (date: string) => {
    setDateTypeMap((prev) => {
      const current = prev[date];
      const idx = TRAINING_TYPES.findIndex((t) => t.key === current);
      const nextIdx = (idx + 1) % TRAINING_TYPES.length;
      return { ...prev, [date]: TRAINING_TYPES[nextIdx].key };
    });
  };

  const deleteDate = (date: string) => {
    setDateTypeMap((prev) => {
      const copy = { ...prev };
      delete copy[date];
      return copy;
    });
  };

  const clearAll = async () => {
    setDateTypeMap({});
    try {
      await AsyncStorage.removeItem(TRAINING_STORAGE_KEY);
    } catch (e) {
      console.error('Error al borrar datos:', e);
    }
  };

  const openReminderModal = () => {
    const today = getTodayDateString();
    setReminderDate(today);
    setShowReminderModal(true);
  };

  // FIX: Corrección de los botones de navegación de fecha
  const changeReminderDate = (direction: 'prev' | 'next') => {
    if (!reminderDate) return;
    const [year, month, day] = reminderDate.split('-').map(Number);
    const parsed = new Date(year, month - 1, day); // Crear fecha correctamente
    
    if (direction === 'prev') {
      parsed.setDate(parsed.getDate() - 1);
    } else {
      parsed.setDate(parsed.getDate() + 1);
    }
    setReminderDate(dateToString(parsed));
  };

  const incrementTime = (type: 'hour' | 'minute') => {
    if (type === 'hour') {
      const hour = (parseInt(reminderHour) + 1) % 24;
      setReminderHour(String(hour).padStart(2, '0'));
    } else {
      const minute = (parseInt(reminderMinute) + 1) % 60;
      setReminderMinute(String(minute).padStart(2, '0'));
    }
  };

  const decrementTime = (type: 'hour' | 'minute') => {
    if (type === 'hour') {
      const hour = parseInt(reminderHour) === 0 ? 23 : parseInt(reminderHour) - 1;
      setReminderHour(String(hour).padStart(2, '0'));
    } else {
      const minute = parseInt(reminderMinute) === 0 ? 59 : parseInt(reminderMinute) - 1;
      setReminderMinute(String(minute).padStart(2, '0'));
    }
  };

  // FIX: Nueva función para manejar input manual de hora
  const handleHourChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '') {
      setReminderHour('00');
      return;
    }
    const hour = parseInt(num);
    if (hour >= 0 && hour <= 23) {
      setReminderHour(String(hour).padStart(2, '0'));
    }
  };

  const handleMinuteChange = (text: string) => {
    const num = text.replace(/[^0-9]/g, '');
    if (num === '') {
      setReminderMinute('00');
      return;
    }
    const minute = parseInt(num);
    if (minute >= 0 && minute <= 59) {
      setReminderMinute(String(minute).padStart(2, '0'));
    }
  };

  // FIX: Corrección completa del sistema de notificaciones
  const saveReminder = async () => {
    if (!reminderDate) return;

    try {
      // Primero cancelar todas las notificaciones anteriores
      await cancelAll();

      const hour = parseInt(reminderHour);
      const minute = parseInt(reminderMinute);

      // Crear la fecha/hora objetivo correctamente
      const [year, month, day] = reminderDate.split('-').map(Number);
      const targetDate = new Date(year, month - 1, day);
      targetDate.setHours(hour, minute, 0, 0);

      let notificationTime = new Date(targetDate);

      // Si quiere notificación 30 minutos antes
      if (notify30Before) {
        notificationTime = new Date(targetDate.getTime() - 30 * 60 * 1000);
      }

      const now = new Date();
      
      // Si la hora ya pasó HOY, programar para el MISMO DÍA DE LA SEMANA de la próxima semana
      if (notificationTime <= now) {
        // Agregar días hasta llegar a la próxima semana
        notificationTime.setDate(notificationTime.getDate() + 7);
      }

      // Calcular los segundos hasta la notificación
      const secondsUntil = Math.floor((notificationTime.getTime() - now.getTime()) / 1000);

      // Programar notificación única (no diaria) para el momento exacto
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: notify30Before ? "¡Entrena en 30 minutos!" : "¡Hora de entrenar!",
          body: `Tu entrenamiento está programado para las ${reminderHour}:${reminderMinute}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntil > 5 ? secondsUntil : 5, // Mínimo 5 segundos
          repeats: false,
        },
      });
      
      if (notificationId) {
        const dayName = getWeekdayName(reminderDate);
        const timeStr = `${reminderHour}:${reminderMinute}`;
        const beforeStr = notify30Before ? ' (30 min antes)' : '';
        
        Alert.alert(
          '¡Recordatorio configurado!',
          `Te recordaremos el ${dayName} a las ${timeStr}${beforeStr}`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Error',
          'No se pudo configurar el recordatorio. Verifica los permisos de notificaciones.',
          [{ text: 'OK' }]
        );
      }

      setShowReminderModal(false);
    } catch (error) {
      console.error('Error al guardar recordatorio:', error);
      Alert.alert(
        'Error',
        'Hubo un problema al configurar el recordatorio.',
        [{ text: 'OK' }]
      );
    }
  };

  const closeReminder = () => {
    setShowReminderModal(false);
    setReminderDate(null);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  const upcomingDates = Object.keys(dateTypeMap)
    .filter((d) => isWithinNext7Days(d))
    .sort((a, b) => a.localeCompare(b));

  const currentStreak = calculateCurrentStreak(dateTypeMap);
  const bestStreak = calculateBestStreak(dateTypeMap);
  const daysThisMonth = countDaysThisMonth(dateTypeMap);
  const weeklySummary = buildWeeklySummary(dateTypeMap);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>Muscle</Text>
      <Text style={styles.subtitle}>
        Selecciona un tipo y toca un día para anotarlo. Toca otra vez para borrar.
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Racha actual</Text>
          <Text style={styles.statValue}>{currentStreak} días</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Mejor racha</Text>
          <Text style={styles.statValue}>{bestStreak} días</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Este mes</Text>
          <Text style={styles.statValue}>{daysThisMonth} días</Text>
        </View>
      </View>

      <View style={styles.legendContainer}>
        <ScrollView horizontal contentContainerStyle={styles.legendScroll} showsHorizontalScrollIndicator={false}>
          {TRAINING_TYPES.map((t) => {
            const selected = selectedType === t.key;
            return (
              <TouchableOpacity
                activeOpacity={0.7}
                key={t.key}
                style={[
                  styles.typeButton,
                  selected && styles.typeButtonSelected,
                  {
                    borderColor: t.color,
                    backgroundColor: selected ? t.color + '20' : '#fff',
                  },
                ]}
                onPress={() => setSelectedType(t.key)}
              >
                <View style={[styles.colorDot, { backgroundColor: t.color }]} />
                <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Calendario de entrenamientos</Text>
        <Calendar
          markingType={'custom'}
          markedDates={buildMarkedDates(dateTypeMap)}
          onDayPress={onDayPress}
          theme={{
            todayTextColor: '#222',
          }}
          style={styles.calendar}
        />
        <Text style={styles.helperText}>Los días coloreados son entrenamientos registrados.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Resumen semanal</Text>
        {TRAINING_TYPES.map((type) => (
          <View key={type.key} style={styles.weeklyRow}>
            <View style={styles.listInfo}>
              <View style={[styles.colorDot, { backgroundColor: type.color }]} />
              <Text style={styles.listType}>{type.label}</Text>
            </View>
            <Text style={styles.weeklyCount}>{weeklySummary[type.key]} vez(es)</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.listTitle}>Entrenamientos próximos 7 días</Text>
        {upcomingDates.length === 0 ? (
          <Text style={styles.emptyText}>No hay entrenamientos en los próximos 7 días.</Text>
        ) : (
          upcomingDates.map((date) => {
            const typeKey = dateTypeMap[date];
            const type = TRAINING_TYPES.find((t) => t.key === typeKey);
            return (
              <View key={date} style={styles.listItem}>
                <View style={styles.listInfo}>
                  <View style={[styles.colorDot, { backgroundColor: type?.color || '#999' }]} />
                  <View>
                    <Text style={styles.listDate}>{getWeekdayName(date)}</Text>
                    <Text style={styles.listType}>{type?.label || typeKey}</Text>
                  </View>
                </View>
                <View style={styles.listActions}>
                  <TouchableOpacity style={styles.actionButton} onPress={() => changeTypeForDate(date)}>
                    <Text style={styles.actionText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => deleteDate(date)}
                  >
                    <Text style={[styles.actionText, { color: '#fff' }]}>Borrar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/')}>
        <Text style={styles.primaryButtonText}>Registrar entrenamiento ahora</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.secondaryButton} onPress={openReminderModal}>
        <Text style={styles.secondaryButtonText}>Configurar recordatorio</Text>
      </TouchableOpacity>

      {/* Modal de recordatorio mejorado */}
      <Modal visible={showReminderModal} animationType="slide" transparent onRequestClose={closeReminder}>
        <View style={styles.reminderModalOverlay}>
          <View style={styles.reminderModalContent}>
            <Text style={styles.reminderTitle}>Configurar recordatorio</Text>

            <View style={styles.reminderSection}>
              <Text style={styles.reminderLabel}>Día del entrenamiento</Text>
              <View style={styles.dateSelector}>
                <TouchableOpacity
                  style={styles.dateNavButton}
                  onPress={() => changeReminderDate('prev')}
                >
                  <Text style={styles.dateNavButtonText}>←</Text>
                </TouchableOpacity>
                <Text style={styles.selectedDate}>
                  {reminderDate ? getWeekdayName(reminderDate) : 'Hoy'}
                </Text>
                <TouchableOpacity
                  style={styles.dateNavButton}
                  onPress={() => changeReminderDate('next')}
                >
                  <Text style={styles.dateNavButtonText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.reminderSection}>
              <Text style={styles.reminderLabel}>Hora del entrenamiento</Text>
              <View style={styles.timeSelector}>
                <View style={styles.timeInput}>
                  <TouchableOpacity onPress={() => decrementTime('hour')}>
                    <Text style={styles.timeButton}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.timeValueInput}
                    value={reminderHour}
                    onChangeText={handleHourChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={() => incrementTime('hour')}>
                    <Text style={styles.timeButton}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.timeSeparator}>:</Text>
                <View style={styles.timeInput}>
                  <TouchableOpacity onPress={() => decrementTime('minute')}>
                    <Text style={styles.timeButton}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.timeValueInput}
                    value={reminderMinute}
                    onChangeText={handleMinuteChange}
                    keyboardType="number-pad"
                    maxLength={2}
                    selectTextOnFocus
                  />
                  <TouchableOpacity onPress={() => incrementTime('minute')}>
                    <Text style={styles.timeButton}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.checkboxSection}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setNotify30Before(!notify30Before)}
              >
                <View
                  style={[
                    styles.checkboxBox,
                    notify30Before && styles.checkboxBoxChecked,
                  ]}
                >
                  {notify30Before && <Text style={styles.checkmark}>✓</Text>}
                </View>
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Recordarme 30 minutos antes
              </Text>
            </View>

            <View style={styles.reminderButtonRow}>
              <TouchableOpacity
                style={[styles.reminderButton, styles.cancelButton]}
                onPress={closeReminder}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.reminderButton, styles.saveButton]}
                onPress={saveReminder}
              >
                <Text style={styles.saveButtonText}>Guardar recordatorio</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
  },
  scrollContent: {
    paddingTop: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  legendContainer: {
    width: '100%',
    marginBottom: 12,
  },
  legendScroll: {
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  typeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  typeButtonSelected: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  colorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 13,
    color: '#222',
  },
  typeLabelSelected: {
    fontWeight: '600',
    color: '#000',
  },
  calendar: {
    width: '100%',
    borderRadius: 8,
    padding: 8,
  },
  helperText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  statLabel: {
    color: '#666',
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#eee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 6,
  },
  emptyText: {
    color: '#666',
    paddingVertical: 8,
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  listInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listDate: {
    fontSize: 14,
    fontWeight: '600',
  },
  listType: {
    fontSize: 12,
    color: '#555',
  },
  listActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#ddd',
    marginLeft: 8,
  },
  actionText: {
    color: '#222',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#c00',
  },
  weeklyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  weeklyCount: {
    fontWeight: '700',
    color: '#222',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#FC3058',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: '#0A84FF',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 8,
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  reminderModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  reminderModalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 32,
    maxHeight: '85%',
  },
  reminderTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  reminderSection: {
    marginBottom: 24,
  },
  reminderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    color: '#111',
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  dateNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateNavButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0A84FF',
  },
  selectedDate: {
    fontSize: 16,
    fontWeight: '600',
    minWidth: 120,
    textAlign: 'center',
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  timeInput: {
    borderWidth: 2,
    borderColor: '#0A84FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  timeButton: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0A84FF',
    width: 40,
    textAlign: 'center',
  },
  timeValueInput: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 8,
    width: 50,
    textAlign: 'center',
    color: '#000',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '700',
  },
  checkboxSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  checkbox: {
    marginRight: 12,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  checkmark: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  reminderButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  reminderButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#222',
    fontSize: 16,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#0A84FF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});