# 🧩 Component Library

> UI component documentation for INNOVESTOR

---

## 📋 Overview

INNOVESTOR uses **shadcn/ui** as its component library, built on **Radix UI** primitives with **Tailwind CSS** styling.

---

## 📁 Component Structure

```
src/components/
├── ui/                     # shadcn/ui components (49)
│   ├── accordion.tsx
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── progress.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── sheet.tsx
│   ├── skeleton.tsx
│   ├── sonner.tsx
│   ├── tabs.tsx
│   ├── textarea.tsx
│   ├── toast.tsx
│   ├── toaster.tsx
│   ├── tooltip.tsx
│   └── ... (more components)
├── cursor/                 # Custom cursor effects
├── AnimatedGridBackground.tsx
├── ChatBox.tsx
└── NavLink.tsx
```

---

## 🎨 Key Components

### Button
```tsx
import { Button } from "@/components/ui/button";

// Variants: default, destructive, outline, secondary, ghost, link
<Button variant="default">Click Me</Button>
```

### Card
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>
```

### Dialog
```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Modal Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
  </DialogContent>
</Dialog>
```

### Input with Form
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```

---

## 🔧 Custom Components

### ChatBox
Real-time chat component with:
- Message list with scroll
- Input field with send button
- Typing indicators
- Read receipts

**Location**: `src/components/ChatBox.tsx`

### AnimatedGridBackground
Interactive particle grid background:
- Glowing grid lines
- Cursor-reactive particles
- Animated hover effects

**Location**: `src/components/AnimatedGridBackground.tsx`

### NavLink
Navigation link component for consistent routing.

**Location**: `src/components/NavLink.tsx`

---

## 🎭 Animation System

Using **Framer Motion** for animations:

```tsx
import { motion } from "framer-motion";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

<motion.div
  variants={containerVariants}
  initial="hidden"
  animate="visible"
>
  {children}
</motion.div>
```

---

## 🔗 Related Documents

- [[../01 - Architecture Overview|Architecture]]
- [[00 - Dev Setup|Dev Setup]]
- [[02 - API Reference|API Reference]]

---

*Last Updated: January 31, 2026*
