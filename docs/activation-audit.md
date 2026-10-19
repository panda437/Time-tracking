# Signup-to-first-entry audit — 19 October 2026

Reviewed main at ccddf12d2179add805de721456c06308c8386db8. Repository code is not proof that this version is deployed.

## What is measured

The supplied evidence reports four signup notifications, 8–15 October, all Google OAuth. The auth callback creates a User before sending the notification. This supports registrations, not activation. Notifications are not necessarily an exhaustive signup ledger: delivery can fail.

No production database or GA4 report was retrieved in this investigation. The workspace has no MONGODB_URI. GA4 collection ID G-03R4WGQ6KX is not reporting authorization. Plugin discovery found Windsor.ai with GA4 support, but it is not connected. First-entry conversion, time-to-first-entry, and returns for the four users remain UNKNOWN, not zero.

## Current event inventory and limitations

| Event | Trigger | What it can establish / gap |
| --- | --- | --- |
| create with event_category=time_entry | Quick Entry and gap-fill successful POST; now also Time Slots | Saved-entry action observed by client, not unique activated users. No authenticated browser user_id or signup event joins it to these four users. |
| submit with event_category=form_interaction | Quick Entry after successful POST | Success, not submission attempt. No attempt/error funnel. |
| task_milestone / three_tasks_milestone | Dashboard/calendar client counters | Browser-wide localStorage dedupe; dashboard uses current-week entries, not lifetime total. Not reliable per-account lifetime milestones. |
| day_2_return | Root analytics component mount | Any browser with yesterday's visit, including anonymous pages; not signup-relative. Shared browser, cleared storage and devices distort it. Mount can run before gtag exists yet still mark it tracked. |
| task_milestone_reached / three_tasks_success | Entries API count after save | Lifetime surviving entries, but deletion can re-cross milestones and concurrent saves can miss them. Fire-and-forget delivery; GA4 secret required. Synthetic client ID is not joined to browser client ID. |
| first_activity / day_2_retention | Server helper definitions | No call sites found; definitions do not establish recorded events. |

Server serialization used `parameters` where GA4 requires `params`. This patch fixes the envelope, not historical data. A 2xx collection response does not verify ingestion. Reference: https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference

## Concrete friction and changes

- Goals selection followed by category selection appears before first value; Skip is available. No measurement establishes whether this actually caused abandonment. Consider making setup secondary to saving one entry, then test it.
- Dashboard inserts a default goal, but checks goal emptiness to decide onboarding. A subsequent visit can therefore skip unfinished onboarding. A persisted hasCompletedOnboarding field exists but this flow does not use it. Left for a focused follow-up.
- Onboarding's supposedly all-entry check used `/api/entries`, which defaults to the current week. Fixed to `?period=all`.
- First-entry detection also used current-week entries plus goal presence. Removed the forced two-second reflection redirect and its misleading first-entry flag. Users can now inspect the entry or add another without being sent away.
- Failed Quick Entry and Time Slot saves had console-only feedback. Added visible accessible errors, preserving inputs for retry. Network failures can still have an ambiguous save outcome; an idempotency key is a separate improvement.
- Time Slot successful saves now emit the existing create/time_entry event, matching Quick Entry. This changes coverage going forward; annotate the deployment date in analytics.
- Preserved saved activity text in the Quick Entry success confirmation after the form resets.
- Dashboard also imposes a one-second delay and fetches goals twice; these are likely friction, not measured causes. No broad initialization rewrite included.

## Evaluate the four registrations

Use a read-only production MongoDB account and `scripts/signup-cohort.cjs`. No database writes, indexes, migrations or public reporting endpoint are added. The script outputs internal IDs and counts, not emails or activity content.

Example if the notification date range is in India time (confirm before running):

```sh
node scripts/signup-cohort.cjs 2026-10-08T00:00:00+05:30 2026-10-16T00:00:00+05:30 2026-10-19T00:00:00+05:30
```

Use the existing MONGODB_URI environment variable or .env.local; do not commit credentials. Match the four notification emails to User records privately, then append their database IDs to the command. Date-only selection may include other registrations; authentication provider is not persisted. Confirm matchedUsers equals four before using four as a denominator. Do not infer Google OAuth from an absent password.

For each user the report returns earliest surviving entry creation time, observed count, minutes since signup, entry within 24h, entry in [24h,48h), and later-UTC-date entry evidence. It uses createdAt, not backdatable startTime. Missing observation time returns null. No surviving entry means no observed surviving entry, not proof of never saving; deletion loses history. The earliest surviving entry may not be the actual first entry.

A later entry is evidence of a later write, not proof of a new session. Visits without writing are unknown. Never label this report's second-day write metric as app-return retention. Compare windows consistently; the October 15 cohort has not completed seven days of follow-up as of October 19.

## Next measurement steps

1. Run the read-only report for the exact four IDs. Present counts such as 2/4, not percentages alone. Label historical activation estimates as based on surviving records.
2. Connect GA4 reporting (Windsor.ai is an available option) and inspect the event inventory for October 8 onward. Existing aggregate events cannot by themselves be attributed to those exact four accounts. Do not sum client and server milestone events as independent successes.
3. In a separate change, persist an immutable first-entry timestamp and authenticated activity dates, with atomic updates and clear retention/privacy rules. Historical first entries can only be backfilled as earliest surviving entries, explicitly marked as estimates. Persist signup provider on new registrations if provider cohorts are needed.
4. Add a pseudonymous authenticated user_id consistently to browser events, with clearing on logout, plus explicit signup, dashboard_view, entry_attempt, entry_saved and entry_failed events. Never send email, name, titles or free-text activity data. Scope onboarding/milestone state per account. Define return as an authenticated visit on the next signup-relative day in a fixed timezone, and track repeat entry creation separately as evidence of ongoing value.
5. Validate events in GA4 DebugView/Measurement Protocol validation after deployment, including both entry modes, an API failure, reload, another account and a next-day visit. New instrumentation cannot retroactively recover missing visits.

## Validation

Run `node --test scripts/signup-cohort.test.cjs scripts/analytics-payload.test.cjs` for timestamp boundaries, incomplete windows, backdated activities and GA4 serialization. All four focused tests and the patch whitespace check passed. Full TypeScript check reports four errors in the unchanged __tests__/api/routes.test.ts (mockEntries typing and undefined mockPrisma); no changed-source errors were reported. No live OAuth, database or GA4 ingestion test was performed.

Rollback: revert the PR. No schema or production data changes are required.
