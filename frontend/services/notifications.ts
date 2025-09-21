import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Safe notification service with proper error handling
class SafeNotificationService {
  private pushToken: string | null = null;
  private pushEnabled = false;

  constructor() {
    // Initialize safely
    this.pushToken = null;
    this.pushEnabled = false;
  }

  public async getPushToken(): Promise<string | null> {
    // Try to get push token safely for web
    if (Platform.OS === 'web') {
      try {
        // Dynamic import to avoid module loading issues
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { initializeApp } = await import('firebase/app');
        const { firebaseConfig } = await import('../firebase.config');

        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);

        const token = await getToken(messaging, {
          vapidKey: process.env.EXPO_PUBLIC_FIREBASE_VAPID_KEY || 'your-vapid-key'
        });

        if (token) {
          this.pushToken = token;
          this.pushEnabled = true;
          console.log('✅ Push notifications enabled for web');
          return token;
        }
      } catch (error) {
        console.warn('❌ Push notifications not available for web:', error);
        this.pushEnabled = false;
      }
    }

    return this.pushToken;
  }

  public isPushEnabled(): boolean {
    return this.pushEnabled;
  }

  public async testNotification() {
    try {
      await Notifications.presentNotificationAsync({
        title: '¡Prueba de Notificación!',
        body: 'Esta es una notificación de prueba',
        data: { test: true },
      });
      return true;
    } catch (error) {
      console.error('Error testing notification:', error);
      return false;
    }
  }
}

// Singleton instance
export const enhancedNotifications = new SafeNotificationService();

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