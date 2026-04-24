import { cert, getApps, initializeApp, App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function createAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];

  // Use explicit service account secret for local development
  if (process.env.NODE_ENV === "development") {
    return initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
  }

  // Firebase App Hosting automatically injects Admin credentials via ADC
  return initializeApp({
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export function getAdminApp(): App {
  return createAdminApp();
}

export function getAdminDb() {
  return getFirestore(createAdminApp());
}

export function getAdminStorage() {
  return getStorage(createAdminApp());
}
