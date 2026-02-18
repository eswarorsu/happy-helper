# INNOVESTOR — Complete Redesign Implementation Plan

## Logo Reference
The logo is a bold **"in"** lettermark on a vivid yellow (`#F5C518`) background with deep charcoal (`#333333`) type. All design decisions derive from this.

---

## Design System Spec (applies to EVERY page)

| Token | Value | Usage |
|---|---|---|
| `--brand-yellow` | `#EFBF04` / `hsl(48, 97%, 47%)` | Hero sections, dividers, emphasis bands, icon highlights |
| `--brand-charcoal` | `#2B2B2B` / `hsl(0, 0%, 17%)` | Primary text, icons, primary buttons bg |
| `--bg-page` | `#FAFAF5` / `hsl(60, 33%, 97%)` | Default page backgrounds (off-yellow, near-white) |
| `--bg-card` | `#FFFFFF` | Cards, modals, popovers |
| `--bg-hero` | `#EFBF04` | Full yellow hero bands |
| `--text-primary` | `#2B2B2B` | Headings, body text |
| `--text-muted` | `#6B6B6B` | Secondary text, captions |
| `--border` | `#E5E0D5` | Card borders, dividers |
| `--font` | `'Inter', sans-serif` | ONE font, no serif fallback |
| `--radius` | `4px – 6px` | Sharp corners, slightly rounded |
| Primary Button | bg: charcoal, text: yellow, hover: invert (bg yellow, text charcoal) |
| Secondary Button | Outlined charcoal on light bg, outlined yellow on dark bg |
| Animations | GSAP only — fade, slide, underline-on-hover. No framer-motion. |

---

## Phase 0: Foundation (Global Design System)
*Everything below must pass `npm run build` before moving on.*

### Checklist 0.1 — CSS Variables & Tailwind Config
- [ ] Rewrite `:root` variables in `src/index.css` to match spec above
- [ ] Update `.dark` theme variables to match (charcoal bg, yellow accents)
- [ ] Update `tailwind.config.ts`: add `brand-yellow`, `brand-charcoal` colors, set font to Inter only, set radius to 4px
- [ ] Remove `Playfair Display` from tailwind font config
- [ ] Update sidebar CSS variables to match new palette

### Checklist 0.2 — Purge Old Utilities from index.css
- [ ] Replace all indigo/purple `rgba(99, 102, 241, ...)` with yellow equivalents
- [ ] Rewrite `.text-glow` → yellow glow
- [ ] Rewrite `.glass-card:hover` border-color → yellow
- [ ] Rewrite `.hover-glow` → yellow glow
- [ ] Rewrite `.bg-mesh-indigo` → yellow mesh
- [ ] Rewrite `.bg-mesh-dark` → charcoal + yellow mesh
- [ ] Rewrite `.gradient-cta` → charcoal bg, yellow text (no gradient)
- [ ] Rewrite `.gradient-border::before` → yellow gradient
- [ ] Rewrite `.text-glow-indigo`, `.text-glow-purple` → `.text-glow-yellow`
- [ ] Rewrite `.text-3d` → yellow/charcoal shadows
- [ ] Remove `App.css` boilerplate colors or delete file if unused

### Checklist 0.3 — Button Component Reskin
- [ ] Update `src/components/ui/button.tsx` default variant: bg-charcoal, text-yellow, hover:invert
- [ ] Update outline variant: border-charcoal on light, border-yellow on dark
- [ ] Set border-radius to `rounded` (4-6px) instead of `rounded-full` or `rounded-md`
- [ ] Remove any gradient button styles

### Checklist 0.4 — Install & Verify GSAP
- [ ] Confirm `gsap` is in package.json ✅ (already done)
- [ ] Create `src/lib/gsap.ts` — central GSAP config with ScrollTrigger registration
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 0**: Document all variable changes. Confirm build passes.

---

## Phase 1: Landing Page (Full Redesign)
*The flagship page — 1154 lines. Complete rewrite of styling.*

