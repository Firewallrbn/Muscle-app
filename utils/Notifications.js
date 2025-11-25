import * as Notifications from "expo-notifications";
import { useEffect } from "react";
import { Platform } from "react-native";

export function useNotifications() {

  useEffect(() => {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }, []);

  async function askPermission() {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  }

  async function scheduleReminder({ title, body, seconds }) {
    const granted = await askPermission();
    if (!granted) return null;

    return await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: { seconds },
    });
  }

  async function scheduleDaily(hour, minute) {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: "¡Hora de entrenar!",
        body: "Tu recordatorio diario del gimnasio",
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  async function cancelAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  return {
    scheduleReminder,
    scheduleDaily,
    cancelAll,
  };
}
