# 📡 API Reference

> Backend integrations and API documentation

---

## 🗄️ Supabase Client

### Setup
```typescript
// src/integrations/supabase/client.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)
```

---

## 🔐 Authentication

### Sign Up
```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password
})
```

### Sign In
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
})
```

### Sign Out
```typescript
await supabase.auth.signOut()
```

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser()
```

---

## 📋 Profiles

### Get Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', userId)
  .single()
```

### Create Profile
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    user_id: userId,
    user_type: 'founder',
    name: name,
    email: email,
    // ... other fields
  })
```

### Update Profile
```typescript
const { error } = await supabase
  .from('profiles')
  .update({ name: newName })
  .eq('id', profileId)
```

---

## 💡 Ideas

### Get All Ideas (for Investors)
```typescript
const { data, error } = await supabase
  .from('ideas')
  .select(`
    *,
    founder:profiles(name)
  `)
  .order('created_at', { ascending: false })
```

### Get Founder's Ideas
```typescript
const { data, error } = await supabase
  .from('ideas')
  .select('*')
  .eq('founder_id', founderId)
```

### Submit Idea
```typescript
const { data, error } = await supabase
  .from('ideas')
  .insert({
    founder_id: founderId,
    title: title,
    description: description,
    domain: domain,
    investment_needed: amount,
    media_url: driveLink
  })
```

---

## 💬 Chat Requests

### Get Requests
```typescript
const { data, error } = await supabase
  .from('chat_requests')
  .select(`
    *,
    investor:profiles!investor_id(id, name, avatar_url),
    idea:ideas(title)
  `)
  .eq('founder_id', founderId)
```

### Create Request
```typescript
const { error } = await supabase
  .from('chat_requests')
  .insert({
    idea_id: ideaId,
    investor_id: investorId,
    founder_id: founderId,
    status: 'pending'
  })
```

### Update Request Status
```typescript
const { error } = await supabase
  .from('chat_requests')
  .update({ status: 'accepted' })
  .eq('id', requestId)
```

---

## 📨 Messages

### Get Messages
```typescript
const { data, error } = await supabase
  .from('messages')
  .select('*')
  .eq('chat_request_id', chatId)
  .order('created_at', { ascending: true })
```

### Send Message
```typescript
const { error } = await supabase
  .from('messages')
  .insert({
    chat_request_id: chatId,
    sender_id: senderId,
    content: message
  })
```

### Subscribe to Messages (Realtime)
```typescript
const channel = supabase
  .channel('messages')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `chat_request_id=eq.${chatId}`
    },
    (payload) => {
      // Handle new message
    }
  )
  .subscribe()
```

---

## 💳 Payments

### Record Payment
```typescript
const { error } = await supabase
  .from('payments')
  .insert({
    user_id: profileId,
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
    amount: 99,
    currency: 'INR',
    status: 'paid'
  })
```

---

## 📊 Investment Records

### Record Investment
```typescript
const { error } = await supabase
  .from('investment_records')
  .insert({
    idea_id: ideaId,
    investor_id: investorId,
    founder_id: founderId,
    chat_request_id: chatId,
    amount: amount,
    payment_method: method,
    notes: notes
  })
```

---

## 🔗 Related Documents

- [[../02 - Database Schema|Database Schema]]
- [[00 - Dev Setup|Dev Setup]]
- [[01 - Component Library|Component Library]]

---

*Last Updated: January 31, 2026*
