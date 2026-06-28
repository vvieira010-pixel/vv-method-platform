# Component Guide — MET Proficiency Mastery

This document provides a technical reference for the shared UI components used across the platform.

## Core Primitives

### `shared.jsx`
The central hub for design system primitives.
- **`Icon`**: A mapping of SVG icons. Usage: `<Icon.home size={16} />`.
- **`Button`**: Wrapper around HTML button with design system variants.
- **`Card`**: Container with a consistent shadow and border-radius.
- **`Pill`**: Small, rounded labels for status or categorization.
- **`Modal`**: Centered overlay for focused interactions.
- **`Breadcrumb`**: Navigation trail for deep-linked pages.

### `ui/Button.jsx`
Specialized button component.
- **Variants**: `primary` (teal), `ghost` (outline), `danger` (red).
- **Sizes**: `sm`, `md`, `lg`.

### `ui/Card.jsx`
The primary containment element.
- **Styling**: Borderless, uses `--shadow-sm`.

## Page-Specific Components

### `exercise-editor.jsx`
Complex interface for creating exercises.
- **`ExerciseTypePicker`**: Allows teachers to select exercise types and quantities.
- **`ExTypeBadge`**: Visual indicator of the exercise type.

### `exercise-player.jsx`
The student-facing engine for interacting with exercises.
- Supports 7+ different exercise types (MCQ, Blank-fill, Short answer, etc.).
- Integrates with the spaced-repetition engine for review sessions.

## Implementation Guidelines

### 1. Styling approach
Prefer using **design system tokens** (CSS variables) over hardcoded values:
- `padding: var(--space-4)` instead of `padding: 16px`
- `color: var(--primary)` instead of `color: #148891`
- `font-size: var(--text-sm)` instead of `font-size: 14px`

### 2. Consistency
When creating new components:
- Mimic the layout of existing cards and buttons.
- Use `Sora` for headings and `Outfit` for body text.
- Maintain a generous use of white space (avoid "cramming" content).
- Ensure all interactive elements have clear `:hover` and `:active` states.

### 3. Accessibility
- Use semantic HTML (`<article>`, `<section>`, `<nav>`).
- Ensure all buttons and inputs have accessible labels.
- Maintain a contrast ratio of at least 4.5:1 for text.
- Support keyboard navigation (Enter to submit, Tab to navigate).
