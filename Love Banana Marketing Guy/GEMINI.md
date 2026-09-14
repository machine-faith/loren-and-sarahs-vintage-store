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
