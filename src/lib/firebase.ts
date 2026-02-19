import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, push, set, onValue, off, serverTimestamp, update, DataSnapshot, query, orderByChild, equalTo, get } from "firebase/database";
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

// ============================================================================
// SECURITY: Firebase config loaded from environment variables (OWASP A02:2021)
//
// Firebase client-side API keys are NOT secret (they identify the project, not
// authenticate privileged access), but keeping them in .env:
//   1. Prevents accidental git commits of hard-coded credentials.
//   2. Allows per-environment config (dev / staging / prod) without code changes.
//   3. Satisfies audit requirements for "no hard-coded keys in source".
//
// Required VITE_ env vars (add to .env, never commit to git):
//   VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN,
//   VITE_FIREBASE_DATABASE_URL, VITE_FIREBASE_PROJECT_ID,
//   VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID,
//   VITE_FIREBASE_APP_ID
// ============================================================================
const {
  VITE_FIREBASE_API_KEY,
  VITE_FIREBASE_AUTH_DOMAIN,
  VITE_FIREBASE_DATABASE_URL,
  VITE_FIREBASE_PROJECT_ID,
  VITE_FIREBASE_STORAGE_BUCKET,
  VITE_FIREBASE_MESSAGING_SENDER_ID,
  VITE_FIREBASE_APP_ID,
} = import.meta.env;

// Fail loudly in development if vars are missing; silently degrade in prod
// so a mis-configuration doesn't white-screen non-chat features.
const REQUIRED_FIREBASE_VARS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_DATABASE_URL",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];
const missingFirebaseVars = REQUIRED_FIREBASE_VARS.filter(
  (k) => !import.meta.env[k]
);
if (missingFirebaseVars.length > 0) {
  console.warn(
    `⚠️ Firebase: missing env vars – ${missingFirebaseVars.join(", ")}. Chat will be unavailable.`
  );
}

const firebaseConfig = {
  apiKey:            VITE_FIREBASE_API_KEY,
  authDomain:        VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL:       VITE_FIREBASE_DATABASE_URL,
  projectId:         VITE_FIREBASE_PROJECT_ID,
  storageBucket:     VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
export const storage = getStorage(app);

export const connectFirebase = async (): Promise<void> => {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth);
      console.log("Firebase: Signed in anonymously");
    }
  } catch (error) {
    console.error("Firebase: Auth error", error);
    throw error;
  }
};

export interface Message {
  id?: string;
  sender_id: string;
  content: string;
  created_at: number | object;
  is_read: boolean;
  type?: 'text' | 'attachment' | 'image';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export const sendMessage = async (chatId: string, message: Omit<Message, 'id' | 'created_at' | 'is_read'>) => {
  try {
    const messagesRef = ref(db, `chats/${chatId}/messages`);
    const newMessageRef = push(messagesRef);
    await set(newMessageRef, {
      ...message,
      created_at: serverTimestamp(),
      is_read: false
    });
    console.log("Firebase: Message sent successfully", newMessageRef.key);
    return newMessageRef.key;
  } catch (error) {
    console.error("Firebase: Error sending message", error);
    throw error;
  }
};

export const subscribeToChat = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  console.log("Firebase: Subscribing to chat", chatId);

  const listener = onValue(messagesRef, (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    const messages: Message[] = [];
    if (data) {
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        messages.push({
          id: key,
          ...value
        });
      });
    }
    // Sort by timestamp
    messages.sort((a, b) => {
      const timeA = typeof a.created_at === 'number' ? a.created_at : 0;
      const timeB = typeof b.created_at === 'number' ? b.created_at : 0;
      return timeA - timeB;
    });
    console.log("Firebase: Received", messages.length, "messages for chat", chatId);
    callback(messages);
  }, (error) => {
    console.error("Firebase: Subscription error for chat", chatId, error);
  });

  return () => {
    console.log("Firebase: Unsubscribing from chat", chatId);
    off(messagesRef, 'value', listener);
  };
};

export const markMessageAsRead = async (chatId: string, messageId: string) => {
  const msgRef = ref(db, `chats/${chatId}/messages/${messageId}`);
  await update(msgRef, { is_read: true });
};

export const getUnreadCount = async (chatId: string, currentUserId: string): Promise<number> => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);

  try {
    const snapshot = await get(messagesRef);

    if (!snapshot.exists()) return 0;

    let count = 0;
    snapshot.forEach((child) => {
      const msg = child.val();
      // Count messages that are unread AND not sent by the current user
      if (msg.is_read === false && msg.sender_id !== currentUserId) {
        count++;
      }
    });
    return count;
  } catch (error) {
    console.error("Error getting unread count:", error);
    return 0;
  }
};

// Subscribe to unread message count changes in real-time
export const subscribeToUnreadCount = (
  chatId: string,
  currentUserId: string,
  callback: (count: number, lastMessage?: any) => void
) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);

  console.log(`[Firebase] Setting up unread count subscription for chat ${chatId}, userId: ${currentUserId}`);

  const listener = onValue(messagesRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      console.log(`[Firebase] No messages in chat ${chatId}`);
      callback(0);
      return;
    }

    let count = 0;
    const allMessages: any[] = [];
    snapshot.forEach((child) => {
      const msg = child.val();
      allMessages.push({ id: child.key, ...msg });
      if (msg.is_read === false && msg.sender_id !== currentUserId) {
        count++;
      }
    });

    const lastMessage = allMessages.length > 0 ? allMessages[allMessages.length - 1] : undefined;

    console.log(`[Firebase] Unread count for chat ${chatId}:`, {
      totalMessages: allMessages.length,
      unreadCount: count,
      lastMessageContent: lastMessage?.content
    });

    callback(count, lastMessage);
  });

  return () => {
    console.log(`[Firebase] Unsubscribing from chat ${chatId}`);
    off(messagesRef, 'value', listener);
  };
};

// Upload file to Firebase Storage
export const uploadPaymentProof = async (
  file: File,
  chatRequestId: string,
  type: 'investment' | 'profit'
): Promise<string> => {
  try {
    // Ensure user is authenticated
    if (!auth.currentUser) {
      await signInAnonymously(auth);
    }

    // Create unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `payment-proofs/${chatRequestId}/${type}_${timestamp}.${extension}`;

    // Upload to Firebase Storage
    const fileRef = storageRef(storage, fileName);
    const snapshot = await uploadBytes(fileRef, file, {
      contentType: file.type,
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log(`[Firebase Storage] File uploaded: ${downloadUrl}`);

    return downloadUrl;
  } catch (error) {
    console.error("[Firebase Storage] Upload error:", error);
    throw error;
  }
};
