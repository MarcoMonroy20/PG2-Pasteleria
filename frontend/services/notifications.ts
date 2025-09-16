import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export const schedulePedidoNotification = async (pedidoId: number, title: string, body: string, triggerDate: Date): Promise<string | null> => {
  if (Platform.OS === 'web') return null;
  if (triggerDate.getTime() <= Date.now()) return null;
  const id = await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: triggerDate,
  });
  return id;
};

export const cancelNotificationById = async (notificationId: string | null | undefined): Promise<void> => {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // noop
  }
};


