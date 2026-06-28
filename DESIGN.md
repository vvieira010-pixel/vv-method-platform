# Design System: MET Proficiency Mastery

## 1. Visual Theme & Atmosphere
A calm, focused, and expert interface designed for healthcare professionals. The atmosphere is "Balanced Daily App" (Density 5) with "Offset Asymmetric" layouts (Variance 6) and "Fluid CSS" motion (Motion 6). It feels like a high-end private tutoring studio: quiet confidence, professional restraint, and an obsession with clarity and precision.

## 2. Color Palette & Roles
- **Cloud Canvas** (#F4F9FC) — Primary background surface, providing a cool, airy base.
- **Warm Surface** (#FEFCF5) — Card and container fill, adding a subtle, human warmth to focused work areas.
- **Deep Navy Ink** (#071527) — Primary text and high-depth elements (Zinc-950 equivalent).
- **Steel Muted** (#3D5365) — Secondary text, metadata, and descriptions.
- **Whisper Border** (#D0E2E8) — Structural lines and subtle dividers.
- **Medical Teal** (#148891) — Single accent for primary CTAs, active states, and focus rings. Saturation kept below 80% for professional restraint.

## 3. Typography Rules
- **Display:** Sora — Bold, geometric, and track-tight. Used for page headings and hero text to communicate authority and expertise.
- **Body:** Outfit — Clean, professional, and highly legible. Relaxed leading with a maximum width of 65ch for prose.
- **Mono:** SF Mono / JetBrains Mono — Used exclusively for high-density numbers, timestamps, and metadata to ensure tabular alignment.
- **Banned:** Inter is strictly banned for premium surfaces. Generic serifs are banned in all dashboard and software UI.

## 4. Component Stylings
- **Buttons:** Pill-shaped (`--radius-pill`). Tactile -1px translate on active state. Primary buttons use Medical Teal fill; secondary buttons use ghost/outline styles. No neon outer glows.
- **Cards:** Borderless design. Elevation is communicated exclusively through diffused navy-tinted shadows (`rgba(15,27,45, 0.08)`). Generously rounded corners (`--radius-sm`).
- **Inputs:** Label placed above the input. Focus ring in Medical Teal. Error messages appear clearly below the input. No floating labels.
- **Loaders:** Skeletal shimmer effects that match the exact layout dimensions of the content they replace. No circular spinners.
- **Empty States:** Composed layouts featuring a centered illustrative icon, a clear heading, and a primary "get started" action.

## 5. Layout Principles
- **Asymmetric Balance:** Avoid centered symmetry. Use split-screen layouts (e.g., Brand Panel vs. Sign-in) and offset margins to create a dynamic, modern feel.
- **Grid-First Architecture:** CSS Grid for all 2D structures. No flexbox percentage math.
- **Containment:** All content is wrapped in a centered container with a max-width of 1200px.
- **Viewport Stability:** Full-height sections use `min-h-[100dvh]` to prevent iOS Safari layout jumping.

## 6. Motion & Interaction
- **Spring Physics:** All interactive elements use a weighty, premium feel (`stiffness: 100, damping: 20`). No linear easing.
- **Staggered Reveals:** Lists and dashboard widgets use a cascade delay (waterfall reveal) on mount.
- **Perpetual Micro-motion:** Active status indicators use a subtle, infinite pulse or shimmer loop.
- **Performance:** Animations are limited to `transform` and `opacity`. Background grain is applied via a fixed pseudo-element overlay to prevent layout thrash.

## 7. Anti-Patterns (Banned)
- **No Emojis:** Professional, clinical tone only.
- **No Pure Black:** Use Deep Navy Ink (#071527) instead of #000000.
- **No Side-Tabs:** Thick colored borders on the left side of cards are strictly forbidden.
- **No Neon Glows:** No outer glows or purple/blue neon gradients.
- **No 3-Column Grids:** Equal-width 3-card rows are banned; use asymmetric grids or zig-zag layouts.
- **No AI Copy-clichés:** "Elevate", "Seamless", "Unleash", and "Next-Gen" are banned.
- **No Filler UI:** "Scroll to explore" or bouncing chevrons are forbidden.
