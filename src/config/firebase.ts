import * as admin from 'firebase-admin';
import dotenv from 'dotenv';

dotenv.config();

if (!admin.apps.length) {
  const serviceAccountBase64 = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;

  if (serviceAccountBase64) {
    try {
      const jsonString = Buffer.from(serviceAccountBase64, 'base64').toString('utf8');
      const credentials = JSON.parse(jsonString);
      admin.initializeApp({
        credential: admin.credential.cert(credentials),
      });
    } catch (err) {
      console.error('Error parsing FIREBASE_SERVICE_ACCOUNT_BASE64:', err);
    }
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp();
  } else {
    console.warn('Firebase Admin not initialized: missing credentials. Set FIREBASE_SERVICE_ACCOUNT_BASE64 in your .env');
  }
}

export const messaging = admin.messaging();
export default admin;