### Checklist 1.1 — Remove Framer Motion, Add GSAP
- [ ] Remove `motion` import (already removed, but `<motion.div>` still used 20+ times)
- [ ] Replace ALL `<motion.div>`, `<motion.h1>`, `<motion.p>`, `<motion.a>` with plain `<div>`, `<h1>`, `<p>`, `<a>` + GSAP `useGSAP` refs
- [ ] Replace `initial/animate/transition` props with GSAP `gsap.from()` in `useEffect` or `useGSAP`
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 1.2 — Replace Inline Color Tokens
- [ ] Delete the local `colors` object (lines 17-33)
- [ ] Replace ALL `style={{ color: colors.xxx }}` with Tailwind classes using new tokens
- [ ] Replace ALL `style={{ background: colors.xxx }}` with Tailwind bg classes
- [ ] Replace ALL hardcoded hex colors (`#6366F1`, `#4F46E5`, `#818CF8`, `#A5B4FC`, `#0F172A`, `#1E293B`, etc.) with CSS variable classes
- [ ] Remove `fontFamily: "'Playfair Display', serif"` from ALL inline styles (12+ places)
- [ ] Use `font-sans font-bold` for headings instead
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 1.3 — Navbar Reskin
- [ ] Logo: use `/logo.jpeg` image ✅ (already done)
- [ ] Nav background: charcoal when scrolled, transparent on hero
- [ ] Nav links: white on dark hero, charcoal on scrolled. Underline-on-hover (GSAP)
- [ ] Primary CTA ("Join for free"): charcoal bg + yellow text, hover: yellow bg + charcoal text
- [ ] Remove `rounded-full` from nav pill container
- [ ] Mobile menu: charcoal bg, yellow accent links

### Checklist 1.4 — Hero Section Reskin
- [ ] Hero band: full vivid yellow background (`--brand-yellow`)
- [ ] Hero text: deep charcoal, Inter bold, no serif
- [ ] Hero badge: charcoal bg, yellow text (not indigo/purple)
- [ ] CTA buttons: primary = charcoal+yellow, secondary = outlined charcoal
- [ ] Simplify 3D scene colors in `Hero3D.tsx` to yellow/charcoal palette
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 1.5 — Content Sections Reskin
- [ ] "How it works" → off-yellow bg, charcoal steps, yellow icon containers
- [ ] "Features" → white bg, charcoal cards with yellow accent lines
- [ ] "For Founders / For Investors" → alternating yellow band / white band
- [ ] Stats section → charcoal bg, yellow numbers
- [ ] Testimonials → charcoal cards, yellow quote marks
- [ ] College marquee → off-yellow bg, charcoal text
- [ ] FAQ → white bg, charcoal accordion, yellow expand icon
- [ ] Footer → charcoal bg, yellow logo/accents, muted text

### Checklist 1.6 — GSAP Scroll Animations
- [ ] Replace `useScrollReveal` (IntersectionObserver) with GSAP `ScrollTrigger`
- [ ] Add fade-up on all section entries
- [ ] Add slide-in for cards
- [ ] Add counter animation via GSAP (replace manual setInterval)
- [ ] Add marquee via GSAP instead of CSS animation
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 1**: Landing page fully reskinned. Screenshots/description of changes. Build status.

---

## Phase 2: Auth & Profile Pages

### Checklist 2.1 — Auth.tsx
- [ ] Update gradient backgrounds to yellow/charcoal
- [ ] Buttons: charcoal primary, yellow text
- [ ] Input borders: `--border` token
- [ ] Social login buttons: outlined charcoal
- [ ] Logo in auth header
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 2.2 — ProfileSetup.tsx
- [ ] Replace `from-indigo-600 to-purple-600` gradient with charcoal/yellow
- [ ] Step indicators: yellow active, charcoal inactive
- [ ] Form inputs: border-`--border`, focus-ring yellow
- [ ] Buttons: charcoal primary
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 2.3 — Profile.tsx
- [ ] Replace ALL hardcoded hex colors (`#FAF7F2`, `#E5E7EB`, `#111827`, `#6B7280`, `#1F2937`, `#6366F1`, `#818CF8`)
- [ ] Profile header: yellow accent band
- [ ] LinkedIn button: keep brand blue, everything else charcoal/yellow
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 2**: Auth flow fully themed. Build status.

