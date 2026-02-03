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
  type?: 'text' | 'attachment';
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
  callback: (count: number) => void
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
    
    console.log(`[Firebase] Unread count for chat ${chatId}:`, {
      totalMessages: allMessages.length,
      unreadCount: count,
      currentUserId,
      messages: allMessages.map(m => ({
        id: m.id,
        sender: m.sender_id,
        isRead: m.is_read,
        content: m.content?.substring(0, 20)
      }))
    });
    
    callback(count);
  });

  return () => {
    console.log(`[Firebase] Unsubscribing from chat ${chatId}`);
    off(messagesRef, 'value', listener);
  };
};
