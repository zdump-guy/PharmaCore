# Gamification Engine & Division Leagues (`docs/gamification_engine.md`)

## 1. Overview
The PharmaCore Gamification Engine is an automated motivation and progress tracking framework designed for clinical pharmacy students. It computes earned Experience Points (XP), assigns students to progressive **Division Leagues**, calculates learning streaks, renders animated circular SVG meters, and constructs multi-scope leaderboards.

---

## 2. Division Leagues & Tier Progression

The platform features a 5-tier Division League system:

| Division Tier | Badge / Theme | Minimum XP | Maximum XP | Next Tier Target |
| :--- | :--- | :--- | :--- | :--- |
| **Bronze** | Amber / Copper Shield | 0 XP | 499 XP | 500 XP (Silver) |
| **Silver** | Slate / Polished Silver | 500 XP | 1,499 XP | 1,500 XP (Gold) |
| **Gold** | Warm Gold Crown | 1,500 XP | 3,499 XP | 3,500 XP (Platinum) |
| **Platinum** | Cyan / Diamond Gem | 3,500 XP | 6,999 XP | 7,000 XP (Diamond) |
| **Diamond** | Royal Violet Crown | 7,000+ XP | $\infty$ | Max Division |

### Division Calculation Algorithm (`lib/gamification.ts`)
```typescript
export function calculateDivision(
  totalXp: number,
  rules: Partial<XpRulesConfig> = {}
): {
  tier: DivisionTier
  currentTierMinXp: number
  nextTierMinXp: number | null
  progressPercent: number
  xpNeededForNext: number
} {
  const safeXp = Math.max(0, totalXp)
  const thresholds = rules.division_thresholds || DEFAULT_XP_RULES.division_thresholds

  if (safeXp >= thresholds.diamond) {
    return {
      tier: "diamond",
      currentTierMinXp: thresholds.diamond,
      nextTierMinXp: null,
      progressPercent: 100,
      xpNeededForNext: 0,
    }
  }

  if (safeXp >= thresholds.platinum) {
    const span = thresholds.diamond - thresholds.platinum
    const inTier = safeXp - thresholds.platinum
    return {
      tier: "platinum",
      currentTierMinXp: thresholds.platinum,
      nextTierMinXp: thresholds.diamond,
      progressPercent: Math.min(100, (inTier / span) * 100),
      xpNeededForNext: thresholds.diamond - safeXp,
    }
  }
  // ... calculates gold, silver, and bronze spans
}
```

---

## 3. XP Reward Rules

XP is earned deterministically across platform activities:

| Activity | XP Awarded | Criteria / Bonus |
| :--- | :--- | :--- |
| **Daily Pharmacology Challenge** | **+25 XP** | Awarded once per calendar date on answering correctly. |
| **Lecture Completion** | **+50 XP** | Awarded when video watch progress reaches 100%. |
| **Quiz Standard Pass** | **+100 XP** | Awarded on scoring $\ge 80\%$. |
| **Quiz Perfect Score** | **+150 XP** | Awarded on achieving 100% on a quiz attempt. |
| **Course Full Mastery** | **+500 XP** | Awarded upon earning a verifiable course certificate. |
| **Clinical Q&A Upvote** | **+10 XP** | Awarded to the author when a peer upvotes their clinical answer. |

---

## 4. Multi-Scope Leaderboard Engine

Leaderboards are computed across three distinct scopes and two timeframes:

### Scopes:
1. **Global (`scope: "global"`)**: Aggregates all registered students across all institutions.
2. **University Cohort (`scope: "university"`)**: Filters students by their matching `users.university` attribute (e.g., King Saud University, Cairo University, Jordan University of Science & Technology).
3. **Classroom / Course (`scope: "course"`)**: Scoped to students enrolled in a specific `course_id`.

### Timeframes:
- **Weekly Seasons (`timeframe: "weekly"`)**: Sums XP earned in the current UTC weekly cycle (resets Sunday at 23:59:59 UTC).
- **All-Time (`timeframe: "all_time"`)**: Lifetime cumulative XP leaderboard.

### Deterministic Tie-Breaking
When two or more students have equal XP, rankings are ordered by:
1. `total_xp` (Descending)
2. `certificates_count` (Descending)
3. `badges_count` (Descending)
4. `created_at` (Ascending / earliest join date)

---

## 5. Circular SVG Progress Ring Math (`CircularProgressRing.tsx`)

The progress ring component utilizes strict SVG circumference calculations:

$$\text{Radius } r = \frac{\text{size} - \text{strokeWidth}}{2}$$
$$\text{Circumference } C = 2 \pi r$$
$$\text{Stroke Dashoffset } = C \times \left(1 - \frac{\text{clampedPercent}}{100}\right)$$

This delivers 60fps hardware-accelerated animated progress feedback with SVG linear gradients.