---

## Phase 3: Dashboard Pages

### Checklist 3.1 — FounderDashboard.tsx (1709 lines)
- [ ] Replace `framer-motion` animations with GSAP
- [ ] Replace all hardcoded colors/shadows with CSS variable equivalents
- [ ] Dashboard header: charcoal bg, yellow logo/accent
- [ ] Sidebar/nav: charcoal bg, yellow active indicator
- [ ] Cards: white bg, charcoal text, yellow metric highlights
- [ ] Charts (recharts): yellow/charcoal palette
- [ ] Notification badges: yellow bg, charcoal text
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 3.2 — InvestorDashboard.tsx (1343 lines)
- [ ] Replace `COLORS` array (indigo palette) with `["#EFBF04", "#2B2B2B", "#D4A904", "#6B6B6B"]`
- [ ] Replace `framer-motion` with GSAP
- [ ] Same card/nav/header theming as Founder
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 3.3 — Shared Dashboard Components
- [ ] `InvestorSidebar.tsx`: charcoal bg, yellow active state, brand logo
- [ ] `MobileNav.tsx`: replace all `#E5E7EB`, `#1F2937`, `#6B7280`, `#4B5563`, `#111827`, `#FAF7F2` with CSS vars
- [ ] `ActivityTimerBadge.tsx`: replace hardcoded colors
- [ ] `WeeklyLogSheet.tsx`: replace `framer-motion`, fix colors
- [ ] `ChatBox.tsx`: replace `#FAF7F2`, framer-motion → GSAP
- [ ] `AnimatedGridBackground.tsx`: recolor to yellow/charcoal mesh, replace framer-motion
- [ ] `ProfileViewModal.tsx`: replace hardcoded colors
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 3**: Both dashboards themed. Build status.

---

## Phase 4: Deal & Marketplace Pages

### Checklist 4.1 — Marketplace.tsx
- [ ] Replace `framer-motion` with GSAP
- [ ] Card grid: white cards, charcoal text, yellow badges/categories
- [ ] Search/filter bar: charcoal input borders, yellow active filters
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 4.2 — IdeaDetailPage.tsx
- [ ] Replace `framer-motion` with GSAP
- [ ] Hero/header: yellow accent band at top
- [ ] Investment CTA button: charcoal bg + yellow text
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 4.3 — DealCenter.tsx (1485 lines)
- [ ] Replace `framer-motion` with GSAP
- [ ] Chat interface: charcoal header, yellow sent-message accent
- [ ] Deal status badges: yellow for active, muted for inactive
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 4.4 — DealCenterIndex.tsx
- [ ] Replace `framer-motion` with GSAP
- [ ] Remove remaining debug code
- [ ] Replace `#FAF7F2`, indigo/purple gradients with charcoal/yellow
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 4.5 — SubmitIdea.tsx
- [ ] Form inputs: consistent border/focus theming
- [ ] Submit button: charcoal + yellow
- [ ] Progress steps: yellow active
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 4**: Deal flow themed. Build status.

---

## Phase 5: Financial & Transaction Pages

