import { messaging } from '../config/firebase';

export interface NotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
}

export class NotificationService {
  static async sendPushNotification(fcmToken: string, notification: NotificationData) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          notification: {
            channelId: 'default',
            priority: 'high' as const,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.send(message);
      console.log('Push notification sent successfully:', response);
      return { success: true, messageId: response };
    } catch (error: any) {
      console.error('Error sending push notification:', error);
      
      // Manejo específico de errores de Firebase
      if (error.code === 'messaging/mismatched-credential') {
        console.error('❌ Firebase Cloud Messaging API not enabled. Please enable it at:');
        console.error(`https://console.developers.google.com/apis/api/fcm.googleapis.com/overview?project=${error.errorInfo?.message?.match(/project ([^\s]+)/)?.[1] || 'your-project'}`);
      } else if (error.code === 'messaging/registration-token-not-registered') {
        console.error('❌ FCM token is invalid or expired');
      } else if (error.code === 'messaging/invalid-argument') {
        console.error('❌ Invalid FCM token format');
      }
      
      throw error;
    }
  }

  static async sendMulticastNotification(fcmTokens: string[], notification: NotificationData): Promise<import('firebase-admin/messaging').BatchResponse> {
    try {
      const message = {
        tokens: fcmTokens,
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data || {},
        android: {
          notification: {
            channelId: 'default',
            priority: 'high' as const,
          },
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title: notification.title,
                body: notification.body,
              },
              sound: 'default',
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log('Multicast push notifications sent:', response);
      return response;
    } catch (error) {
      console.error('Error sending multicast push notifications:', error);
      throw error;
    }
  }
}