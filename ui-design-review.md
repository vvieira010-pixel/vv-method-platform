# UI Design Review Report

**Interface**: MET Proficiency Mastery  
**Date**: June 27, 2026  
**Reviewer**: AI Design Audit  
**Pages Reviewed**: 22 teacher pages + 7 student pages (29 total)

---

## Executive Summary

### Visual Design Score: **72/100**

| Dimension | Score | Status |
|-----------|-------|--------|
| Visual Hierarchy | 8/10 | ✅ |
| Typography | 7/10 | ⚠️ |
| Color Palette | 8/10 | ✅ |
| Spacing & White Space | 7/10 | ⚠️ |
| Visual Consistency | 7/10 | ⚠️ |
| Imagery & Graphics | 6/10 | ⚠️ |
| Layout & Grid | 7/10 | ⚠️ |
| Component Design | 8/10 | ✅ |
| Branding & Personality | 8/10 | ✅ |
| Modern Standards | 6/10 | ⚠️ |

### Overall Assessment

A professional, thoughtfully crafted educational SPA with strong brand identity (navy + teal, DM Sans + Sora). The design punches above its weight for a solo-dev project — the CSS custom properties system, component library, and accessibility patterns demonstrate real craft. However, the visual system shows signs of organic growth: inline styles leak into pages, token usage is inconsistent in some corners, and a few dated patterns (pure white cards, tight spacing in data-dense areas) keep it from feeling truly premium. The student experience is measurably more polished than the teacher side.

### Top 3 Strengths
1. **Strong brand identity** — Navy/teal palette with Sora display font creates a calm, expert medical-professional feel that aligns perfectly with the MET test prep audience
2. **Design system maturity** — Complete CSS custom properties for colors, spacing, typography, shadows, transitions — rare for a solo project
3. **Accessibility-first foundations** — Skip-nav, ARIA labels, focus-visible, reduced-motion, sr-only, WCAG AAA target for status colors

### Top 3 Issues
1. **CSS sprawl** — 6,500-line monolithic stylesheet with duplicate keyframes (two `fadeUp` definitions), duplicate `.sr-only`, and tightly coupled `.td-*` / `.student-*` class clusters that strain maintainability
2. **Inline style debt** — ~145 inline style objects remain across two key pages (submission-review 65, diagnostic-create 80), plus ad-hoc scattered inline styles in student-home.jsx, student-progress.jsx, and settings.jsx
3. **Teacher side feels less polished than student side** — Teacher dashboard uses tight card layout with small padding (16px vs student 24px), data-dense rows, and less generous white space. The student experience has hero gradients, grain texture, decorative circles, and staggered entrance animations that the teacher side lacks

### First Impression
- **Immediate Feeling**: Professional, calm, competent — evokes a medical training tool rather than a generic LMS
- **Trust Level**: High — clean typography and consistent color system inspire confidence
- **Competitive Standing**: On-par with custom-built education platforms; ahead of generic LMS templates

---

## Detailed Analysis

### 1. Visual Hierarchy ⭐⭐⭐⭐⭐⭐⭐⭐⚪ (8/10)

#### Strengths
- ✅ Page titles use 40px bold (`--text-4xl`) with 800 weight on teacher dashboard — creates clear primary focus
- ✅ Section headers use consistent title+subtitle pattern (.section-header, .section-title, .section-sub)
- ✅ KPI components use extreme hierarchy: 11px uppercase label, 30px bold value, 14px trend — unambiguous
- ✅ Card hover elevation (translateY(-1px) + shadow) creates clear interactive affordance
- ✅ Button hierarchy well-defined: primary (teal + shadow), secondary (subtle border), ghost (text-only), quiet (muted text)
- ✅ Pill has 7 semantic tones, each with distinct background + text colors for at-a-glance status

#### Issues

**Issue 1.1: Teacher dashboard data density flattens hierarchy**
- **Severity**: Medium
- **Location**: `teacher-dashboard.jsx` — `.td-shell` container
- **Problem**: Four KPI cards in a grid, priority alert card, quick actions list, and class list all compete at similar visual weight. The `--text-sm` body on some items blends with `--text-xs` metadata.
- **Impact**: Users must scan carefully to distinguish primary metrics from secondary info
- **Recommendation**: Increase KPI card size (use `--space-5` padding instead of `--space-3`), add 3px top border tone to each KPI (like student metrics do with `--teal`/`--navy`/`--amber` variants), reduce secondary info to `--text-2xs` (11px)
- **Effort**: Low (2-3h)

**Issue 1.2: No visual distinction between interactive and static cards**
- **Severity**: Low
- **Location**: Multiple pages (diagnostics.jsx, students.jsx, homework.jsx)
- **Problem**: Cards in list views all look identical — no visual cue that some are clickable and others are static
- **Impact**: Users may miss navigation opportunities
- **Recommendation**: Add a subtle `cursor: pointer` + border-color accent on hover for clickable cards (already done on `.td-student-row` and `.td-kpi-card:hover` — extend pattern to `.card-row` in diagnostics and homework lists)
- **Effort**: Low (1h)

#### Recommendations Summary
1. Add tone-coded top borders to teacher dashboard KPI cards (like `.student-metric--teal` pattern)
2. Increase card padding on data-dense list pages to reduce visual competition
3. Consistent pointer/hover pattern on all clickable cards

---

### 2. Typography ⭐⭐⭐⭐⭐⭐⭐⚪⚪ (7/10)

