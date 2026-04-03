import admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

// The service account JSON can be provided as a base64 string in env or individual vars.
// Prefer a single BASE64 json to keep env clean.
const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

if (!admin.apps.length) {
  if (serviceAccountBase64) {
    try {
      const jsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const credentials = JSON.parse(jsonString);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_BASE64', err);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // firebase-admin will pick credentials automatically
    admin.initializeApp();
  } else {
    console.warn('Firebase Admin not initialized: missing credentials');
  }
}

export interface FCMNotificationPayload {
  title: string;
  body: string;
  imageUrl?: string;
  data?: Record<string, string>;
}

export class FirebaseNotificationProvider {
  static async sendToToken(token: string, payload: FCMNotificationPayload) {
    if (!admin.apps.length) throw new Error('Firebase Admin no inicializado');
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
    };
    return admin.messaging().send(message);
  }

  static async sendToTokens(tokens: string[], payload: FCMNotificationPayload): Promise<admin.messaging.BatchResponse> {
    if (!admin.apps.length) throw new Error('Firebase Admin no inicializado');
    if (tokens.length === 0) return { successCount: 0, failureCount: 0, responses: [] };
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
    };
    return admin.messaging().sendEachForMulticast(message);
  }

  static async sendToTopic(topic: string, payload: FCMNotificationPayload) {
    if (!admin.apps.length) throw new Error('Firebase Admin no inicializado');
    const message: admin.messaging.Message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.imageUrl,
      },
      data: payload.data,
    };
    return admin.messaging().send(message);
  }
}
