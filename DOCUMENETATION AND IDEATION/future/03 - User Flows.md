# 🔄 User Flows

> Complete user journey documentation for INNOVESTOR

---

## 🗺️ Overview

INNOVESTOR has three main user types, each with distinct flows:
1. **Founders** - Submit ideas, receive investment requests
2. **Investors** - Browse ideas, connect with founders  
3. **Admins** - Manage users, oversee platform

---

## 🚀 Founder Journey

### 1. Registration & Onboarding

```mermaid
flowchart TD
    A[Visit Landing] --> B[Click Get Started]
    B --> C[Select User Type: Founder]
    C --> D[Enter Email & Password]
    D --> E[Email Verification]
    E --> F[Profile Setup]
    F --> G{Profile Complete?}
    G -->|No| F
    G -->|Yes| H[Payment Page]
    H --> I{Payment Method}
    I -->|Coupon| J[Enter Coupon Code]
    I -->|Pay| K[Razorpay Checkout]
    J --> L{Valid?}
    L -->|Yes| M[Submit Idea]
    L -->|No| H
    K --> N{Success?}
    N -->|Yes| M
    N -->|No| H
    M --> O[Founder Dashboard]
```

### 2. Profile Setup Details

| Field | Required | Description |
|-------|----------|-------------|
| Full Name | ✅ | Display name |
| Phone | ✅ | Contact number |
| Date of Birth | ✅ | Verification |
| Education | ✅ | Background |
| Experience | ❌ | Work history |
| Current Job | ❌ | Current position |
| LinkedIn | ❌ | Professional profile |
| Avatar | ❌ | Profile picture |

### 3. Idea Submission (3 Steps)

**Step 1: Basic Details**
- Project Title
- Domain/Industry
- Investment Needed

**Step 2: Traction & Team**
- Current Stage
- Team Size
- Metrics/Traction

**Step 3: The Pitch**
- Full Description
- Google Drive Link (Pitch Deck)

### 4. Managing Connections

```mermaid
flowchart LR
    A[Receive Chat Request] --> B{Review Request}
    B -->|Accept| C[Start Chatting]
    B -->|Reject| D[Request Closed]
    C --> E[Exchange Messages]
    E --> F{Investment Discussion}
    F --> G[Record Investment]
    G --> H[Update Idea Status]
```

### 5. Dashboard Features
- 📊 View metrics (views, requests, investments)
- 💬 Manage chat requests (accept/reject)
- 📝 View and edit ideas
- 📌 Pin important conversations
- 👍👎 Rate investors

---

## 💼 Investor Journey

### 1. Registration & Onboarding

```mermaid
flowchart TD
    A[Visit Landing] --> B[Click Get Started]
    B --> C[Select User Type: Investor]
    C --> D[Enter Email & Password]
    D --> E[Email Verification]
    E --> F[Profile Setup - Investor]
    F --> G{Profile Complete?}
    G -->|No| F
    G -->|Yes| H[Investor Dashboard]
```

### 2. Profile Setup Details

| Field | Required | Description |
|-------|----------|-------------|
| Full Name | ✅ | Display name |
| Phone | ✅ | Contact number |
| Investment Capital | ✅ | Available funds |
| Interested Domains | ✅ | Preferred industries |
| Experience | ❌ | Investment history |
| LinkedIn | ❌ | Professional profile |
| Avatar | ❌ | Profile picture |

### 3. Browsing & Connecting

```mermaid
flowchart TD
    A[Enter Dashboard] --> B[Browse Ideas Feed]
    B --> C{Filter Options}
    C --> D[Filter by Domain]
    C --> E[Filter by Investment Range]
    D --> F[View Idea Details]
    E --> F
    F --> G{Interest Level}
    G -->|High| H[Send Chat Request]
    G -->|Medium| I[Add to Watchlist]
    G -->|Low| B
    H --> J[Wait for Founder Response]
    J --> K{Response}
    K -->|Accepted| L[Start Chatting]
    K -->|Rejected| B
```

### 4. Dashboard Features
- 🔍 Browse all available ideas
- 📋 View idea details and pitch decks
- 📨 Send connection requests
- 💬 Chat with accepted founders
- ⭐ Watchlist for tracking ideas
- 📊 View portfolio and analytics

---

## 🛡️ Admin Journey

### 1. Access Admin Portal

```mermaid
flowchart TD
    A[Navigate to /admin-innovestor] --> B{Admin Auth}
    B -->|Valid| C[Admin Dashboard]
    B -->|Invalid| D[Access Denied]
```

### 2. Admin Capabilities
- 👥 View all users (founders & investors)
- ✅ Approve/reject user profiles
- 💡 View all submitted ideas
- 📊 Platform analytics
- 💳 Payment records

---

## 🔐 Authentication Flow

### Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant D as Database
    
    U->>F: Enter credentials
    F->>S: signInWithPassword()
    S->>S: Validate
    alt Success
        S-->>F: Session + JWT
        F->>D: Fetch profile
        D-->>F: Profile data
        alt Founder
            F-->>U: Redirect to /founder-dashboard
        else Investor
            F-->>U: Redirect to /investor-dashboard
        end
    else Failure
        S-->>F: Error
        F-->>U: Show error message
    end
```

### Registration Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant S as Supabase Auth
    participant D as Database
    
    U->>F: Fill registration form
    F->>F: Validate with Zod
    F->>S: signUp()
    S->>S: Create auth user
    S-->>F: User created
    F-->>U: Redirect to profile setup
    U->>F: Complete profile
    F->>D: Insert profile
    D-->>F: Profile created
    alt Founder
        F-->>U: Redirect to payment
    else Investor
        F-->>U: Redirect to dashboard
    end
```

---

## 💬 Chat Flow

### Real-time Messaging

```mermaid
sequenceDiagram
    participant F as Founder
    participant FUI as Founder UI
    participant DB as Supabase
    participant IUI as Investor UI
    participant I as Investor
    
    F->>FUI: Open chat
    FUI->>DB: Subscribe to messages
    I->>IUI: Open same chat
    IUI->>DB: Subscribe to messages
    
    F->>FUI: Type message
    FUI->>DB: Insert message
    DB->>DB: Broadcast via Realtime
    DB-->>IUI: New message event
    IUI-->>I: Display message
    DB-->>FUI: Confirm sent
    FUI-->>F: Message appears
```

---

## 💳 Payment Flow

### Razorpay Checkout

```mermaid
flowchart TD
    A[Payment Page] --> B{Payment Method}
    B -->|Coupon| C[Enter Coupon]
    C --> D{Validate}
    D -->|Valid| E[Skip Payment]
    D -->|Invalid| A
    B -->|Pay| F[Create Razorpay Order]
    F --> G[Open Checkout Modal]
    G --> H{Complete Payment}
    H -->|Success| I[Verify Signature]
    I --> J[Record Payment]
    J --> K[Redirect to Submit Idea]
    H -->|Failed| L[Show Error]
    L --> A
    E --> K
```

---

## 🔗 Related Documents

- [[00 - Overview|Overview]]
- [[04 - Features|Features]]
- [[Founders/00 - Founder Hub|Founder Hub]]
- [[Investors/00 - Investor Hub|Investor Hub]]

---

*Last Updated: January 31, 2026*
