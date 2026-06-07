---
target: src/tools/tool-diagnostic.jsx
total_score: 18
p0_count: 1
p1_count: 3
timestamp: 2026-06-07T05-52-36Z
slug: src-tools-tool-diagnostic-jsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No progress indicator during 30-90s AI call |
| 2 | Match System / Real World | 3 | MET/CEFR vocabulary correct; Pre-analyze label slightly ambiguous |
| 3 | User Control and Freedom | 2 | New Diagnosis silently discards unsaved AI result |
| 4 | Consistency and Standards | 2 | All inline styles, inconsistent font choices between textareas |
| 5 | Error Prevention | 1 | No confirmation on New Diagnosis or history delete, no autosave |
| 6 | Recognition Rather Than Recall | 2 | 8 rating inputs with no rubric; Pre-analyze vs Run distinction opaque |
| 7 | Flexibility and Efficiency | 2 | No keyboard shortcuts, no batch actions, no export |
| 8 | Aesthetic and Minimalist Design | 2 | 7 identical cards in result view, no visual hierarchy |
| 9 | Error Recovery | 2 | Error state solid; raw API errors occasionally surface |
| 10 | Help and Documentation | 0 | No tooltips, no scale rubric, no empty-state guidance |
| Total | | 18/40 | Acceptable — significant improvements needed |

## Priority Issues
P0: Unsaved AI result silently destroyed on New Diagnosis click
P1: No progress feedback during 30-90 second AI call
P1: Result view is information-flat — 7 equal-weight cards, priorities at position 3
P1: Skill rating inputs have no scale rubric
P2: No confirmation on destructive delete actions
