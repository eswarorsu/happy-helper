# Founder Dashboard Refactor Walkthrough

## 🎯 Goal
Refactor the `FounderDashboard` to use the new responsive `DashboardLayout`, enabling optimal viewing on mobile devices while maintaining desktop functionality.

## 🏗️ Changes Implemented

### 1. Integration of `DashboardLayout`
- Replaced the custom `div` and `motion.header` wrappers with the standardized `DashboardLayout`.
- Configured `DashboardLayout` with user profile data (`userType`, `userName`, etc.).
- Added `disableContentPadding={!!selectedChat}` to allow the chat panel to utilize full screen width when active.

### 2. Sidebar (Connections) Refactor
- **Removal of Legacy State**: Removed `isSidebarOpen` state. The outer `DashboardLayout` now handles the application-level sidebar.
- **Internal Sidebar**: converted the "Connections" list into a responsive `aside` element.
    - **Desktop**: Always visible as a list (`w-80`).
    - **Mobile**: Hidden by default. Becomes **fullscreen fixed** when the "Messages" tab is active (via URL param `?tab=messages`).

### 3. Main Content Responsiveness
- Main content area now automatically hides on mobile when the "Messages" tab is active or a Chat is selected, ensuring the user focuses on the active context.
- Added smooth transitions for desktop resizing when the Chat Panel opens (`lg:mr-[400px]`).

### 4. Chat Panel Responsiveness
- **Desktop**: Fixed right panel (`w-[400px]`), resizeable.
- **Mobile**: Full-screen overlay (`fixed inset-0 z-50`) when a chat is selected.
- Updated styling to ensure it sits correctly on top of or below the header depending on the device.

### 5. Code Cleanup
- Removed unused keyboard shortcuts (Sidebar toggle).
- Fixed JSX structure and lint errors.
- Standardized imports.

## 🔍 Verification Steps

### Desktop
1.  **Navigation**: Verify the global sidebar (left) works.
2.  **Connections**: Ensure the "Connections" list is visible next to the main content.
3.  **Chat**: Click a connection. Ensure the Chat Panel opens on the right.
4.  **Resizing**: Drag the Chat Panel handle to resize it.

### Mobile
1.  **Menu**: Open the mobile menu (hamburger) from `DashboardLayout`.
2.  **Tabs**: Use the bottom bar (if available) or navigation to switch to "Messages".
3.  **Connections View**: The "Connections" list should take up the full screen.
4.  **Chat View**: Tap a connection. The Chat Window should take up the full screen (z-index 50).
5.  **Back Navigation**: Closing the chat should return to the Connections list (or Dashboard).

## 📸 visual Reference
(Screenshots to be added after visual verification)
