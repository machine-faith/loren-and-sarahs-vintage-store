# Project Directives & Engineering Memory

## Cardinal Rule: Verification & Zero False Completions
- **NEVER declare a task, feature, or bug "fixed" or "working" just because:**
  1. The code compiles without syntax errors.
  2. Types pass in `npm run build` or `tsc`.
  3. Commits push to GitHub.
  4. It "looks" right or returns a simulated mock status.
- **You have NOT helped until it actually works in real execution.**
- **Mandatory Pre-Completion Verification Checklist:**
  1. **Full Lifecycle State Trace:** Trace variables from initial render -> localStorage mount -> server API fetch -> component re-render. Verify that default server payloads (e.g. `bandspot.json`) do not silently overwrite client state or flip active settings back to defaults.
  2. **Audit Silent Guards & Mock Flags:** Check for any legacy guards like `simulationMode`, mock fallbacks, or silent error swallowing that return fake success objects while skipping the real network/IMAP/SMTP socket calls.
  3. **Real Socket & API Execution:** Ensure real credentials actually reach the real external endpoint (e.g. IMAP socket to Google, database, or API) and perform the actual work.
  4. **Surface Real Errors:** Never fail silently or report success with 0 items. Always bubble up genuine error messages if an operation fails.

---

## Architectural Directives & Operational Memory

### 1. Serverless Statelessness: Never Rely on `/tmp` Across Batches
- Vercel routes sequential client requests across different container instances (cold starts, auto-scaling).
- `/tmp` files written by Container A are completely invisible to Container B.
- **Rule:** Every batch draft request sent from the client must be 100% self-contained, carrying its own rendered drafts (`id`, `to`, `subject`, `body`) and active account credentials (`channel`, `gmailUser`, `gmailAppPassword`, `secondaryGmailUser`, `secondaryGmailAppPassword`).

### 2. Vercel Production Deployment Protocol
- This repository (`Love Banana Marketing Guy` inside `loren-and-sarahs-vintage-store`) is **not** automatically triggered on Vercel by GitHub webhooks.
- **Rule:** Every production release must be explicitly built and deployed using `npx vercel --prod --yes` from the `Love Banana Marketing Guy` directory. Never assume a `git push` has updated the live URL.

### 3. Real Progress Tracking & Zero Fake Counters
- Never do fallback math like `totalDrafted += (draftData.draftedCount || chunk.length)`. When an endpoint returns 0 drafts, `0 || 4` evaluates to `4`, causing fake 100% completion banners.
- Counters must strictly increment by `draftData.draftedCount` (confirmed Google IMAP `APPENDUID` count).
- Confirmed draft contact IDs must be stored incrementally in `localStorage` (`lb_drafted_contact_ids`) so users can resume or filter using the `REMAINING ONLY` button without duplicating drafts.

### 4. Outreach Copy & Identity Standard
- **Musician Identity Opening:**
  Across all channels (Radio, Blogs, Magazines, Follow-ups), the direct musician intro must say:
  `"My name is Henry and I play guitar and sing in Love Banana from Sydney."`
  (or `"My name is Henry and I play guitar and sing in Love Banana from Sydney, Australia."` for international recipients).
- **Core Link Hierarchy:**
  Always maintain this 3-part asset link order:
  1. `• WAV Master: https://love-banana-epk.vercel.app/downloads/Love%20Banana%20-%20Seagull.wav`
  2. `• Album & Singles: https://love-banana-epk.vercel.app/album.html` (The primary hub for promoting the singles and album stream to radio stations, blogs, and press)
  3. `• EPK & Stream: https://love-banana-epk.vercel.app/epk.html` (or `EPK & Press Photos: ...` for press/blogs)
