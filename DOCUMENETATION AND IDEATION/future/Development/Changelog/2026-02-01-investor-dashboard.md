# 📋 Changelog

> Recent development changes for INNOVESTOR

---

## February 2026

### 2026-02-01 - MVP Investor Dashboard Redesign

**Type**: Feature Addition

**Summary**: Built a clarity-focused startup idea card system for investors.

#### New Files Created

| File | Purpose |
|------|---------|
| `src/types/investor.ts` | TypeScript types & utilities (IdeaWithFounder, FounderProfile, formatCurrency) |
| `src/components/investor/IdeaCard.tsx` | Minimal list-view card, no background colors |
| `src/components/investor/FounderProfile.tsx` | Founder info display (name, role, education, LinkedIn) |
| `src/components/investor/FinancialSummary.tsx` | Financial data with bar chart (Recharts) |
| `src/pages/IdeaDetailPage.tsx` | Scrollable detail page: Problem → Solution → Market → Financials → Founder → Links |

#### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Added route `/idea/:id` for detail page |

#### Design Decisions

- **No background colors** on idea cards (per requirements)
- **Trending domain badges** for AI, FinTech, HealthTech, SaaS, EV, EdTech
- **Stage mapping**: pending/approved → "Idea Stage", in_progress → "Early Stage", funded → "Running"
- **Financials**: Bar chart with Recharts, shows Target/Raised/Invested/Profits
- **Scrollable order**: Problem → Solution → Market → Business Model → Financials → Founder → External Links

#### Assumptions

- Profits data mocked (not in database)
- Business model extracted from description or placeholder

---

## Links

- [[00 - Overview|Project Overview]]
- [[04 - Features|Features]]
- [[Development/02 - API Reference|API Reference]]

---

*Last Updated: February 1, 2026*
