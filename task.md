# Task List: Education Fair Lead Command Center

- `[x]` **Phase 10: Counselor Dashboard Overhaul**
  - `[x]` Provide V4 SQL (assigned_countries column).
  - `[x]` Refactor Counselor Layout (remove sidebar, add TopNav).
  - `[x]` Update Counselor Page Data Fetching (Jurisdictional filtering).
  - `[x]` Implement Independent Multi-Country Views.
  - `[x]` Consolidate UI (Remove duplicate search bars).
  - `[x]` Finalize Role-Based Redirects.

- `[x]` **Phase 11: Workspace Evolution (Legacy Bulky Style)**
  - `[x]` implement Professional "Case File" UI in `counselor/page.tsx`.
  - `[x]` Add "Edit Mode".
  - `[x]` Implement Printing.

- `[x]` **Phase 12: Minimalist "Productive" Theme Redesign**
  - `[x]` Clean up `src/app/counselor/page.tsx` typography (Black -> Semibold).
  - `[x]` Remove heavy shadows and borders.
  - `[x]` Implement "Flat" card design for student list.
  - `[x]` Simplify the Action Bar and Student Detail layout.
  - `[x]` Optimize whitespace and dividers (Google/Apple style).

- `[x]` **Phase 13: Voice-to-Text Integration**
  - `[x]` Implement Web Speech API wrapper in `counselor/page.tsx`.
  - `[x]` Add Microphone UI with pulsate animation.
  - `[x]` implement text-appending logic.
  - `[x]` Handle browser permissions and errors.
  - `[x]` Verify real-time transcription.

- `[x]` **Phase 14: Student Status Portal & QR**
  - `[x]` Create public-facing secure status portal.
  - `[x]` Implement security hashing for status URLs.
  - `[x]` Add QR Pass generation in Counselor Dashboard.
  - `[x]` Enable Search/Verify landing page at `/status`.
  - `[x]` Robust Print Layout Fix
    - `[x]` Update `globals.css` with comprehensive print overrides
    - `[x]` Apply `no-print` classes to the Sidebar in `counselor/page.tsx`
    - `[x]` Flatten the flex container structure for print in `counselor/page.tsx`
    - `[x]` Resolve duplicate print pages by conditionalizing the print brief
    - `[x]` Verify print preview with the user
  - `[x]` Counselor Dashboard Refinement
    - `[x]` WhatsApp share tracking & count display (`counselor/page.tsx`)
    - `[x]` Show sidebar for Admin users in counselor view (`counselor/layout.tsx`)
    - `[x]` Redesign Student Detail Workspace (Pro/Minimalist UI)
        - `[x]` Header & Action Buttons Refinement
        - `[x]` Status Selector Overhaul
        - `[x]` Academic Details Grid Clean-up

  - `[ ]` Build "Desk Load" heatmap grid.
  - `[ ]` Add Real-time status breakdown (New vs Warm vs Hot).
  - `[ ]` Enhance Admin UI with sapphire/slate theme.
  - `[ ]` Verify real-time metric syncing.