#### Strengths
- ✅ Smart font pairing: Sora for display (headings), DM Sans for body/UI — distinct but harmonious
- ✅ 11-size typography scale (11px-52px) with CSS custom properties — systematic
- ✅ Body text at 16px (`--text-base`) — meets readability minimum
- ✅ Line height 1.7 on body (`body { line-height: 1.7 }`) — generous, readable
- ✅ H1-H6 hierarchy with decreasing sizes and weights (800/700/600), letter-spacing for display sizes
- ✅ Sora's geometric, friendly-quiet personality fits the "calm, expert" brand perfectly

#### Issues

**Issue 2.1: Some text sizes push readability limits**
- **Severity**: Medium
- **Location**: `.kpi-label` (11px uppercase), `.pill` (12px), `.section-sub` (12px), `.shell-nav-section-label` (9px!)
- **Problem**: 9px labels on section nav groups are extremely small — below WCAG AAA minimum even for decorative text. 11px uppercase on KPI labels strains readability.
- **Impact**: Power users may manage, but accessibility suffers. 9px fails WCAG AA for any text size.
- **Recommendation**: Bump `.shell-nav-section-label` to `--text-2xs` (11px). Change `.kpi-label` to `--text-xs` (12px) with adjusted letter-spacing. Keep `.section-sub` at 12px (it's decorative).
- **Effort**: Low (30min)

**Issue 2.2: Line length unconstrained on wide screens**
- **Severity**: Low
- **Location**: Most `.page-shell` containers at max-width 1200px
- **Problem**: Body text in cards at 1200px width extends to ~90 characters per line — exceeds optimal 50-75 char range for readability
- **Impact**: Reading fatigue on longer text sections
- **Recommendation**: Add `max-width: 70ch` to long-form text containers (reports, feedback details). Student feedback already does this (`maxWidth: '72ch'` in `StudentFeedbackView` — good pattern to extend)
- **Effort**: Low (1h)

**Issue 2.3: Inline textarea styling reinvents the wheel**
- **Severity**: Low
- **Location**: `student-home.jsx:200` — weekly goal textarea
- **Problem**: `style={{ width: '100%', padding: 'var(--space-2)', borderRadius: 6, border: '1px solid var(--border)', ... }}` — uses `borderRadius: 6` (hardcoded) instead of `var(--radius-sm)`, and duplicates `.input` class logic
- **Impact**: Inconsistency — textarea in student home looks slightly different from `.input` class textareas
- **Recommendation**: Use `className="input"` instead of inline style. If a multi-line textarea variant is needed, add `.textarea` to system.css.
- **Effort**: Low (20min)

#### Recommendations Summary
1. Bump smallest text sizes (9px nav label → 11px, 11px KPI label → 12px)
2. Add character-length constraint to long-form text containers
3. Replace inline textarea styles with `.input` class

---

### 3. Color Palette ⭐⭐⭐⭐⭐⭐⭐⭐⚪ (8/10)

#### Strengths
- ✅ Well-defined palette: navy primary (`#0f1b2d`), teal accent (`#148891`), amber interaction (`#c86607`)
- ✅ Status colors have full families: success (bg/soft/text/border), warning, error/danger, info
- ✅ Neutrals well-chosen: cool off-white background (`#f4f9fc`), warm white surface (`#ffffff`)
- ✅ 17 opacity variants for accent-soft (08 through 85) — excellent granularity
- ✅ Accent-soft opacity system enables subtle backgrounds, borders, and overlays without multiplying hardcoded values
- ✅ Colors reflect brand: navy conveys expertise and trust, teal adds calm professionalism, amber for urgency
- ✅ Accessibility-focused: `--muted` and `--success` family tuned to WCAG AAA (7:1) targets

#### Issues

**Issue 3.1: Hardcoded hex colors in reports.jsx**
- **Severity**: Medium
- **Location**: `reports.jsx` — hero gradient, chart bars, row backgrounds
- **Problem**: Hero block uses `#101a28`, `#172537`, `#1f4e58` instead of CSS variables. Chart bars use `#0f766e`, `#f59e0b`, `#94a3b8`. Row backgrounds use `#ffffff → #f9fcfc` gradient.
- **Impact**: These colors won't adapt if the theme changes. Dark mode override is impossible for these elements without finding and updating every occurrence.
- **Recommendation**: Replace hero gradient with `var(--primary)`, `var(--accent)`, etc. Replace chart bar colors with `var(--accent)`, `var(--warning)`, `var(--muted)`. Extract row gradient to CSS variable or use existing tokens.
- **Effort**: Medium (2-4h — impacts recharts configuration)

**Issue 3.2: Pure white surface on light gray background feels clinical**
- **Severity**: Low
- **Location**: All `.card` components with `--surface: #ffffff` on `--bg: #f4f9fc`
- **Problem**: High contrast between white cards and the cool gray background can feel sterile — especially in data-dense dashboard views
- **Impact**: Minor polish issue — doesn't affect usability but reduces warmth
- **Recommendation**: Consider a barely-there tint: `--surface: rgba(255,255,255,0.98)` or add a subtle inner shadow to cards. Alternatively, shift `--bg` slightly warmer: `oklch(98% 0.003 70)`.
- **Effort**: Low (15min CSS change — test impact on all 29 pages first)

**Issue 3.3: Color token drift in system.css**
- **Severity**: Low
- **Location**: system.css `:root` — `--accent-text`, `--muted`, `--warning-text`, `--warning-soft`
- **Problem**: `DESIGN_SYSTEM_UPDATE.md` references OKLch values, but actual CSS uses hex. Some token names are deprecated (`--accent-deep`, `--primary-ink`) with `@deprecated` comments but remain in use.
- **Impact**: Maintainability friction — developers must check which token is current
- **Recommendation**: Audit deprecated token usage across the codebase (grep for `--accent-deep`, `--primary-ink`), migrate to current equivalents, then remove deprecated declarations
- **Effort**: Medium (2-3h for audit + migration)

#### Recommendations Summary
1. Replace hardcoded hex in reports.jsx with CSS variable references
2. Consider warming the card-on-bg contrast subtly
3. Clean up deprecated color tokens

---

### 4. Spacing & White Space ⭐⭐⭐⭐⭐⭐⭐⚪⚪ (7/10)

#### Strengths
- ✅ 14-level spacing scale (4px-80px) with CSS custom properties — systematic foundation
- ✅ Cards use `--space-6` (24px) padding — good baseline
- ✅ Page shell uses `--space-7` (28px) horizontal padding — decent breathing room
- ✅ Student home uses generous `--space-9` (36px) vertical padding
- ✅ Gap utilities (gap-0 through gap-8) cover the spacing scale

#### Issues

**Issue 4.1: Ad-hoc spacing values in reports.jsx and student-progress.jsx**
- **Severity**: Medium
- **Location**: reports.jsx (`padding: 18, 16, 14`), student-progress.jsx (`marginBottom: 24`), student-homework.jsx (`marginBottom: 18`)
- **Problem**: Hardcoded pixel values instead of `var(--space-*)` tokens. Three different card padding values in the same file (reports.jsx).
- **Impact**: Creates visual inconsistencies — cards at 16px look tighter than cards at 24px on the same page
- **Recommendation**: Standardize: `var(--space-4)` (16px) for compact card lists, `var(--space-5)` (20px) for standard cards, `var(--space-6)` (24px) for focus cards. Apply consistently.
- **Effort**: Low (1-2h)

**Issue 4.2: Teacher dashboard feels cramped compared to student dashboard**
- **Severity**: Medium
- **Location**: `.td-shell` (padding: `--space-6` vertical, `--space-5` horizontal = 24px/20px) vs `.student-home` (gap: 12px, generous 36px padding)
- **Problem**: Teacher dashboard uses tighter spacing in a 4-column KPI grid with smaller cards. Student metrics use `auto-fit minmax(220px, 1fr)` with more generous card padding.
- **Impact**: Teacher power users get a denser experience — intentional per PRODUCT.md ("Information-dense when useful") — but the gap between student and teacher polish is noticeable
- **Recommendation**: Add `--space-2` (8px) more padding to td-kpi-card. KPI value can stay at `--text-3xl` (30px) but the card interior needs breathing room.
- **Effort**: Low (30min)

**Issue 4.3: gap-7 uses hardcoded 28px instead of token**
- **Severity**: Low
- **Location**: system.css line `.gap-7 { gap: 28px; }`
- **Problem**: `28px` is `var(--space-7)` — this should reference the token, not a hardcoded value
- **Impact**: Minor — if the spacing scale ever changes, `gap-7` won't follow
- **Recommendation**: Change to `gap: var(--space-7);`
- **Effort**: Trivial (1min)

#### Recommendations Summary
1. Standardize card padding tokens across pages
2. Add generous spacing to teacher dashboard KPI cards
3. Fix `gap-7` to use token reference

---

### 5. Visual Consistency ⭐⭐⭐⭐⭐⭐⭐⚪⚪ (7/10)

#### Strengths
- ✅ Button component: 6 variants × 3 sizes — clean API with consistent visual distinction
- ✅ Pill/tag system: 7 semantic tones with alias mapping — elegant pattern
- ✅ Card component: 3 style variants via `[data-cards]` attribute — flexible
- ✅ Shell/navigation: consistent topbar + mobile bottom nav across teacher pages
- ✅ `S`/`S_DARK` style constants provide shared headline/sub patterns

#### Issues

**Issue 5.1: Three distinct styling approaches coexist**
- **Severity**: High
- **Location**: Across all pages
- **Problem**: Pages use one of three patterns: (1) CSS-class-driven (student-home.jsx — cleanest), (2) shared `S` style object (reports.jsx — mixed), (3) ad-hoc inline styles (submission-review.jsx — ~65, diagnostic-create.jsx — ~80). These patterns intermix.
- **Impact**: Design changes require hunting through three different systems. New developers must learn all three patterns.
- **Recommendation**: Adopt CSS-class-driven as the standard. Phase 1: Migrate the ~80 inline styles in diagnostic-create.jsx and ~65 in submission-review.jsx to utility or component classes. Phase 2: Replace `S` objects with class-based equivalents.
- **Effort**: High (2-3 weeks incremental — ~145 inline styles to convert)

**Issue 5.2: Modal system has two variants with slightly different code**
- **Severity**: Low
- **Location**: `.modal-*` (lines 4011-4093) and `.review-*` (lines 5451-5628)
- **Problem**: The review session modal (`.review-overlay` → `.review-modal` → `.review-modal-header/body`) duplicates the pattern of `.modal-overlay` → `.modal-card` → `.modal-header/body` with slightly different values: `border-radius: 10px` (review) vs `border-radius: var(--radius-sm)` (modal)
- **Impact**: Two components that serve the same purpose diverge visually
- **Recommendation**: Consolidate review modal to use the standard `.modal-*` classes, or extend the modal system with a `.modal--review` variant that inherits from the base
- **Effort**: Medium (2-3h)

**Issue 5.3: Student hero uses two different heading structures**
- **Severity**: Low
- **Location**: student-feedback.jsx (`<h1>"Your teacher's latest notes"`), student-home.jsx (h1 in `.student-hero`), student-homework.jsx (h1 in `.student-homework-hero`)
- **Problem**: Student pages each define their own hero layout, some with kicker+heading, others with just heading and no kicker
- **Impact**: Students see slightly different header patterns as they navigate
- **Recommendation**: Create a reusable `.student-hero` pattern that accepts kicker, heading, and optional action slots — standardize across all 5 student content pages
- **Effort**: Medium (3-4h)

#### Recommendations Summary
1. Phase out inline styles and `S` objects — CSS-class-driven as standard
2. Consolidate duplicate modal variants
3. Standardize student hero component pattern

---

### 6. Imagery & Graphics ⭐⭐⭐⭐⭐⭐⚪⚪ (6/10)

#### Strengths
- ✅ Custom SVG icon system (Feather-style, 60+ icons) with consistent 18px base size
- ✅ Custom empty-state illustrations (`IlloNoClasses`, `IlloNoStudents`) — bespoke, not stock
- ✅ Icons use `stroke="currentColor"` — inherits text color naturally
- ✅ Icon is re-exported as a single `Icon` object with named components — clean import pattern

#### Issues

**Issue 6.1: No photographic or illustrative assets beyond icons**
- **Severity**: Medium
- **Location**: All pages
- **Problem**: The platform has zero photography, no hero images, no branded graphics beyond icons and a grain texture. The student hero has decorative CSS circles (pseudo-elements with radial borders) but no visual storytelling.
- **Impact**: The interface, while clean, lacks visual interest and emotional warmth. Educational platforms benefit from aspirational imagery.
- **Recommendation**: In order of priority: (1) Add a subtle branded pattern or gradient to the teacher dashboard hero area (like the student hero's radial gradients), (2) Commission or license 3-5 MET/healthcare-themed illustrations for empty states, (3) Consider adding a subtle avatar/photo area for students
- **Effort**: High (illustration commission: 1-2 weeks) to Medium (CSS-only enhancement: 4-6h)

**Issue 6.2: Empty states exist but are inconsistent**
- **Severity**: Low
- **Location**: Inbox, reports, diagnostics, homework, students pages
- **Problem**: Some empty states use the reusable `.empty-state` class with custom SVGs (dashboard), others use plain text in a card (diagnostics, homework), others have no empty state at all
- **Impact**: Inconsistent fallback experience — some empty sections feel cared for, others feel abandoned
- **Recommendation**: Create a set of 5-6 empty-state illustrations (generic + domain-specific: no-diagnostics, no-homework, no-submissions, no-messages, no-students). Use the `.empty-state` class consistently.
- **Effort**: Medium (4-6h for SVGs + implementation)

#### Recommendations Summary
1. Add visual interest to hero areas with CSS gradients/patterns (borrow from student hero pattern)
2. Create consistent, illustrated empty states for all list views
3. Consider branded illustrations as a competitive differentiator

---

### 7. Layout & Grid ⭐⭐⭐⭐⭐⭐⭐⚪⚪ (7/10)

#### Strengths
- ✅ Page shell with max-width 1200px — centered content, consistent across teacher pages
- ✅ Student grid system: `.student-grid` with `1fr 330px` — main + sidebar pattern
- ✅ KPI grids use `repeat(auto-fit, minmax(220px, 1fr))` — responsive by default
- ✅ Responsive breakpoints at 1024px, 860px, 768px, 480px, 390px — thorough coverage
- ✅ Grid utility classes: `.grid-2col`, `.grid-2fr-1fr`, `.grid-3col` with collapse at 768px
- ✅ Bottom mobile navigation for teacher — good mobile UX

#### Issues

**Issue 7.1: Ad-hoc grid layouts with inline style objects**
- **Severity**: Medium
- **Location**: reports.jsx (`S.kpiGrid`, `S.splitGrid`, `S.filterGrid`), tool-inbox.jsx (`S.mainGrid`, `S.kpiGrid`)
- **Problem**: Grid definitions live in JavaScript `const S` objects instead of CSS classes, duplicating grid logic that should be in stylesheets
- **Impact**: Override requires JavaScript changes. Media queries can't adjust JS-defined grids without additional inline overrides.
- **Recommendation**: Move grid definitions to CSS classes (`.reports-kpi-grid`, `.reports-split-grid`, `.inbox-main-grid`). Use `style={S.xxx}` only for one-off overrides, not structural layout.
- **Effort**: Medium (4-6h)

**Issue 7.2: No consistent page template for list vs detail views**
- **Severity**: Medium
- **Location**: diagnostics.jsx, submissions.jsx, error-bank.jsx, inbox (tool-inbox.jsx)
- **Problem**: List pages have different layouts: some use filters + card list (diagnostics), some use split pane (inbox), some use page-list with tabs (exercises). No shared template pattern.
- **Impact**: Users learn a new layout pattern for each section — cognitive load increases
- **Recommendation**: Define 2-3 page templates in system.css: (1) `.page-list` (filters + single-column list), (2) `.page-split` (filters + list + detail panel), (3) `.page-detail` (single-focused view). Standardize pages to use these.
- **Effort**: High (1-2 weeks — but incremental per page)

**Issue 7.3: Teacher mobile nav uses 5 tabs but there are 10 teacher views**
- **Severity**: Low
- **Location**: App.jsx `.shell-mobile-nav` — dashboard, students, diagnostics, homework, submissions
- **Problem**: Only 5 primary tabs appear in mobile nav; the remaining 5 (inbox, error-bank, reports, exercises, calendar) are inaccessible from mobile without the topbar nav (which is hidden on mobile)
- **Impact**: Mobile teachers lose access to inbox, reports, error bank, exercises, and calendar unless they know to scroll the hidden nav
- **Recommendation**: Add an overflow menu (⋯) to mobile nav with secondary items, or make the topbar nav swipeable on mobile (it already has `overflow-x: auto`)
- **Effort**: Medium (3-5h)

#### Recommendations Summary
1. Move grid definitions from JS inline objects to CSS classes
2. Create reusable page layout templates
3. Fix mobile navigation to surface all teacher views

---

### 8. Component Design ⭐⭐⭐⭐⭐⭐⭐⭐⚪ (8/10)

#### Strengths
- ✅ **Button**: 6 variants × 3 sizes, proper states (hover: brightness/filter, active: scale(0.97), disabled: opacity 0.5, focus-visible: accent ring), min-height 44px for touch targets. Pill-radius shape feels modern.
- ✅ **Card**: 3 theme variants, hover elevation (shadow: sm→md, border: →strong, translateY: -1px), consistent padding (24px default, 16px compact). `Card.jsx` component API accepts `padding` prop for overrides.
- ✅ **Input**: Clean hover (border-strong), focus (accent border + ring), placeholder styling (text-muted)
- ✅ **Pill**: 7 semantic tones + status alias mapping (`reviewed → pill-success`, `overdue → pill-danger`) — elegant abstraction
- ✅ **Skeleton**: Shimmer-based loading with gradient animation — modern and polished
- ✅ **Modal**: fadeIn overlay + scaleIn card with primary-colored header — standard, well-executed
- ✅ **Toast**: 4 variants (ok/info/warn/go), auto-dismiss at 3.2s, fixed bottom-right
- ✅ **Progress bar**: Gradient fill (primary→accent) with smooth transition
- ✅ **Skip nav**: Fixed skip-to-content link — accessibility win

#### Issues

**Issue 8.1: No Select component — native `<select>` styled as `.input`**
- **Severity**: Low
- **Location**: Multiple pages — filters, forms
- **Problem**: Native `<select>` elements are styled with `.input` class, which works but browser-native dropdown indicators (arrows) vary across browsers and can't be customized without wrapping
- **Impact**: Slight visual inconsistency — Safari shows different dropdown styling than Chrome
- **Recommendation**: Consider a lightweight custom `<Select>` component with consistent chevron icon. Alternatively, accept native behavior (it's familiar to users).
- **Effort**: Low (2-3h) if wrapping in component; null if accepting native

**Issue 8.2: Review/Status badge has its own pattern separate from Pill**
- **Severity**: Low
- **Location**: `domain-ui.jsx` — `ReviewStatusBadge` vs `Pill` component
- **Problem**: `ReviewStatusBadge` uses inline styles with a `RS` lookup map, duplicating the `Pill` component's tone system. Same purpose (status indicator), different implementation.
- **Impact**: 10 statuses redefined in JavaScript — if pill tones change, review badges won't follow
- **Recommendation**: Reimplement `ReviewStatusBadge` as a wrapper around `Pill` with status-specific tone mapping. Move status-to-tone mapping to a shared config.
- **Effort**: Low (1-2h)

**Issue 8.3: No loading state for async page transitions**
- **Severity**: Low
- **Location**: All pages transitioning via `renderTeacherPage()`
- **Problem**: Teacher shell uses `<Suspense fallback={<PageLoader />}>` but `PageLoader` is minimal (likely just "Loading..." text)
- **Impact**: Users see a flash of blank/loading text during lazy-loaded page transitions
- **Recommendation**: Enhance `PageLoader` with a skeleton shell (2-3 skeleton cards matching the target page's layout). Already done for student pages with `SkeletonCard` — extend to teacher.
- **Effort**: Low (1-2h per target page)

#### Recommendations Summary
1. Consider custom Select component for consistent cross-browser styling
2. Reimplement ReviewStatusBadge as Pill wrapper
3. Enhance PageLoader with layout-matching skeletons

---

### 9. Branding & Personality ⭐⭐⭐⭐⭐⭐⭐⭐⚪ (8/10)

#### Strengths
- ✅ **Brand identity is clear and consistent**: Navy primary + teal accent + amber interaction perfectly communicates "calm, focused, expert" for medical English test prep
- ✅ **Font pairing is distinctive**: Sora display font is uncommon enough to feel bespoke, geometric enough to feel professional
- ✅ **"MET Proficiency Mastery" brand name** appears in topbar — consistent identity system
- ✅ **Anti-reference discipline**: The design explicitly avoids generic SaaS dashboard patterns, overloaded LMS aesthetics, and flashy edtech tropes
- ✅ **Student experience has brand personality**: Hero gradients, grain texture, decorative radial circles, staggered fadeUp animations — these details add warmth and character
- ✅ **Settings page has a "Danger Zone" section** with red border — a nice recognizable UX pattern

#### Issues

**Issue 9.1: Teacher experience lacks the personality of student experience**
- **Severity**: Medium
- **Location**: All teacher pages vs student pages
- **Problem**: Teacher dashboard uses plain white cards on light gray background with no decorative elements. Student dashboard has grain texture, hero gradients, decorative circles, card tone borders, and staggered animations. Teacher side feels utilitarian by comparison.
- **Impact**: The teacher — the primary paying user — gets a less emotionally engaging experience
- **Recommendation**: Port 2-3 visual elements from student to teacher side: (1) Add `.bg-grain` to `.td-shell`, (2) Add subtle gradient background to `.td-headline` area, (3) Add tone-coded top borders to more teacher cards
- **Effort**: Low (2-3h)

**Issue 9.2: No brand touchpoints beyond color and typography**
- **Severity**: Low
- **Location**: All pages
- **Problem**: Brand expression is limited to colors and fonts. No tagline, no mascot/symbol, no branded illustration style, no logo mark beyond the "MET" text in the topbar.
- **Impact**: The product feels functional rather than emotionally branded
- **Recommendation**: Design a small logo mark/icon (a simple teal + navy monogram or MET-related symbol) for the topbar. Add a subtle tagline ("Master the MET") to the login page. These are low-effort branding wins.
- **Effort**: Low (logo: 2-4h in SVG)

#### Recommendations Summary
1. Bring student-side visual personality (grain, gradients, decorative elements) to teacher pages
2. Design a simple logo mark for brand reinforcement

---

### 10. Modern Design Standards ⭐⭐⭐⭐⭐⭐⚪⚪ (6/10)

#### Strengths
- ✅ **CSS custom properties throughout** — modern, maintainable token system
- ✅ **Dark mode support** via `[data-theme="dark"]` on `<html>` — 1000+ lines of dark overrides
- ✅ **Reduced motion support** — `prefers-reduced-motion` disables non-essential animations
- ✅ **FadeUp page transitions** — subtle, professional entrance animations
- ✅ **Mobile-first responsive** — 5 breakpoints down to 390px, mobile bottom nav
- ✅ **Backdrop-filter blur on topbar** — modern glass-morphism effect
- ✅ **Print styles** — comprehensive `@media print` block

#### Issues

**Issue 10.1: Pure white cards on gray background is a dated SaaS pattern**
- **Severity**: Medium
- **Location**: All `.card` components
- **Problem**: `--surface: #ffffff` on `--bg: #f4f9fc` creates a high-contrast card grid that feels reminiscent of 2018-era admin dashboards. Current design trends favor subtly tinted surfaces (`oklch(99% 0.002 200)`) with softer boundaries.
- **Impact**: The "white card on gray" pattern looks slightly generic — doesn't match the brand's "calm, expert, quiet confidence" positioning
- **Recommendation**: Evolve to a slightly warmer surface: `--surface: oklch(99.5% 0.002 70)` (barely cream) or add `--shadow-sm` to all cards by default. The shadowed card variant already looks more premium.
- **Effort**: Low (CSS change — 5min to update variable; may need visual QA on all pages)

**Issue 10.2: CSS is monolithic at 6,500 lines**
- **Severity**: Medium
- **Location**: `src/styles/system.css`
- **Problem**: Single file contains all styles. Has duplicate declarations (`.sr-only` twice, `@keyframes fadeUp` twice with different values), and mixes concerns (tokens, base resets, page-specific styles, components).
- **Impact**: Maintainability risk — hard to find and update styles. File size impacts developer velocity.
- **Recommendation**: Split into at least 3 files: (1) tokens.css (custom properties only), (2) base.css (resets, typography, layout utilities), (3) components.css (card, btn, input, pill, modal, etc.). Keep page-specific styles in system.css or colocate with components.
- **Effort**: Medium (4-6h careful split — verify no class name collisions)

**Issue 10.3: 9px text in navigation labels**
- **Severity**: Low
- **Location**: `.shell-nav-section-label` — `font-size: 9px`
- **Problem**: 9px text is below any accessibility standard. Even for decorative labels in a dense nav bar, this feels like a relic from an earlier, tighter design.
- **Impact**: Users with visual impairments cannot read nav section labels
- **Recommendation**: Minimum `--text-2xs` (11px). Consider whether nav section labels are needed at all — students navigate without them.
- **Effort**: Trivial (1min)

**Issue 10.4: No container queries, limited use of modern CSS features**
- **Severity**: Low
- **Location**: All responsive layouts use media queries
- **Problem**: `@media (max-width: 860px)` works but container queries would allow truly responsive card components that adapt to their available space rather than the viewport
- **Impact**: Some cards reflow poorly when placed in narrow sidebars
- **Recommendation**: Progressive enhancement — add container queries for card and panel components. Not urgent; media queries work fine.
- **Effort**: Low-medium (global search for card container wrappers → add `container-type: inline-size`)

#### Recommendations Summary
1. Evolve card surface from pure white to slightly warm tint for premium feel
2. Split monolithic CSS into token/base/component files
3. Bump minimum text size from 9px to 11px

---

## Component Audit

### Buttons (consistent, well-crafted)
| Variant | Status | Notes |
|---------|--------|-------|
| Primary (teal) | ✅ Good | Pill shape, subtle shadow, good hover (brightness) + active (scale) |
| Accent (navy) | ✅ Good | Works for secondary CTAs |
| Secondary | ✅ Good | Border + subtle background, clear differentiation |
| Ghost | ✅ Good | Transparent, text-only, good for tertiary actions |
| Quiet | ✅ Good | Muted text for least-important actions |
| Danger | ✅ Good | Red for destructive actions |

**Issues**: None significant. Min-height 44px on all variants is a touch-target win.

### Forms (functional, room for improvement)
| Component | Status | Notes |
|-----------|--------|-------|
| Input (text) | ✅ Good | Clean hover/focus, placeholder styling |
| Select (native) | ⚠️ Acceptable | Native dropdown, inconsistent cross-browser |
| Textarea | ⚠️ Inline restyle | student-home.jsx reinvents styling inline |
| Checkbox/Radio | ❌ Not Assessed | No consistent checkbox/radio styling visible |
| Labels | ✅ Good | `.field-label` pattern with uppercase 11px |

**Issues**: No consistent checkbox/radio styling. Textarea needs a `.textarea` CSS class.

### Cards (solid, three variants)
| Variant | Status | Notes |
|---------|--------|-------|
| Flat (`data-cards="flat"`) | ⚠️ Acceptable | No border/shadow — works for nested cards |
| Bordered (`data-cards="bordered"`) | ✅ Good | Default — clean border |
| Shadowed (`data-cards="shadowed"`) | ✅ Good | Most premium variant |

**Issues**: Three variants hidden behind a data attribute on `<html>` — users can't choose per-card. Consider making card variants available via class names instead.

### Navigation
| Element | Status | Notes |
|---------|--------|-------|
| Topbar | ✅ Good | Glass-morphism blur, nav sections, settings |
| Nav buttons | ✅ Good | Hover/active states, focus-visible ring |
| Mobile nav | ⚠️ Acceptable | Only 5 tabs — 5 more views hidden |
| Breadcrumbs | ❌ Missing | No breadcrumb pattern — deep views lose context |
| Student tabs | ✅ Good | Top tab bar, ARIA roles, ArrowLeft/Right keyboard nav |

**Issues**: Missing breadcrumbs for deep navigation (e.g., `students → profile`, `submissions → review`).

### Empty States (inconsistent)
| Page | Status | Notes |
|------|--------|-------|
| Dashboard | ✅ Good | Custom illustrations (`IlloNoClasses`, `IlloNoStudents`) |
| Diagnostics | ⚠️ Text card | Plain text "No diagnostics yet" |
| Homework | ⚠️ Text card | Plain text |
| Exercises | ⚠️ Text card | Plain text |
| Inbox | ❌ None | No empty state visible |

**Issues**: Empty state pattern exists (`.empty-state` class) but isn't used consistently.

---

## Design System Assessment

**Overall Score**: **7/10** (Mostly systematic)

### What Exists
| Element | Status | Quality |
|---------|--------|---------|
| Color palette | ✅ Complete | 17 colors + 17 opacity variants + semantic status families |
| Typography scale | ✅ Complete | 11 sizes, 4 weights, 3 font families |
| Spacing scale | ✅ Complete | 14 values (4px-80px) |
| Shadow system | ✅ Complete | 5 levels (sm/md/lg/xl/card/modal) |
| Border radius | ✅ Complete | 5 values (sm/md/lg/pill/full) |
| Transition presets | ✅ Complete | 3 speeds (fast/base/slow) |
| Z-index scale | ✅ Complete | 7 levels |
| Button component | ✅ Complete | 6 variants × 3 sizes + full states |
| Pill component | ✅ Complete | 7 tones + semantic alias mapping |
| Card component | ✅ Complete | 3 style variants + hover states |
| Input component | ✅ Complete | Hover/focus/placeholder styling |
| Dark mode | ✅ Complete | 1000+ lines of `[data-theme="dark"]` overrides |
| Responsive breakpoints | ✅ Complete | 5 breakpoints (1024/860/768/480/390px) |
| Accessibility patterns | ✅ Complete | Skip-nav, sr-only, ARIA, focus-visible, reduced-motion |

### What's Missing
| Element | Impact | Effort |
|---------|--------|--------|
| Split CSS files (tokens/base/components) | Medium | 4-6h |
| Container queries for responsive cards | Low | 2-3h |
| Consistent checkbox/radio styling | Medium | 2-3h |
| Textarea CSS class | Low | 30min |
| Breadcrumb component | Medium | 3-4h |
| Empty state illustrations (×6) | Medium | 4-6h |
| Shared page templates (list/split/detail) | High | 1-2 weeks |
| Reusable Select component | Low | 2-3h |
| Logo mark / brand symbol | Low | 2-4h |

### Token Drift Issues
- `--accent-deep` (deprecated) — still referenced somewhere?
- `--primary-ink` (deprecated) — still referenced somewhere?
- `.sr-only` defined twice in system.css
- `@keyframes fadeUp` defined twice (8px vs 12px starting y-translate)
- `gap-7` uses hardcoded 28px instead of `var(--space-7)`

---

## Accessibility-Visual Overlap

### Color Contrast
- ✅ `--muted` tuned to WCAG AAA (7:1) per PRODUCT.md
- ✅ Focus-visible ring on all interactive elements
- ⚠️ 9px nav section label (`.shell-nav-section-label`) — below any readable threshold

### Typography Readability
- ✅ Body text at 16px — good baseline
- ✅ Line-height 1.7 on body — generous
- ⚠️ Line length unconstrained on wide screens (90+ chars in some cards)
- ⚠️ KPI label at 11px uppercase — tight for readability

### Touch Targets
- ✅ Buttons enforce 44px min-height — WCAG compliant
- ✅ Form inputs use adequate padding
- ✅ Mobile nav buttons have generous tap targets

### Visual Indicators
- ✅ Color is never the sole indicator — status pills use icon + text + color
- ✅ Pill status has aliases with clear labels
- ✅ Interactive elements have text labels alongside icons

---

## Prioritized Recommendations

### Phase 1: Quick Wins (1-2 days, High ROI)

**Visual Impact: ★★★★★ | Effort: Low | Cost: ~10 hours**

1. **Fix gap-7 to use token** — `28px` → `var(--space-7)` in system.css (1min)
2. **Bump section nav label from 9px to 11px** — accessibility fix (1min)
3. **Fix duplicate `.sr-only`** — remove one declaration (5min)
4. **Consolidate duplicate `@keyframes fadeUp`** — keep the 8px variant (5min)
5. **Add grain texture to teacher dashboard** — `.td-shell` gets `bg-grain` class (10min)
6. **Replace inline textarea in student-home.jsx** — use `.input` class (20min)
7. **Add tone-coded top borders to teacher dashboard KPIs** — like `.student-metric--teal` etc. (30min)
8. **Increase KPI card padding** — `--space-4` instead of `--space-3` (10min)
9. **Fix `.text-body-lg` line-height to match body** — currently 1.7 vs 1.6 inconsistency (5min)

### Phase 2: Systematic Cleanup (1 week)

**Visual Impact: ★★★★☆ | Effort: Medium | Cost: ~40 hours**

1. **Replace hardcoded hex in reports.jsx** — hero, chart bars, row gradients (4h)
2. **Standardize card padding across reports.jsx** — eliminate 14/16/18px ad-hoc values (2h)
3. **Convert 80 inline styles in diagnostic-create.jsx to `.dx-*` CSS classes** (8h)
4. **Convert 65 inline styles in submission-review.jsx to `.sr-*` CSS classes** (6h)
5. **Migrate ad-hoc inline styles in student-home.jsx, student-progress.jsx** (4h)
6. **Consolidate modal variants** — review modal → standard modal (2h)
7. **Standardize student hero components** — reusable pattern for all 5 pages (4h)
8. **Add Select component** — consistent cross-browser dropdown (2h)
9. **Consolidate `ReviewStatusBadge` into `Pill`** (1h)
10. **Migrate deprecated color tokens** — audit and replace `--accent-deep`, `--primary-ink` (3h)

### Phase 3: Visual Enhancement (2 weeks)

**Visual Impact: ★★★★☆ | Effort: High | Cost: ~80 hours**

1. **Split CSS into tokens/base/components** — maintainable architecture (6h)
2. **Evolve card surface from pure white to warm tint** — premium feel (1h + QA)
3. **Create 5-6 empty state illustrations** — consistent fallback experience (6h)
4. **Add breadcrumb component** — context for deep navigation (4h)
5. **Design logo mark** — small SVG for topbar brand reinforcement (3h)
6. **Standardize page templates (list/split/detail)** — shared CSS patterns (16h)
7. **Add page-layout-matching skeletons** — enhanced PageLoader (4h)
8. **Fix mobile nav to surface all views** — overflow menu or swipeable (4h)
9. **Add container queries** — responsive card components (4h)
10. **Enhanced teacher hero area** — subtle gradient, grain, decorative elements (4h)

---

## Design Quality Checklist

### Typography ✓
- [x] Body text 16px minimum ✅
- [ ] Consistent type scale (max 6-8 sizes) — ✅ 11 sizes but some unused
- [x] Line height 1.5-1.6 for body — ✅ 1.7 (generous)
- [x] Max 2-3 typefaces — ✅ 2 (Sora + DM Sans)
- [x] Font weights used intentionally — ✅ 4 weights with clear purposes
- [ ] Line length 50-75 characters — ⚠️ Unconstrained on wide screens

### Color ✓
- [x] Defined color palette — ✅ Complete
- [ ] All combinations pass WCAG AA contrast — ⚠️ Untested for all combos
- [x] Color shades available — ✅ 17 opacity variants
- [x] Intentional color usage — ✅ Brand-aligned
- [ ] Consistent application across site — ⚠️ Some hardcoded hex remains

### Spacing ✓
- [ ] Consistent spacing scale — ✅ Tokens exist but bypassed in some files
- [ ] Generous white space — ⚠️ Teacher side could use more
- [ ] Elements have breathing room — ✅ Generally good
- [ ] Padding/margin follows system — ⚠️ Ad-hoc values in reports.jsx
- [ ] No random spacing values — ⚠️ Some 18, 14, 16, 24px ad-hoc values

### Components ✓
- [x] All interactive states defined — ✅ Hover, active, focus, disabled
- [x] Buttons look clickable — ✅ Pill shape, shadow, hover elevation
- [x] Form inputs clear and labeled — ✅ With 11px uppercase labels
- [x] Cards well-defined — ✅ 3 variants, hover states
- [x] Icons consistent style — ✅ Feather-style, all outline
- [ ] Components reusable — ⚠️ 3 styling patterns complicate reuse

### Consistency ✓
- [ ] Same actions look the same — ✅ Mostly, except modal variants
- [x] Border radius consistent — ✅ 5-set system
- [x] Shadow system applied uniformly — ✅ 5 levels
- [x] Icon style cohesive — ✅ 60+ icons in same style
- [ ] Design patterns repeated — ⚠️ Page layouts vary across sections

### Layout ✓
- [ ] Clear grid system — ⚠️ Some grids in JS, some in CSS
- [x] Elements aligned — ✅ Generally clean alignment
- [x] Balanced composition — ✅
- [x] Responsive breakpoints defined — ✅ 5 breakpoints
- [ ] Visual flow guides eye — ⚠️ Teacher dashboard competes for attention

---

## Methodology Notes

- **Evaluation Method**: Expert visual design review via static code analysis
- **Standards**: Current product-design conventions for educational SPA platforms
- **Focus**: Visual aesthetics, polish, consistency, design system maturity
- **Limitations**:
  - No live browser rendering — analysis from CSS/JSX code only (no visual regression testing)
  - No user testing — perception-based evaluation
  - Subjective elements: some design preferences vary
- **Complement with**: Live visual walkthrough, user testing, A/B testing of proposed changes
