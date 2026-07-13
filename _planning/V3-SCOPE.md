# V3 scope — CAD Intuition Gym

Written 2026-07-12 (sub-agent-setup round).

## Status update — 2026-07-12, same day: approved and built

Justin approved all three items ("Triple yes. Let's build this"). All three
are built on branch `claude/sub-agent-setup-favz3d`, smallest-first as
recommended: §3 share polish, then §2 recap, then §1 E6. One authored
deviation from the draft below: E6's main scene was reshaped from
fillet-vs-holes to a growing connector opening with cover screws — the
fillet geometry proved visually weak at the app's fixed 1.6 px/mm scale (a
corner round only ever removes ~0.4 r of material along the diagonal, a
few px), which would have violated the "visually undeniable" hard rule.
The judgment taught is exactly the drafted one. **The branch stays
unmerged until Justin plays E6 and the recap** — new exercise content and
scene states are gated on his playthrough, per the standing rule.

Original scoping (historical) below.

## Where v2 ended

All of `V2-SCOPE.md` is shipped and merged to `main` as of 2026-07-11:
GitHub Pages live, predict-friction closed (light tap stays), bridge cards
(PR #4), and E5 with the in-scene feature tree (PR #5, merged by Justin
after his playthrough). The app is five exercises, QA'd at 212/212, live at
https://lpcode808.github.io/CAD-Intuition-Gym/.

## Candidates, with a recommendation

### 1. E6 — the tree is a sequence: order matters *(recommended if any exercise is next)*

**The judgment:** downstream features consume upstream results, so the
*order* of decisions in the tree is itself a modeling decision. Two trees
with identical features in different orders are different parts.

**Why now:** E5 built the exact scene vocabulary this needs —
`featureTree()` / `leaderLine()` rows with active/error states, and the
violet edit-scope wash. Before E5 this exercise cost "one exercise plus a
new visual component"; now it's roughly one exercise. That cost collapse is
the argument for E6-order over other candidates.

**Draft shape (E1–E5 template):**
- **Intent:** a plate gets rounded corners (fillet) and a grid of small
  holes near one edge. The hole grid must always sit clear of the rounds.
- **Choices:** (a) holes first, then fillet the corners; (b) fillet first,
  then place the hole grid relative to the finished corner.
- **Change request:** "the corner radius doubles" — under one ordering the
  enlarged round swallows the nearest holes (undeniable: red hole outlines
  inside the round, "N mm inside the round" callout); under the other the
  grid was placed against the post-fillet geometry and stays clear.
- **Takeaway:** "The tree is a sequence of decisions. Put a decision after
  the geometry it depends on."
- **Counter-context:** two genuinely independent features (a hole and a
  logo engrave on opposite ends) where forcing a dependency-order reads as
  false precision — reordering them changes nothing, and treating order as
  meaningful here is noise. Order matters only where dependency is real.
- **Open design question for Justin:** the failure scene needs a
  "re-evaluated tree" moment (same rows, different order, different
  geometry). Is showing two orderings side-by-side in compare mode enough,
  or does it need a reorder animation? (Recommendation: compare mode is
  enough; no animation.)

### 2. Completion recap — "the five decisions" on one screen *(cheap, low risk)*

After all exercises are done, the home screen gains a quiet recap block:
each exercise's takeaway line paired with its counter-moral ("…unless the
intent is X"), on one screen. Reinforces the spine as a checklist the
learner leaves with; costs a render branch in `renderHome()` plus copy.
No new scene vocabulary, no progress-schema change (derivable from
existing `done` flags). Skippable visual noise risk is the main concern —
keep it collapsed or below the fold.

### 3. Share polish for the live site *(tiny)*

`index.html` head-only: meta description + Open Graph/Twitter card (title,
one-line description, a static preview image checked into the repo) so the
Pages link unfurls properly when shared. No behavior change. The preview
image is the only real work — it should be a real screenshot of a
consequence moment, not a logo.

### Explicitly not v3 (reaffirmed non-goals)

Analytics of any kind, accounts/backend, authoring tools, a real solver,
comprehensive feature coverage, reopening predict friction, E7+ beyond a
single approved E6. Per PRD §10/§11 and the standing decisions in
`CLAUDE.md`/`AGENTS.md`.

## What Justin needs to decide

1. Build E6-order as drafted, reshape it, or hold at five exercises?
2. Recap screen: yes/no?
3. Share meta/OG polish: yes/no? (Lowest risk; fine to bundle with either.)

Recommended order if all three are approved: 3 → 2 → 1 (smallest to
largest, matching the v2 pattern of landing cheap reviewed bases first).