### Checklist 5.1 — Payment.tsx
- [ ] Replace ALL hardcoded hex colors (`#FAF7F2`, `#E5E7EB`, `#FDFCFA`, `#6366F1`, `#818CF8`, `#4F46E5`, `#111827`, `#1F2937`, `#0f172a`)
- [ ] QR/UPI section: charcoal card, yellow amount highlight
- [ ] Payment status badges: yellow for pending, green for success
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 5.2 — Transactions.tsx
- [ ] Replace `framer-motion` with GSAP
- [ ] Replace `#FAF7F2`, `#E5E7EB`, `#111827`, `#6B7280`, `#1F2937` with CSS vars
- [ ] Transaction table: white bg, charcoal text, yellow status badges
- [ ] Header: charcoal with yellow accent
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 5.3 — TestPayment.tsx
- [ ] Update `bg-slate-50`, `text-slate-900`, `text-slate-500` to themed equivalents
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 5.4 — PaymentQR.tsx Component
- [ ] Replace `#E5E7EB`, `#1F2937`, `#FAF7F2` with CSS vars
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 5.5 — Investor Financial Components
- [ ] `FinancialSummary.tsx`: Replace chart colors to `["#EFBF04", "#2B2B2B", "#D4A904", "#6B6B6B"]`. Replace axis/grid colors.
- [ ] `FounderProfile.tsx`: Replace `#E5E7EB`, `#1F2937`
- [ ] `IdeaCard.tsx`: Replace `#E5E7EB`, `#1F2937`
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 5**: Financial pages themed. Build status.

---

## Phase 6: Legal & Static Pages

### Checklist 6.1 — PrivacyPolicy.tsx
- [ ] Replace hero gradient (`from-primary to-blue-600`) with charcoal bg + yellow accent
- [ ] Replace `#FAF7F2`, `#E5E7EB`, `#111827`, `#6B7280`, `#1F2937`
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 6.2 — TermsAndConditions.tsx
- [ ] Replace hero gradient (`from-indigo-600 to-purple-600`) with same charcoal/yellow hero
- [ ] Replace all hardcoded hex
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 6.3 — RefundPolicy.tsx
- [ ] Replace hero gradient (`from-emerald-600 to-teal-600`) with same charcoal/yellow hero
- [ ] Replace all hardcoded hex
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 6.4 — NotFound.tsx
- [ ] Replace `#FAF7F2`, `#111827`, `#6B7280`, `#6366F1`, `#818CF8`, `#4F46E5`
- [ ] 404 page: yellow number, charcoal text, charcoal CTA button
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 6**: All static/legal pages consistent. Build status.

---

## Phase 7: Admin Portal

### Checklist 7.1 — AdminPortal.tsx (849 lines)
- [ ] Replace `framer-motion` with GSAP
- [ ] Admin sidebar: charcoal bg, yellow active state
- [ ] Data tables: white bg, charcoal borders
- [ ] Action buttons: charcoal+yellow
- [ ] Chart colors: yellow/charcoal palette
- [ ] **BUILD CHECK**: `npm run build`

**REPORT 7**: Admin portal themed. Build status.

---

## Phase 8: Final Cleanup & Verification

### Checklist 8.1 — Remove framer-motion Entirely
- [ ] Verify 0 imports of `framer-motion` remain across all files
- [ ] Remove `framer-motion` from `package.json` dependencies
- [ ] Run `npm install` to clean lockfile
- [ ] **BUILD CHECK**: `npm run build`

### Checklist 8.2 — Remove Unused CSS
- [ ] Delete `src/App.css` if confirmed unused
- [ ] Remove any unused keyframe animations
- [ ] Verify no hardcoded hex colors remain (grep for `#F`, `#0`, `#1`, `#6`, `#8`, `#A`, `#C`, `#E` across src/)

### Checklist 8.3 — Final Consistency Audit
- [ ] Every page uses only CSS variable-based colors via Tailwind
- [ ] Every page uses Inter font only
- [ ] Every button follows charcoal/yellow pattern
- [ ] Every hero section has consistent styling
- [ ] No framer-motion references remain
- [ ] All GSAP animations are functional
- [ ] **FINAL BUILD CHECK**: `npm run build`

**FINAL REPORT**: Complete summary of all changes across all phases. Files modified count. Before/after design system. Build status green.

---

## Execution Rules
1. **Each checklist item is atomic** — do it, verify, move on
2. **`npm run build` after every checklist group** — if it fails, fix before proceeding
3. **After each Phase completion** — produce a numbered report summarizing changes
4. **Zero backend changes** — only CSS, components, styling, theme files
5. **One font (Inter), two colors (yellow + charcoal), sharp corners, no gradients**
