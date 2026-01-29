import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getDatabase, ref, push, set, onValue, off, serverTimestamp, update, DataSnapshot, query, orderByChild, equalTo, get } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAdpp7QV2sd9U0aTzkPuuviMrdSggcb3zE",
  authDomain: "innovestor-fa784.firebaseapp.com",
  databaseURL:
    "https://innovestor-fa784-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "innovestor-fa784",
  storageBucket: "innovestor-fa784.firebasestorage.app",
  messagingSenderId: "919426530586",
  appId: "1:919426530586:web:ed2116dfc83e0c2b1180a3",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);

export const connectFirebase = async (): Promise<void> => {
  if (!auth.currentUser) {
    await signInAnonymously(auth);
  }
};

export interface Message {
  id?: string;
  sender_id: string;
  content: string;
  created_at: number | object;
  is_read: boolean;
  type?: 'text' | 'attachment';
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

export const sendMessage = async (chatId: string, message: Omit<Message, 'id' | 'created_at' | 'is_read'>) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  const newMessageRef = push(messagesRef);
  await set(newMessageRef, {
    ...message,
    created_at: serverTimestamp(),
    is_read: false
  });
  return newMessageRef.key;
};

export const subscribeToChat = (chatId: string, callback: (messages: Message[]) => void) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
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
    callback(messages);
  });
  return () => off(messagesRef, 'value', listener);
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
  callback: (count: number) => void
) => {
  const messagesRef = ref(db, `chats/${chatId}/messages`);
  
  const listener = onValue(messagesRef, (snapshot: DataSnapshot) => {
    if (!snapshot.exists()) {
      callback(0);
      return;
    }

    let count = 0;
    snapshot.forEach((child) => {
      const msg = child.val();
      if (msg.is_read === false && msg.sender_id !== currentUserId) {
        count++;
      }
    });
    callback(count);
  });

  return () => off(messagesRef, 'value', listener);
};
