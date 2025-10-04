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
    // Try to get push token for both web and mobile
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
    } else {
      // For mobile devices (Android/iOS)
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: process.env.EXPO_PUBLIC_PROJECT_ID || 'pasteleria-cocina-app-marcomonroyumg'
        });
        
        if (token) {
          this.pushToken = token.data;
          this.pushEnabled = true;
          console.log('✅ Push notifications enabled for mobile:', token.data);
          return token.data;
        }
      } catch (error) {
        console.warn('❌ Push notifications not available for mobile:', error);
        this.pushEnabled = false;
      }
    }

    return this.pushToken;
  }

  public isPushEnabled(): boolean {
    return this.pushEnabled;
  }

  public async testNotification(): Promise<boolean> {
    try {
      console.log('🔔 SafeNotificationService: Testing notification...');
      
      // Solicitar permisos primero
      const permissions = await Notifications.requestPermissionsAsync();
      
      if (!(permissions as any).granted) {
        console.warn('❌ Permisos de notificación no concedidos');
        return false;
      }

      console.log('✅ Permisos concedidos, enviando notificación...');

      // Mostrar notificación de prueba
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '¡Prueba de Notificación!',
          body: 'Esta es una notificación de prueba desde SafeNotificationService',
          data: { test: true, timestamp: Date.now() },
        },
        trigger: null,
      });
      
      console.log('✅ Notificación de prueba enviada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error testing notification:', error);
      
      // Log detallado del error para debugging
      if (error && typeof error === 'object') {
        console.error('Error details:', {
          name: (error as any).name,
          message: (error as any).message,
          stack: (error as any).stack
        });
      }
      
      return false;
    }
  }
}

// Singleton instance
export const enhancedNotifications = new SafeNotificationService();

export const schedulePedidoNotification = async (pedidoId: number, title: string, body: string, triggerDate: Date): Promise<string | null> => {
  try {
    if (Platform.OS === 'web') {
      console.log('⚠️ Web platform: notifications not supported');
      return null;
    }
    
    if (triggerDate.getTime() <= Date.now()) {
      console.warn('⚠️ Notification date is in the past, skipping');
      return null;
    }

    console.log(`📅 Scheduling notification for pedido ${pedidoId} at ${triggerDate.toISOString()}`);
    
    // Solicitar permisos antes de programar
    const permissions = await Notifications.requestPermissionsAsync();
    if (!(permissions as any).granted) {
      console.warn('❌ Permisos de notificación no concedidos para programar');
      return null;
    }

    const id = await Notifications.scheduleNotificationAsync({
      content: { 
        title, 
        body,
        data: { pedidoId, scheduledAt: Date.now() }
      },
      trigger: { type: 'date', date: triggerDate },
    });
    
    console.log(`✅ Notification scheduled with ID: ${id}`);
    return id;
  } catch (error) {
    console.error('❌ Error scheduling notification:', error);
    return null;
  }
};

export const cancelNotificationById = async (notificationId: string | null | undefined): Promise<void> => {
  if (!notificationId || Platform.OS === 'web') {
    console.log('⚠️ No notification ID provided or web platform, skipping cancellation');
    return;
  }
  
  try {
    console.log(`🗑️ Cancelling notification with ID: ${notificationId}`);
    await Notifications.cancelScheduledNotificationAsync(notificationId);
    console.log(`✅ Notification ${notificationId} cancelled successfully`);
  } catch (error) {
    console.error(`❌ Error cancelling notification ${notificationId}:`, error);
  }
};