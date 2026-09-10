# Pilot Fatigue Calculator

A browser-based calculator for adding and subtracting entered durations across time zones. It does not decide whether an entry represents block time, airborne time, or duty time.

The searchable airport catalogue is generated from the OurAirports public-domain dataset. Run `npm run airports:update` to refresh it. Airport timezones are derived from coordinates using `tz-lookup`.

Local dates and times are converted with the IANA timezone rules bundled by `moment-timezone`. Repeated or nonexistent local times during daylight-saving clock changes are rejected instead of silently guessed. The interface displays the bundled timezone-data version.

Legs with arrival before departure or a zero duration are rejected. Durations over 24 hours require explicit confirmation before they are included in the total.

New legs default to the calendar date shown on the pilot's device rather than the current UTC date.

Each valid local departure and arrival is also shown in UTC so the pilot can verify the timezone conversion.

`npm run test:calculations` checks International Date Line, overnight, and half-hour-offset scenarios. `npm run test:calculations:store` also saves the run and individual results to protected Convex tables when `TEST_RESULTS_CONVEX_URL` and `TEST_RESULTS_WRITE_KEY` are configured.

`npm run test:browser` opens the app in a temporary headless browser and checks airport selection, UTC conversion, totals, adding and removing legs, clearing the form, and a phone-sized layout. Tracking is disabled during this test.

`/analytics.html` is an admin dashboard. Its API requires `ANALYTICS_ADMIN_KEY` in Vercel, then uses the server-only `CONVEX_ANALYTICS_READ_KEY` to read summary data from Convex. Convex must have the same value stored as `ANALYTICS_READ_KEY`.

After the dashboard tables are first deployed, run `npx convex run dashboard:initialize --prod` once to include existing analytics in the summary.

## Local development

1. Install packages with `npm install`.
2. Connect Convex with `npx convex dev` and follow its prompts.
3. Start the app with `npm run dev`.

Anonymous analytics use a random browser ID stored locally. They record page visits, calculator actions, routes, flight dates and times, and calculated durations. They do not collect names or email addresses.

The analytics endpoint accepts only the app's known events, limits field and route sizes, and allows at most 60 events per anonymous browser per minute. Because browsers submit anonymously, a determined person can still create new browser IDs and send false records.
